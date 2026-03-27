import { Vehicle, MaintenanceInterval, Maintenance } from '../types';

export const calculateNextOilChange = (v: Vehicle, intervals: MaintenanceInterval[], maintenances: any[]) => {
  const vehicleMaintenances = maintenances
    .filter(m => m.vehicle_id === v.id)
    .sort((a, b) => b.km - a.km);
  
  const vBrand = (v.brand || '').trim().toLowerCase();
  const vType = (v.type || '').trim().toLowerCase();
  const vMeasurement = (v.measurement_type || 'odometer').trim().toLowerCase();

  const oilChangeInterval = intervals
    .filter(i => i.service_type === 'Troca óleo')
    .filter(i => (i.measurement_type || 'odometer').trim().toLowerCase() === vMeasurement)
    .sort((a, b) => {
      const scoreA = ((a.brand && a.brand.trim()) ? 2 : 0) + ((a.vehicle_type && a.vehicle_type.trim()) ? 1 : 0);
      const scoreB = ((b.brand && b.brand.trim()) ? 2 : 0) + ((b.vehicle_type && b.vehicle_type.trim()) ? 1 : 0);
      return scoreB - scoreA;
    })
    .find(i => {
      const iBrand = (i.brand || '').trim().toLowerCase();
      const iType = (i.vehicle_type || '').trim().toLowerCase();
      const matchesBrand = !iBrand || vBrand === iBrand;
      const matchesType = !iType || vType === iType;
      return matchesBrand && matchesType;
    });

  if (!oilChangeInterval) return null;

  const lastOilChange = vehicleMaintenances.find(m => {
    try {
      const services = JSON.parse(m.services || '[]');
      return services.some((s: any) => (typeof s === 'object' ? s.name : s) === 'Troca óleo');
    } catch (e) {
      return false;
    }
  });

  const lastKM = lastOilChange ? lastOilChange.km : (v.last_maintenance_km || 0);
  const nextKM = lastKM + oilChangeInterval.interval_km;
  
  return {
    nextKM,
    isApproaching: (v.km_current || 0) >= nextKM * 0.9,
    interval: oilChangeInterval.interval_km,
    lastKM,
    lastOilChange
  };
};
