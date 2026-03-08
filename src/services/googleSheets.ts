import { Vehicle, Maintenance, AgendaItem, MaintenanceInterval, User, ReportData } from '../types';

const API_BASE = '/api';

/**
 * FrotaControlSync Service
 * Handles communication with the backend API which syncs with Google Sheets.
 */
export const googleSheetsService = {
  // Auth
  login: async (credentials: any) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
    return res.json();
  },

  register: async (data: any) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Registration failed');
    return res.json();
  },

  // Vehicles
  getVehicles: async (): Promise<Vehicle[]> => {
    const res = await fetch(`${API_BASE}/vehicles`);
    return res.json();
  },

  saveVehicle: async (vehicle: any) => {
    const url = vehicle.id ? `${API_BASE}/vehicles/${vehicle.id}` : `${API_BASE}/vehicles`;
    const method = vehicle.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicle),
    });
    return res.json();
  },

  // Maintenances
  getMaintenances: async (vehicleId?: number): Promise<Maintenance[]> => {
    const url = vehicleId ? `${API_BASE}/maintenances?vehicleId=${vehicleId}` : `${API_BASE}/maintenances`;
    const res = await fetch(url);
    return res.json();
  },

  saveMaintenance: async (maintenance: any) => {
    const url = maintenance.id ? `${API_BASE}/maintenances/${maintenance.id}` : `${API_BASE}/maintenances`;
    const method = maintenance.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(maintenance),
    });
    return res.json();
  },

  // Agenda
  getAgenda: async (): Promise<AgendaItem[]> => {
    const res = await fetch(`${API_BASE}/agenda`);
    return res.json();
  },

  saveAgenda: async (item: any) => {
    const url = item.id ? `${API_BASE}/agenda/${item.id}` : `${API_BASE}/agenda`;
    const method = item.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return res.json();
  },

  deleteAgenda: async (id: number) => {
    await fetch(`${API_BASE}/agenda/${id}`, { method: 'DELETE' });
  },

  // Intervals
  getIntervals: async (): Promise<MaintenanceInterval[]> => {
    const res = await fetch(`${API_BASE}/intervals`);
    return res.json();
  },

  saveInterval: async (interval: any) => {
    const url = interval.id ? `${API_BASE}/intervals/${interval.id}` : `${API_BASE}/intervals`;
    const method = interval.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interval),
    });
    return res.json();
  },

  deleteInterval: async (id: number) => {
    await fetch(`${API_BASE}/intervals/${id}`, { method: 'DELETE' });
  },

  // Mechanics
  getMechanics: async () => {
    const res = await fetch(`${API_BASE}/mechanics`);
    return res.json();
  },

  saveMechanic: async (name: string, id?: number) => {
    const url = id ? `${API_BASE}/mechanics/${id}` : `${API_BASE}/mechanics`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return res.json();
  },

  deleteMechanic: async (id: number) => {
    await fetch(`${API_BASE}/mechanics/${id}`, { method: 'DELETE' });
  },

  // Stats & Reports
  getStats: async () => {
    const res = await fetch(`${API_BASE}/stats`);
    return res.json();
  },

  getReports: async (params: any): Promise<ReportData> => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/reports?${query}`);
    return res.json();
  }
};
