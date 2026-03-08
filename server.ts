import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("fleet.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT NOT NULL,
    type TEXT NOT NULL,
    plate TEXT NOT NULL,
    driver TEXT,
    km_current INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Rodando',
    last_maintenance_km INTEGER DEFAULT 0,
    is_contracted INTEGER DEFAULT 0,
    contract_company TEXT,
    contract_closing_day INTEGER,
    contract_value REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS maintenances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    type TEXT DEFAULT 'Preventiva',
    km INTEGER NOT NULL,
    mechanic TEXT NOT NULL,
    services TEXT,
    other_services TEXT,
    observations TEXT,
    cost REAL DEFAULT 0,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS agenda (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week TEXT NOT NULL,
    vehicle_id INTEGER NOT NULL,
    status TEXT DEFAULT 'Pendente',
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );

  CREATE TABLE IF NOT EXISTS maintenance_intervals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_type TEXT NOT NULL UNIQUE,
    interval_km INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mechanics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  -- Insert default interval if not exists
  INSERT OR IGNORE INTO maintenance_intervals (service_type, interval_km) VALUES ('Geral', 10000);

  -- Ensure last_maintenance_km column exists (for existing databases)
  -- We use a separate try-catch block for this in the code below
`);

try {
  db.exec("ALTER TABLE vehicles ADD COLUMN last_maintenance_km INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.exec("ALTER TABLE vehicles ADD COLUMN is_contracted INTEGER DEFAULT 0");
} catch (e) {}

try {
  db.exec("ALTER TABLE vehicles ADD COLUMN contract_company TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE vehicles ADD COLUMN contract_closing_day INTEGER");
} catch (e) {}

try {
  db.exec("ALTER TABLE vehicles ADD COLUMN contract_value REAL DEFAULT 0");
} catch (e) {}

try {
  db.exec("ALTER TABLE maintenances ADD COLUMN start_time TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE maintenances ADD COLUMN end_time TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE maintenances ADD COLUMN type TEXT DEFAULT 'Preventiva'");
} catch (e) {}

// Sync last_maintenance_km for existing vehicles that might have it as 0
db.exec(`
  UPDATE vehicles 
  SET last_maintenance_km = COALESCE(
    (SELECT MAX(km) FROM maintenances WHERE vehicle_id = vehicles.id),
    km_current
  )
  WHERE last_maintenance_km = 0 OR last_maintenance_km IS NULL;
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/vehicles", (req, res) => {
    const vehicles = db.prepare("SELECT * FROM vehicles").all();
    res.json(vehicles);
  });

  app.post("/api/vehicles", (req, res) => {
    const { number, type, plate, km_current, status, is_contracted, contract_company, contract_closing_day, contract_value } = req.body;
    const info = db.prepare(
      "INSERT INTO vehicles (number, type, plate, km_current, status, last_maintenance_km, is_contracted, contract_company, contract_closing_day, contract_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(number, type, plate, km_current, status, km_current, is_contracted ? 1 : 0, contract_company, contract_closing_day, contract_value || 0);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/vehicles/:id", (req, res) => {
    const { id } = req.params;
    const { number, type, plate, km_current, status, is_contracted, contract_company, contract_closing_day, contract_value } = req.body;
    db.prepare(
      "UPDATE vehicles SET number = ?, type = ?, plate = ?, km_current = ?, status = ?, is_contracted = ?, contract_company = ?, contract_closing_day = ?, contract_value = ? WHERE id = ?"
    ).run(number, type, plate, km_current, status, is_contracted ? 1 : 0, contract_company, contract_closing_day, contract_value || 0, id);
    res.json({ success: true });
  });

  app.delete("/api/vehicles/:id", (req, res) => {
    const id = parseInt(req.params.id);
    console.log(`Attempting to delete vehicle ${id}`);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid vehicle ID" });
      return;
    }

    try {
      const deleteVehicle = db.transaction((vehicleId) => {
        db.prepare("DELETE FROM agenda WHERE vehicle_id = ?").run(vehicleId);
        db.prepare("DELETE FROM maintenances WHERE vehicle_id = ?").run(vehicleId);
        const result = db.prepare("DELETE FROM vehicles WHERE id = ?").run(vehicleId);
        return result;
      });

      const result = deleteVehicle(id);
      
      if (result.changes === 0) {
        res.status(404).json({ error: "Vehicle not found" });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ error: "Failed to delete vehicle" });
    }
  });

  app.get("/api/maintenances", (req, res) => {
    const { vehicleId } = req.query;
    let query = "SELECT m.*, v.plate as vehicle_plate, v.type as vehicle_type FROM maintenances m JOIN vehicles v ON m.vehicle_id = v.id";
    let params = [];
    if (vehicleId) {
      query += " WHERE m.vehicle_id = ?";
      params.push(vehicleId);
    }
    query += " ORDER BY m.date DESC";
    const maintenances = db.prepare(query).all(...params);
    res.json(maintenances);
  });

  app.post("/api/maintenances", (req, res) => {
    const { vehicle_id, date, start_time, end_time, type, km, mechanic, services, other_services, observations, cost } = req.body;
    
    const transaction = db.transaction(() => {
      // Insert maintenance
      const info = db.prepare(
        "INSERT INTO maintenances (vehicle_id, date, start_time, end_time, type, km, mechanic, services, other_services, observations, cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(vehicle_id, date, start_time, end_time, type || 'Preventiva', km, mechanic, JSON.stringify(services), other_services, observations, cost || 0);

      // Update vehicle KM and last maintenance KM
      db.prepare(`
        UPDATE vehicles 
        SET km_current = MAX(km_current, ?), 
            last_maintenance_km = (SELECT MAX(km) FROM maintenances WHERE vehicle_id = ?) 
        WHERE id = ?
      `).run(km, vehicle_id, vehicle_id);

      return info.lastInsertRowid;
    });

    const maintenanceId = transaction();
    res.json({ id: maintenanceId });
  });

  // Intervals API
  app.put("/api/maintenances/:id", (req, res) => {
    const { id } = req.params;
    const { date, start_time, end_time, type, km, mechanic, services, other_services, observations, cost, vehicle_id } = req.body;
    
    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE maintenances 
        SET date = ?, start_time = ?, end_time = ?, type = ?, km = ?, mechanic = ?, services = ?, other_services = ?, observations = ?, cost = ? 
        WHERE id = ?
      `).run(date, start_time, end_time, type || 'Preventiva', km, mechanic, JSON.stringify(services), other_services, observations, cost || 0, id);

      // Update vehicle KM and last maintenance KM
      db.prepare(`
        UPDATE vehicles 
        SET km_current = MAX(km_current, ?), 
            last_maintenance_km = (SELECT MAX(km) FROM maintenances WHERE vehicle_id = ?) 
        WHERE id = ?
      `).run(km, vehicle_id, vehicle_id);
    });

    transaction();
    res.json({ success: true });
  });

  app.get("/api/intervals", (req, res) => {
    const intervals = db.prepare("SELECT * FROM maintenance_intervals").all();
    res.json(intervals);
  });

  app.put("/api/intervals/:id", (req, res) => {
    const { id } = req.params;
    const { service_type, interval_km } = req.body;
    db.prepare("UPDATE maintenance_intervals SET service_type = ?, interval_km = ? WHERE id = ?").run(service_type, interval_km, id);
    res.json({ success: true });
  });

  app.delete("/api/intervals/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM maintenance_intervals WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/intervals", (req, res) => {
    const { service_type, interval_km } = req.body;
    const info = db.prepare(
      "INSERT OR REPLACE INTO maintenance_intervals (service_type, interval_km) VALUES (?, ?)"
    ).run(service_type, interval_km);
    res.json({ id: info.lastInsertRowid });
  });

  // Reports API
  app.get("/api/reports", (req, res) => {
    const { startDate, endDate, vehicleType, serviceType } = req.query;
    
    let query = `
      SELECT m.*, v.plate as vehicle_plate, v.type as vehicle_type 
      FROM maintenances m 
      JOIN vehicles v ON m.vehicle_id = v.id
      WHERE 1=1
    `;
    let params = [];

    if (startDate) {
      query += " AND m.date >= ?";
      params.push(startDate);
    }
    if (endDate) {
      query += " AND m.date <= ?";
      params.push(endDate);
    }
    if (vehicleType) {
      query += " AND v.type = ?";
      params.push(vehicleType);
    }
    // Note: serviceType filtering is complex because services is a JSON array
    // We'll filter in JS for accuracy or use LIKE if simple
    
    const maintenances = db.prepare(query).all(...params);
    
    // Filter by serviceType in JS if provided
    const filteredMaintenances = serviceType 
      ? maintenances.filter((m: any) => {
          const services = JSON.parse(m.services || '[]');
          return services.some((s: any) => (typeof s === 'object' ? s.name : s) === serviceType);
        })
      : maintenances;

    const totalCost = filteredMaintenances.reduce((sum: number, m: any) => sum + (m.cost || 0), 0);
    
    const costByVehicleMap = new Map();
    const serviceFrequencyMap = new Map();

    filteredMaintenances.forEach((m: any) => {
      // Cost by vehicle
      const currentCost = costByVehicleMap.get(m.vehicle_plate) || 0;
      costByVehicleMap.set(m.vehicle_plate, currentCost + (m.cost || 0));

      // Service frequency
      const services = JSON.parse(m.services || '[]');
      services.forEach((s: any) => {
        const name = typeof s === 'object' ? s.name : s;
        serviceFrequencyMap.set(name, (serviceFrequencyMap.get(name) || 0) + 1);
      });
    });

    const costByVehicle = Array.from(costByVehicleMap.entries()).map(([vehicle_plate, total_cost]) => ({
      vehicle_plate,
      total_cost
    }));

    const serviceFrequency = Array.from(serviceFrequencyMap.entries()).map(([service, count]) => ({
      service,
      count
    })).sort((a, b) => b.count - a.count);

    res.json({
      totalCost,
      costByVehicle,
      serviceFrequency,
      maintenances: filteredMaintenances
    });
  });

  app.get("/api/agenda", (req, res) => {
    const agenda = db.prepare(`
      SELECT a.*, v.plate as vehicle_plate, v.type as vehicle_type 
      FROM agenda a 
      JOIN vehicles v ON a.vehicle_id = v.id
    `).all();
    res.json(agenda);
  });

  // Mechanics API
  app.get("/api/mechanics", (req, res) => {
    const mechanics = db.prepare("SELECT * FROM mechanics ORDER BY name ASC").all();
    res.json(mechanics);
  });

  app.post("/api/mechanics", (req, res) => {
    const { name } = req.body;
    try {
      const info = db.prepare("INSERT INTO mechanics (name) VALUES (?)").run(name);
      res.json({ id: info.lastInsertRowid });
    } catch (error) {
      res.status(400).json({ error: "Mecânico já cadastrado" });
    }
  });

  app.put("/api/mechanics/:id", (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
      db.prepare("UPDATE mechanics SET name = ? WHERE id = ?").run(name, id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Erro ao atualizar mecânico" });
    }
  });

  app.delete("/api/mechanics/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM mechanics WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/agenda", (req, res) => {
    const { day_of_week, vehicle_id } = req.body;
    const info = db.prepare(
      "INSERT INTO agenda (day_of_week, vehicle_id) VALUES (?, ?)"
    ).run(day_of_week, vehicle_id);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/agenda/:id", (req, res) => {
    const { id } = req.params;
    const { day_of_week, status } = req.body;
    if (day_of_week) {
      db.prepare("UPDATE agenda SET day_of_week = ? WHERE id = ?").run(day_of_week, id);
    }
    if (status) {
      db.prepare("UPDATE agenda SET status = ? WHERE id = ?").run(status, id);
    }
    res.json({ success: true });
  });

  app.delete("/api/agenda/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM agenda WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/stats", (req, res) => {
    const totalVehicles = db.prepare("SELECT COUNT(*) as count FROM vehicles").get().count;
    const inMaintenance = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status = 'Em manutenção'").get().count;
    const available = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status = 'Rodando'").get().count;
    
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const maintenancesThisMonth = db.prepare("SELECT COUNT(*) as count FROM maintenances WHERE date >= ?").get(firstDayOfMonth).count;

    res.json({
      totalVehicles,
      inMaintenance,
      available,
      maintenancesThisMonth
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
