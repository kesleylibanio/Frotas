import { getSupabase } from '../supabase';
import { Vehicle, Maintenance, AgendaItem, MaintenanceInterval, ReportData } from '../types';

export const supabaseService = {
  // Vehicles
  getVehicles: async (): Promise<Vehicle[]> => {
    const { data, error } = await getSupabase()
      .from('vehicles')
      .select('*')
      .order('plate', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  saveVehicle: async (vehicle: any) => {
    if (vehicle.id) {
      const { data, error } = await getSupabase()
        .from('vehicles')
        .update(vehicle)
        .eq('id', vehicle.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await getSupabase()
        .from('vehicles')
        .insert([vehicle])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  deleteVehicle: async (id: number) => {
    // Supabase handles cascading if configured, but let's be safe
    await getSupabase().from('agenda').delete().eq('vehicle_id', id);
    await getSupabase().from('maintenances').delete().eq('vehicle_id', id);
    const { error } = await getSupabase().from('vehicles').delete().eq('id', id);
    if (error) throw error;
  },

  // Maintenances
  getMaintenances: async (vehicleId?: number, startDate?: string, endDate?: string): Promise<Maintenance[]> => {
    let query = getSupabase()
      .from('maintenances')
      .select('*, vehicles(plate, type)')
      .order('date', { ascending: false });
    
    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId);
    }
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map(m => ({
      ...m,
      vehicle_plate: m.vehicles?.plate,
      vehicle_type: m.vehicles?.type
    }));
  },

  saveMaintenance: async (maintenance: any) => {
    const { services, ...rest } = maintenance;
    const payload = {
      ...rest,
      services: typeof services === 'string' ? services : JSON.stringify(services)
    };

    if (maintenance.id) {
      const { data, error } = await getSupabase()
        .from('maintenances')
        .update(payload)
        .eq('id', maintenance.id)
        .select()
        .single();
      if (error) throw error;
      
      // Update vehicle KM
      await supabaseService.updateVehicleKM(maintenance.vehicle_id, maintenance.km);
      
      return data;
    } else {
      const { data, error } = await getSupabase()
        .from('maintenances')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      
      // Update vehicle KM
      await supabaseService.updateVehicleKM(maintenance.vehicle_id, maintenance.km);
      
      return data;
    }
  },

  updateVehicleKM: async (vehicleId: number, km: number) => {
    // Get current vehicle to compare KM
    const { data: vehicle } = await getSupabase()
      .from('vehicles')
      .select('km_current')
      .eq('id', vehicleId)
      .single();
    
    if (vehicle) {
      const newKM = Math.max(vehicle.km_current, km);
      await getSupabase()
        .from('vehicles')
        .update({ 
          km_current: newKM,
          last_maintenance_km: km // Assuming this was the last maintenance
        })
        .eq('id', vehicleId);
    }
  },

  // Agenda
  getAgenda: async (): Promise<AgendaItem[]> => {
    const { data, error } = await getSupabase()
      .from('agenda')
      .select('*, vehicles(plate, type)');
    
    if (error) throw error;
    
    return (data || []).map(a => ({
      ...a,
      vehicle_plate: a.vehicles?.plate,
      vehicle_type: a.vehicles?.type
    }));
  },

  saveAgenda: async (item: any) => {
    if (item.id) {
      const { data, error } = await getSupabase()
        .from('agenda')
        .update(item)
        .eq('id', item.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await getSupabase()
        .from('agenda')
        .insert([item])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  deleteAgenda: async (id: number) => {
    const { error } = await getSupabase().from('agenda').delete().eq('id', id);
    if (error) throw error;
  },

  // Intervals
  getIntervals: async (): Promise<MaintenanceInterval[]> => {
    const { data, error } = await getSupabase()
      .from('maintenance_intervals')
      .select('*');
    if (error) throw error;
    return data || [];
  },

  saveInterval: async (interval: any) => {
    if (interval.id) {
      const { data, error } = await getSupabase()
        .from('maintenance_intervals')
        .update(interval)
        .eq('id', interval.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await getSupabase()
        .from('maintenance_intervals')
        .insert([interval])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  deleteInterval: async (id: number) => {
    const { error } = await getSupabase().from('maintenance_intervals').delete().eq('id', id);
    if (error) throw error;
  },

  // Mechanics
  getMechanics: async () => {
    const { data, error } = await getSupabase()
      .from('mechanics')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  saveMechanic: async (name: string, id?: number) => {
    if (id) {
      const { data, error } = await getSupabase()
        .from('mechanics')
        .update({ name })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await getSupabase()
        .from('mechanics')
        .insert([{ name }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  deleteMechanic: async (id: number) => {
    const { error } = await getSupabase().from('mechanics').delete().eq('id', id);
    if (error) throw error;
  },

  // Stats
  getStats: async () => {
    const { data: vehicles } = await getSupabase().from('vehicles').select('status');
    const { count: maintenancesThisMonth } = await getSupabase()
      .from('maintenances')
      .select('*', { count: 'exact', head: true })
      .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    const totalVehicles = vehicles?.length || 0;
    const inMaintenance = vehicles?.filter(v => v.status === 'Em manutenção').length || 0;
    const available = vehicles?.filter(v => v.status === 'Rodando').length || 0;

    return {
      totalVehicles,
      inMaintenance,
      available,
      maintenancesThisMonth: maintenancesThisMonth || 0
    };
  }
};
