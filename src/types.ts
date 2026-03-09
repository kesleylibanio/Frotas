export type Role = 'admin' | 'mechanic';

export interface User {
  id?: string;
  email: string;
  password?: string;
  role: Role;
  name: string;
}

export interface Vehicle {
  id: string;
  type: 'Carreta' | 'Pipa' | 'Traçado';
  plate: string;
  km_current: number;
  status: 'Rodando' | 'Em manutenção' | 'Parado';
  last_maintenance_km: number;
  is_contracted?: boolean;
  contract_company?: string;
  contract_closing_day?: number;
  contract_value?: number;
}

export interface Maintenance {
  id: string;
  vehicle_id: string;
  vehicle_plate?: string;
  vehicle_type?: string;
  date: string;
  start_time?: string;
  end_time?: string;
  type: 'Preventiva' | 'Corretiva' | 'Preditiva';
  km: number;
  mechanic: string;
  services: any[]; // Array of objects or strings
  other_services: string;
  observations: string;
  cost: number;
}

export interface MaintenanceInterval {
  id: string;
  service_type: string;
  interval_km: number;
}

export interface ReportData {
  totalCost: number;
  costByVehicle: { vehicle_plate: string, total_cost: number }[];
  serviceFrequency: { service: string, count: number }[];
  maintenances: Maintenance[];
}

export interface AgendaItem {
  id: string;
  day_of_week: string;
  vehicle_id: string;
  vehicle_plate: string;
  vehicle_type: string;
  status: 'Pendente' | 'Concluído';
}

export interface Mechanic {
  id: string;
  name: string;
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

export const DAYS_OF_WEEK = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
