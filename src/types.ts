export type Role = 'admin' | 'mechanic' | 'motorista';

export interface User {
  id?: string;
  email: string;
  password?: string;
  role: Role;
  name: string;
}

export interface Vehicle {
  id: number;
  type: 'Carreta' | 'Pipa20' | 'Pipa10' | 'Traçado';
  brand?: string;
  description?: string;
  plate: string;
  km_current: number;
  measurement_type?: 'odometer' | 'hour_meter';
  status: 'Rodando' | 'Em manutenção' | 'Parado';
  last_maintenance_km: number;
  is_contracted?: boolean;
  contract_company?: string;
  contract_work?: string;
  contract_start_date?: string;
  contract_closing_day?: number;
  contract_value?: number;
  contract_observation?: string;
}

export interface Maintenance {
  id: number;
  vehicle_id: number;
  vehicle_plate?: string;
  vehicle_type?: string;
  date: string; // Start Date
  end_date?: string;
  start_time?: string;
  end_time?: string;
  type: 'Preventiva' | 'Corretiva' | 'Preditiva';
  km: number;
  mechanic: string;
  services: string; // JSON string in DB
  other_services: string;
  observations: string;
  cost: number;
}

export interface MaintenanceInterval {
  id: number;
  service_type: string;
  interval_km: number;
  measurement_type: 'odometer' | 'hour_meter';
  brand?: string;
  vehicle_type?: string;
}

export interface ReportData {
  totalCost: number;
  costByVehicle: { vehicle_plate: string, total_cost: number }[];
  serviceFrequency: { service: string, count: number }[];
  maintenances: Maintenance[];
}

export interface AgendaItem {
  id: number;
  day_of_week: string;
  week_start_date?: string;
  vehicle_id: number;
  vehicle_plate: string;
  vehicle_type: string;
  status: 'Pendente' | 'Concluído';
}

export interface ReportIssue {
  id: number;
  maintenance_id: number;
  mechanic_name: string;
  description: string;
  status: 'pendente' | 'resolvida';
  created_at: string;
}

export interface DriverRequest {
  id: number;
  driver_name: string;
  vehicle_plate: string;
  description: string;
  status: 'pendente' | 'resolvida';
  created_at: string;
}

export const MAINTENANCE_TYPES = [
  "Troca freio motor", "Troca turbina", "Troca suporte motor", "Troca intercooler",
  "Troca embreagem", "Troca tomada de força", "Troca coxim motor", "Troca coxim caixa",
  "Troca coxim cabine", "Troca óleo", "Troca filtro de óleo", "Troca filtro racor",
  "Troca filtro PU", "Troca filtro diesel", "Troca filtro de ar", "Troca cuíca de freio",
  "Troca lona de freio", "Troca tambor de freio", "Troca cilindro mestre", "Troca cilindro auxiliar",
  "Troca amortecedor", "Troca pneu", "Troca descarga", "Troca catraca", "Troca paleta",
  "Troca farol", "Troca lente de seta LD", "Troca lente de seta LE", "Troca retrovisor LD",
  "Troca retrovisor LE", "Trocar bomba hidráulica", "Troca válvula PU", "Troca válvula distribuição",
  "Troca válvula carreta", "Troca válvula relé", "Troca válvula pedal", "Troca válvula manete",
  "Conferência parte elétrica", "Conferir óleo da caixa", "Conferir óleo diferencial",
  "Conferir bomba d’água", "Regular freio", "Fazer freio", "Calibragem pneu",
  "Reparo freio motor", "Reparo alavanca marcha", "Lubrificação", "Limpeza sistema refrigeração",
  "Soprar filtros", "Colocar polietileno", "Solda geral", "Solda chassi", "Solda fabricação",
  "Socorro caminhão pipa", "Socorro caminhão báscula", "Socorro carreta", "Socorro máquina"
];

export const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
