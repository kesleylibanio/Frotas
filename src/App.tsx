/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Calendar, 
  ClipboardList, 
  History, 
  AlertTriangle,
  Plus,
  Search,
  ChevronRight,
  CheckCircle2,
  Clock,
  User,
  Navigation,
  Menu,
  X,
  Save,
  Trash2,
  ArrowRightLeft,
  Settings as SettingsIcon,
  BarChart3,
  Download,
  Filter,
  DollarSign,
  PieChart as PieChartIcon,
  Mic,
  Wrench,
  Edit,
  Edit3,
  FileText,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Login } from './components/Login';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { 
  Vehicle, 
  Maintenance, 
  AgendaItem, 
  MAINTENANCE_TYPES, 
  DAYS_OF_WEEK,
  MaintenanceInterval,
  ReportData
} from './types';
import { supabaseService } from './services/supabaseService';

// --- Components ---

const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`} onClick={onClick}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = "", 
  disabled = false,
  type = 'button'
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost',
  className?: string,
  disabled?: boolean,
  type?: 'button' | 'submit'
}) => {
  const variants = {
    primary: 'bg-red-600 text-white hover:bg-red-700',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-50'
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, ...props }: any) => (
  <div className="space-y-1">
    {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>}
    <input 
      {...props} 
      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
    />
  </div>
);

const Select = ({ label, options, ...props }: any) => (
  <div className="space-y-1">
    {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>}
    <select 
      {...props} 
      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// --- Screens ---

const Contracts = ({ vehicles }: { vehicles: Vehicle[] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const contractedVehicles = vehicles.filter(v => v.is_contracted);
  
  const filteredVehicles = contractedVehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.contract_company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = contractedVehicles.reduce((sum, v) => sum + (v.contract_value || 0), 0);
  const activeCount = contractedVehicles.length;

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const getDaysUntilPayment = (closingDay: number) => {
    let paymentDate = new Date(currentYear, currentMonth, closingDay);
    if (paymentDate < today && currentDay > closingDay) {
      paymentDate = new Date(currentYear, currentMonth + 1, closingDay);
    }
    const diffTime = paymentDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileText size={24} className="text-red-600" />
          Contratos Mensais
        </h2>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar veículo ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 bg-white border-l-4 border-l-red-600">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Contratos Ativos</p>
              <p className="text-3xl font-black text-slate-800">{activeCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-white border-l-4 border-l-emerald-600">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Valor Total Mensal</p>
              <p className="text-3xl font-black text-slate-800">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4">
        {filteredVehicles.map(v => {
          const daysUntil = getDaysUntilPayment(v.contract_closing_day || 1);
          const isNear = daysUntil <= 2;

          return (
            <Card key={v.id} className={`p-4 border-l-4 ${isNear ? 'border-l-red-500 bg-red-50/30' : 'border-l-red-500'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-800">Veículo {v.plate}</h3>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">{v.contract_company}</span>
                  </div>
                  <p className="text-sm text-slate-500">{v.plate} • {v.type}</p>
                  <p className="text-sm font-bold text-emerald-600 mt-1">R$ {(v.contract_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / mês</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Fechamento</p>
                  <p className="text-lg font-bold text-slate-800">Dia {v.contract_closing_day}</p>
                  <p className={`text-xs font-bold ${isNear ? 'text-red-600' : 'text-slate-500'}`}>
                    {daysUntil === 0 ? 'Pagamento Hoje!' : `Faltam ${daysUntil} dias`}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
        {filteredVehicles.length === 0 && (
          <div className="text-center py-12 text-slate-400 italic bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            {searchTerm ? 'Nenhum contrato encontrado para esta busca.' : 'Nenhum veículo em contrato mensal.'}
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = ({ vehicles, stats, intervals, maintenances, role }: { vehicles: Vehicle[], stats: any, intervals: MaintenanceInterval[], maintenances: any[], role?: 'admin' | 'mechanic' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [spotlightVehicle, setSpotlightVehicle] = useState<Vehicle | null>(null);
  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maintenanceAlerts = vehicles.flatMap(v => {
    const vehicleMaintenances = maintenances
      .filter(m => m.vehicle_id === v.id)
      .sort((a, b) => b.km - a.km);
    
    return intervals
      .filter(i => (i.measurement_type || 'odometer') === (v.measurement_type || 'odometer'))
      .map(interval => {
        const lastService = vehicleMaintenances.find(m => {
          const services = JSON.parse(m.services || '[]');
          return services.some((s: any) => (typeof s === 'object' ? s.name : s) === interval.service_type);
        });

        const lastKM = lastService ? lastService.km : (v.last_maintenance_km || 0);
        const kmSinceLast = (v.km_current || 0) - lastKM;
        const remaining = interval.interval_km - kmSinceLast;
        const threshold = interval.interval_km * 0.1;

        if (remaining <= threshold) {
          return {
            vehicle: v,
            service: interval.service_type,
            interval: interval.interval_km,
            remaining,
            isOverdue: remaining < 0,
            type: 'maintenance'
          };
        }
        return null;
      }).filter(Boolean);
  }).sort((a: any, b: any) => a.remaining - b.remaining) as any[];

  if (role === 'mechanic') {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20} />
            Alertas de Manutenção Próxima
          </h2>
          {maintenanceAlerts.length > 0 ? (
            <div className="grid gap-3">
              {maintenanceAlerts.map((alert, idx) => {
                const { vehicle: v, service, remaining, isOverdue, interval } = alert;
                
                return (
                  <Card key={`${v.id}-${service}-${idx}`} className={`p-4 flex items-center justify-between border-l-4 ${isOverdue ? 'border-l-red-500 bg-red-50/30' : 'border-l-amber-500'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800">Veículo {v.plate}</h3>
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase">{service}</span>
                      </div>
                      <p className="text-sm text-slate-500">{v.plate} • {v.type}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                        {isOverdue ? `Atrasado ${Math.abs(remaining).toLocaleString()} ${v.measurement_type === 'hour_meter' ? 'h' : 'km'}` : `Faltam ${remaining.toLocaleString()} ${v.measurement_type === 'hour_meter' ? 'h' : 'km'}`}
                      </span>
                      <p className="text-xs text-slate-400">Intervalo: {v.measurement_type === 'hour_meter' ? `${interval}h` : `${(interval/1000).toFixed(0)}k km`}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center text-slate-400">
              Nenhum veículo com manutenção próxima no momento.
            </Card>
          )}
        </div>
      </div>
    );
  }

  const contractAlerts = vehicles
    .filter(v => v.is_contracted)
    .map(v => {
      const closingDay = v.contract_closing_day || 1;
      const today = new Date();
      const currentDay = today.getDate();
      
      let daysUntil = closingDay - currentDay;
      if (daysUntil < 0) {
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        daysUntil = (lastDayOfMonth - currentDay) + closingDay;
      }

      if (daysUntil <= 2) {
        return {
          vehicle: v,
          company: v.contract_company,
          closingDay,
          daysUntil,
          type: 'contract'
        };
      }
      return null;
    })
    .filter(Boolean) as any[];

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Pesquisar veículo pela Placa para ver detalhes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-red-500 outline-none transition-all text-lg font-medium"
        />
        {searchTerm && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-[60] max-h-64 overflow-y-auto">
            {filteredVehicles.map(v => (
              <button 
                key={v.id}
                onClick={() => { setSpotlightVehicle(v); setSearchTerm(''); }}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="font-black text-red-600">{v.plate}</span>
                  <span className="text-sm text-slate-500">{v.plate}</span>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>
            ))}
            {filteredVehicles.length === 0 && <div className="p-4 text-center text-slate-400 italic">Nenhum veículo encontrado</div>}
          </div>
        )}
      </div>

      {/* Vehicle Spotlight */}
      <AnimatePresence>
        {spotlightVehicle && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-2xl p-6 relative bg-white shadow-2xl">
              <button 
                onClick={() => setSpotlightVehicle(null)}
                className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={24} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200">
                  <Truck size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">Veículo {spotlightVehicle.plate}</h3>
                  <p className="text-slate-500 font-medium">{spotlightVehicle.plate} • {spotlightVehicle.type}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                    spotlightVehicle.status === 'Rodando' ? 'bg-emerald-100 text-emerald-700' : 
                    spotlightVehicle.status === 'Em manutenção' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {spotlightVehicle.status}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{spotlightVehicle.measurement_type === 'hour_meter' ? 'Horas Atuais' : 'Km Atual'}</p>
                  <p className="text-lg font-black text-slate-800">{spotlightVehicle.km_current.toLocaleString()} {spotlightVehicle.measurement_type === 'hour_meter' ? 'h' : 'km'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contrato</p>
                  <p className="text-sm font-bold text-slate-800">{spotlightVehicle.is_contracted ? spotlightVehicle.contract_company : 'Não'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Valor Contrato</p>
                  <p className="text-sm font-bold text-emerald-600">R$ {(spotlightVehicle.contract_value || 0).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  Alertas Ativos
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {maintenanceAlerts.filter(a => a.vehicle.id === spotlightVehicle.id).map((alert, i) => (
                    <div key={i} className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex justify-between items-center">
                      <span className="text-sm font-bold text-amber-800">{alert.service}</span>
                      <span className="text-xs font-bold text-amber-600">{alert.remaining < 0 ? 'VENCIDO' : `Faltam ${alert.remaining} ${spotlightVehicle.measurement_type === 'hour_meter' ? 'h' : 'km'}`}</span>
                    </div>
                  ))}
                  {maintenanceAlerts.filter(a => a.vehicle.id === spotlightVehicle.id).length === 0 && (
                    <p className="text-sm text-slate-400 italic">Nenhum alerta de manutenção pendente.</p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Frota', value: stats.totalVehicles, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Em Manutenção', value: stats.inMaintenance, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Disponíveis', value: stats.available, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Serviços Mês', value: stats.maintenancesThisMonth, icon: ClipboardList, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <Card key={i} className="p-4 flex flex-col items-center text-center">
            <div className={`p-3 rounded-full ${stat.bg} ${stat.color} mb-2`}>
              <stat.icon size={24} />
            </div>
            <span className="text-2xl font-bold text-slate-800">{stat.value}</span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-tight">{stat.label}</span>
          </Card>
        ))}
      </div>

      {contractAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="text-red-500" size={20} />
            Alertas de Pagamento de Contrato
          </h2>
          <div className="grid gap-3">
            {contractAlerts.map((alert, idx) => (
              <Card key={`contract-${alert.vehicle.id}-${idx}`} className="p-4 flex items-center justify-between border-l-4 border-l-red-500 bg-red-50/30">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">Veículo {alert.vehicle.plate}</h3>
                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase">{alert.company}</span>
                  </div>
                  <p className="text-sm text-slate-500">Fechamento dia {alert.closingDay}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-red-600">
                    {alert.daysUntil === 0 ? 'Pagamento HOJE!' : `Faltam ${alert.daysUntil} dias`}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <AlertTriangle className="text-amber-500" size={20} />
          Alertas de Manutenção Próxima
        </h2>
        {maintenanceAlerts.length > 0 ? (
          <div className="grid gap-3">
            {maintenanceAlerts.map((alert, idx) => {
              const { vehicle: v, service, remaining, isOverdue, interval } = alert;
              
              return (
                <Card key={`${v.id}-${service}-${idx}`} className={`p-4 flex items-center justify-between border-l-4 ${isOverdue ? 'border-l-red-500 bg-red-50/30' : 'border-l-amber-500'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800">Veículo {v.plate}</h3>
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase">{service}</span>
                    </div>
                    <p className="text-sm text-slate-500">{v.plate} • {v.type}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                      {isOverdue ? `Atrasado ${Math.abs(remaining).toLocaleString()} ${v.measurement_type === 'hour_meter' ? 'h' : 'km'}` : `Faltam ${remaining.toLocaleString()} ${v.measurement_type === 'hour_meter' ? 'h' : 'km'}`}
                    </span>
                    <p className="text-xs text-slate-400">Intervalo: {(interval/1000).toFixed(0)}k {v.measurement_type === 'hour_meter' ? 'h' : 'km'}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center text-slate-400">
            Nenhum veículo com manutenção próxima no momento.
          </Card>
        )}
      </div>
    </div>
  );
};

const VehicleList = ({ vehicles, onEdit, onSelect, onEditKM, onDelete, userRole }: { vehicles: Vehicle[], onEdit: (v: Vehicle) => void, onSelect: (v: Vehicle) => void, onEditKM: (v: Vehicle) => void, onDelete: (v: Vehicle) => void, userRole: string }) => {
  const [search, setSearch] = useState('');
  const filtered = vehicles.filter(v => 
    v.plate.toLowerCase().includes(search.toLowerCase()) || 
    v.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            placeholder="Buscar por placa..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {userRole === 'admin' && (
          <Button onClick={() => (onEdit as any)({})}>
            <Plus size={20} />
            <span className="hidden sm:inline">Novo</span>
          </Button>
        )}
      </div>

      <div className="grid gap-3">
        {filtered.map(v => (
          <Card key={v.id} className="p-4 hover:border-red-300 transition-colors cursor-pointer" onClick={() => onSelect(v)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  v.type === 'Carreta' ? 'bg-blue-100 text-blue-700' : 
                  (v.type as string).startsWith('Pipa') ? 'bg-cyan-100 text-cyan-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  <Truck size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{v.plate}</h3>
                  <p className="text-sm text-slate-500">{v.type}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                  v.status === 'Rodando' ? 'bg-emerald-100 text-emerald-700' :
                  v.status === 'Em manutenção' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {v.status}
                </span>
                <span className="text-xs font-mono text-slate-400">Atual: {v.km_current.toLocaleString()} {v.measurement_type === 'hour_meter' ? 'h' : 'km'}</span>
                <span className="text-[10px] text-slate-400 italic">Últ. Manut: {(v.last_maintenance_km || 0).toLocaleString()} {v.measurement_type === 'hour_meter' ? 'h' : 'km'}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditKM(v);
                    }}
                    className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    title={v.measurement_type === 'hour_meter' ? "Atualizar Horas" : "Atualizar KM"}
                  >
                    <Edit3 size={14} />
                  </button>
                  {userRole === 'admin' && (
                    <>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(v);
                        }}
                        className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                        title="Editar Configurações"
                      >
                        <SettingsIcon size={14} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(v);
                        }}
                        className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="Excluir Veículo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const VehicleForm = ({ vehicle, onSave, onCancel }: { vehicle: Partial<Vehicle>, onSave: (v: any) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState({
    type: (['Carreta', 'Pipa20', 'Pipa10', 'Traçado'].includes(vehicle.type as any) ? vehicle.type : (vehicle.type === 'Caminhão Traçado' as any || vehicle.type === 'Traçado' as any ? 'Traçado' : (vehicle.type === 'Pipa de 20mil L' as any || vehicle.type === 'Pipa20' as any ? 'Pipa20' : (vehicle.type === 'Pipa de 10mil L' as any || vehicle.type === 'Pipa10' as any ? 'Pipa10' : 'Carreta')))) || 'Carreta',
    plate: vehicle.plate || '',
    measurement_type: (['odometer', 'hour_meter'].includes(vehicle.measurement_type as string) ? vehicle.measurement_type : 'odometer') || 'odometer',
    km_current: vehicle.km_current !== undefined ? vehicle.km_current : '',
    status: (['Rodando', 'Em manutenção', 'Parado'].includes(vehicle.status as string) ? vehicle.status : 'Rodando') || 'Rodando',
    is_contracted: !!vehicle.is_contracted,
    contract_company: vehicle.contract_company || '',
    contract_work: vehicle.contract_work || '',
    contract_start_date: vehicle.contract_start_date || '',
    contract_closing_day: vehicle.contract_closing_day || '',
    contract_value: vehicle.contract_value !== undefined ? vehicle.contract_value : '',
    contract_observation: vehicle.contract_observation || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      km_current: formData.km_current === '' ? 0 : Number(formData.km_current),
      contract_closing_day: formData.contract_closing_day === '' ? null : Number(formData.contract_closing_day),
      contract_value: formData.contract_value === '' ? null : Number(formData.contract_value),
      contract_start_date: formData.contract_start_date === '' ? null : formData.contract_start_date,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">{vehicle.id ? 'Editar Veículo' : 'Novo Veículo'}</h2>
        <Button variant="ghost" onClick={onCancel}><X size={20} /></Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input 
          label="Placa" 
          value={formData.plate} 
          onChange={(e: any) => setFormData({...formData, plate: e.target.value.slice(0, 7)})} 
          maxLength={7}
          required 
        />
        <Select 
          label="Tipo" 
          value={formData.type} 
          onChange={(e: any) => setFormData({...formData, type: e.target.value})}
          options={[
            { label: 'Carreta', value: 'Carreta' },
            { label: 'Pipa10', value: 'Pipa10' },
            { label: 'Pipa20', value: 'Pipa20' },
            { label: 'Caminhão Traçado', value: 'Traçado' },
          ]}
        />
        <div className="grid grid-cols-2 gap-2">
          <Select 
            label="Medição" 
            value={formData.measurement_type} 
            onChange={(e: any) => setFormData({...formData, measurement_type: e.target.value})}
            options={[
              { label: 'Odômetro (km)', value: 'odometer' },
              { label: 'Horímetro (h)', value: 'hour_meter' },
            ]}
          />
          <Input 
            label={formData.measurement_type === 'odometer' ? "Quilometragem Atual" : "Horas de Funcionamento"} 
            type="text" 
            value={formData.km_current} 
            onChange={(e: any) => {
              const val = e.target.value.replace(/\D/g, '');
              const maxLen = formData.measurement_type === 'odometer' ? 10 : 12;
              setFormData({...formData, km_current: val.slice(0, maxLen)});
            }} 
            required 
          />
        </div>
        <Select 
          label="Status" 
          value={formData.status} 
          onChange={(e: any) => setFormData({...formData, status: e.target.value})}
          options={[
            { label: 'Rodando', value: 'Rodando' },
            { label: 'Em manutenção', value: 'Em manutenção' },
            { label: 'Parado', value: 'Parado' },
          ]}
        />
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="is_contracted"
            checked={formData.is_contracted}
            onChange={(e) => setFormData({...formData, is_contracted: e.target.checked})}
            className="w-4 h-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
          />
          <label htmlFor="is_contracted" className="text-sm font-bold text-slate-700">Rodando em contrato mensal?</label>
        </div>

        {formData.is_contracted && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
            <Input 
              label="Nome da Empresa" 
              value={formData.contract_company} 
              onChange={(e: any) => setFormData({...formData, contract_company: e.target.value})} 
              required={formData.is_contracted}
            />
            <Input 
              label="Obra (Opcional)" 
              value={formData.contract_work} 
              onChange={(e: any) => setFormData({...formData, contract_work: e.target.value})} 
            />
            <Input 
              label="Data de Início" 
              type="date"
              value={formData.contract_start_date} 
              onChange={(e: any) => setFormData({...formData, contract_start_date: e.target.value})} 
            />
            <Input 
              label="Dia de Fechamento (Pagamento)" 
              type="text" 
              value={formData.contract_closing_day} 
              onChange={(e: any) => {
                const val = e.target.value.replace(/\D/g, '');
                let num = parseInt(val);
                if (num > 31) num = 31;
                setFormData({...formData, contract_closing_day: val === '' ? '' : String(num || '')});
              }} 
              required={formData.is_contracted}
            />
            <Input 
              label="Valor do Contrato (R$)" 
              type="text" 
              value={formData.contract_value} 
              onChange={(e: any) => {
                const val = e.target.value.replace(/\D/g, '');
                setFormData({...formData, contract_value: val.slice(0, 15)});
              }} 
              required={formData.is_contracted}
            />
            <Input 
              label="Observação (Opcional)" 
              value={formData.contract_observation} 
              onChange={(e: any) => setFormData({...formData, contract_observation: e.target.value})} 
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1"><Save size={20} /> Salvar Veículo</Button>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
};

const Agenda = ({ agenda, vehicles, onAdd, onMove, onComplete, onDelete, selectedWeek, setSelectedWeek }: any) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ day: 'Segunda', vehicleId: '' });

  const grouped = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = agenda.filter((item: any) => item.day_of_week === day);
    return acc;
  }, {} as any);

  const getDayDate = (dayIndex: number) => {
    const [year, month, day] = selectedWeek.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + dayIndex);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const changeWeek = (offset: number) => {
    const [year, month, day] = selectedWeek.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + offset * 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setSelectedWeek(`${y}-${m}-${dd}`);
  };

  const getFormattedSelectedWeek = () => {
    const [year, month, day] = selectedWeek.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800">Agenda da Oficina</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
            <button onClick={() => changeWeek(-1)} className="p-1 text-slate-500 hover:bg-slate-100 rounded"><ChevronRight className="rotate-180" size={20} /></button>
            <span className="px-4 font-medium text-sm text-slate-700">Semana de {getFormattedSelectedWeek()}</span>
            <button onClick={() => changeWeek(1)} className="p-1 text-slate-500 hover:bg-slate-100 rounded"><ChevronRight size={20} /></button>
          </div>
          <Button onClick={() => setShowAdd(true)}><Plus size={20} /> <span className="hidden sm:inline">Agendar</span></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {DAYS_OF_WEEK.map((day, index) => {
          if (day === 'Domingo' || day === 'Sábado') return null;
          return (
          <Card key={day} className="flex flex-col min-h-[200px]">
            <div className="p-3 bg-slate-50 border-bottom border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-700">{day} <span className="text-xs text-slate-400 font-normal">({getDayDate(index)})</span></span>
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{grouped[day].length}</span>
            </div>
            <div className="p-3 space-y-2 flex-1">
              {grouped[day].map((item: any) => (
                <div key={item.id} className={`p-3 rounded-lg border ${item.status === 'Concluído' ? 'bg-emerald-50 border-emerald-100 opacity-60' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800">{item.vehicle_plate}</span>
                    <div className="flex gap-1">
                      {item.status === 'Pendente' && (
                        <>
                          <button onClick={() => onComplete(item.id)} className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"><CheckCircle2 size={16} /></button>
                          <button onClick={() => onDelete(item.id)} className="p-1 text-red-600 hover:bg-red-100 rounded"><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{item.vehicle_plate} • {item.vehicle_type}</p>
                  {item.status === 'Pendente' && (
                    <select 
                      className="text-[10px] w-full bg-slate-50 border border-slate-200 rounded p-1"
                      value={day}
                      onChange={(e) => onMove(item.id, e.target.value)}
                    >
                      {DAYS_OF_WEEK.filter(d => d !== 'Domingo' && d !== 'Sábado').map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  )}
                </div>
              ))}
              {grouped[day].length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-300 text-xs italic">
                  Vazio
                </div>
              )}
            </div>
          </Card>
          );
        })}
      </div>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-lg font-bold mb-4">Agendar Manutenção</h3>
              <div className="space-y-4">
                <Select 
                  label="Dia da Semana" 
                  value={newEntry.day} 
                  onChange={(e: any) => setNewEntry({...newEntry, day: e.target.value})}
                  options={DAYS_OF_WEEK.filter(d => d !== 'Domingo' && d !== 'Sábado').map(d => ({ label: d, value: d }))}
                />
                <Select 
                  label="Veículo" 
                  value={newEntry.vehicleId} 
                  onChange={(e: any) => setNewEntry({...newEntry, vehicleId: e.target.value})}
                  options={[
                    { label: 'Selecione um veículo', value: '' },
                    ...vehicles.map((v: any) => ({ label: v.plate, value: v.id }))
                  ]}
                />
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1" onClick={() => { onAdd(newEntry); setShowAdd(false); }} disabled={!newEntry.vehicleId}>Agendar</Button>
                  <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancelar</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Mechanics = ({ mechanics, onSave, onDelete }: { mechanics: any[], onSave: (name: string, id?: number) => void, onDelete: (id: number) => void }) => {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), editingId || undefined);
      setName('');
      setEditingId(null);
    }
  };

  const handleEdit = (m: any) => {
    setName(m.name);
    setEditingId(m.id);
  };

  const handleCancel = () => {
    setName('');
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <Wrench size={24} className="text-red-600" />
        Gestão de Mecânicos
      </h2>

      <Card className="p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1">
            <Input 
              placeholder="Nome do mecânico..." 
              value={name} 
              onChange={(e: any) => setName(e.target.value)} 
              required 
            />
          </div>
          <Button type="submit">
            {editingId ? <Save size={20} /> : <Plus size={20} />}
            {editingId ? 'Salvar' : 'Cadastrar'}
          </Button>
          {editingId && (
            <Button variant="secondary" onClick={handleCancel}>
              Cancelar
            </Button>
          )}
        </form>
      </Card>

      <div className="grid gap-3">
        {mechanics.map(m => (
          <Card key={m.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold">
                {m.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-slate-700">{m.name}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => handleEdit(m)} className="p-2 text-red-600">
                <Edit size={18} />
              </Button>
              <Button variant="danger" onClick={() => onDelete(m.id)} className="p-2">
                <Trash2 size={18} />
              </Button>
            </div>
          </Card>
        ))}
        {mechanics.length === 0 && (
          <div className="text-center py-12 text-slate-400 italic bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            Nenhum mecânico cadastrado.
          </div>
        )}
      </div>
    </div>
  );
};

const MaintenanceForm = ({ vehicles, mechanics, onSave, onCancel, initialData }: any) => {
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return {
        ...initialData,
        mechanics: initialData.mechanic ? initialData.mechanic.split(', ') : [],
        services: JSON.parse(initialData.services || '[]'),
        type: initialData.type || 'Preventiva',
        start_time: initialData.start_time || '',
        end_time: initialData.end_time || ''
      };
    }
    
    const saved = localStorage.getItem('maintenance_form_draft');
    if (saved) {
      return JSON.parse(saved);
    }

    return {
      vehicle_id: '',
      date: (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })(),
      start_time: '',
      end_time: '',
      type: 'Preventiva' as 'Preventiva' | 'Corretiva' | 'Preditiva',
      km: 0,
      mechanics: [] as string[],
      services: [] as any[],
      other_services: '',
      observations: '',
      cost: 0
    };
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!initialData) {
      localStorage.setItem('maintenance_form_draft', JSON.stringify(formData));
    }
  }, [formData, initialData]);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta pesquisa por voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
    };
    recognition.start();
  };

  const getServiceConfig = (service: string) => {
    const s = service.toLowerCase();
    
    const needsQty = [
      "troca suporte motor", "troca coxim", "troca filtro", "troca cuíca", 
      "troca lona", "troca tambor", "troca cilindro auxiliar", "troca amortecedor", 
      "troca pneu", "troca catraca", "troca paleta", "troca farol", 
      "troca lente de seta", "troca retrovisor", "troca válvula pu", 
      "calibragem pneu", "colocar polietileno"
    ].some(item => s.includes(item));
    
    const needsSide = [
      "troca cuíca", "troca lona", "troca tambor", "troca amortecedor", 
      "troca pneu", "troca catraca", "troca paleta", "troca farol", 
      "calibragem pneu"
    ].some(item => s.includes(item)) && !s.includes(" ld") && !s.includes(" le");
    
    return { needsQty, needsSide };
  };

  const toggleService = (serviceName: string) => {
    setFormData(prev => {
      const exists = prev.services.find(s => s.name === serviceName);
      if (exists) {
        return { ...prev, services: prev.services.filter(s => s.name !== serviceName) };
      } else {
        const sides: string[] = [];
        if (serviceName.toUpperCase().includes(" LD")) sides.push("LD");
        if (serviceName.toUpperCase().includes(" LE")) sides.push("LE");
        
        return { 
          ...prev, 
          services: [...prev.services, { name: serviceName, quantity: 1, sides }] 
        };
      }
    });
  };

  const updateServiceDetail = (serviceName: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map(s => 
        s.name === serviceName ? { ...s, [field]: value } : s
      )
    }));
  };

  const toggleMechanic = (name: string) => {
    setFormData(prev => ({
      ...prev,
      mechanics: prev.mechanics.includes(name)
        ? prev.mechanics.filter(m => m !== name)
        : [...prev.mechanics, name]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.mechanics.length === 0) {
      alert("Selecione pelo menos um mecânico.");
      return;
    }
    setShowConfirm(true);
  };

  const confirmSave = () => {
    const { mechanics, ...rest } = formData;
    const dataToSave = {
      ...rest,
      mechanic: mechanics.join(', ')
    };
    onSave(dataToSave);
    localStorage.removeItem('maintenance_form_draft');
    setShowConfirm(false);
  };

  const normalize = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredServices = MAINTENANCE_TYPES.filter(s => 
    normalize(s).includes(normalize(searchTerm))
  );

  const selectedVehicle = vehicles.find((v: any) => v.id === parseInt(formData.vehicle_id));

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Registrar Manutenção</h2>
        <Button variant="ghost" onClick={onCancel}><X size={20} /></Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select 
          label="Veículo" 
          value={formData.vehicle_id} 
          onChange={(e: any) => {
            const v = vehicles.find((veh: any) => veh.id === parseInt(e.target.value));
            setFormData({...formData, vehicle_id: e.target.value, km: v?.km_current || 0});
          }}
          required
          options={[
            { label: 'Selecione o veículo', value: '' },
            ...vehicles.map((v: any) => ({ label: v.plate, value: v.id }))
          ]}
        />
        <Input label="Data" type="date" value={formData.date} onChange={(e: any) => setFormData({...formData, date: e.target.value})} required />
        <div className="grid grid-cols-2 gap-2">
          <Input 
            label="Hora Início" 
            type="time" 
            value={formData.start_time} 
            onChange={(e: any) => setFormData({...formData, start_time: e.target.value})} 
          />
          <Input 
            label="Hora Fim" 
            type="time" 
            value={formData.end_time} 
            onChange={(e: any) => setFormData({...formData, end_time: e.target.value})} 
          />
        </div>
        <Select 
          label="Tipo de Manutenção" 
          value={formData.type} 
          onChange={(e: any) => setFormData({...formData, type: e.target.value})}
          options={[
            { label: 'Preventiva', value: 'Preventiva' },
            { label: 'Corretiva', value: 'Corretiva' },
            { label: 'Preditiva', value: 'Preditiva' },
          ]}
          required
        />
        <Input label={selectedVehicle?.measurement_type === 'hour_meter' ? 'Horímetro (h)' : 'Odômetro (km)'} type="number" value={formData.km} onChange={(e: any) => setFormData({...formData, km: parseInt(e.target.value)})} required />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mecânicos Responsáveis</label>
        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
          {mechanics.map((m: any) => (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleMechanic(m.name)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                formData.mechanics.includes(m.name)
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-red-300'
              }`}
            >
              {m.name}
            </button>
          ))}
          {mechanics.length === 0 && (
            <p className="text-xs text-slate-400 italic">Cadastre mecânicos na aba específica.</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Serviços Realizados</label>
          <div className="relative w-48 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              placeholder="Buscar serviço..."
              className="w-full pl-8 pr-10 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button 
              type="button"
              onClick={startVoiceSearch}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              <Mic size={14} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
          {filteredServices.map(service => {
            const isSelected = formData.services.some(s => s.name === service);
            const selectedService = formData.services.find(s => s.name === service);
            const config = getServiceConfig(service);

            return (
              <div key={service} className={`flex flex-col gap-2 p-3 rounded-lg transition-all border ${
                isSelected ? 'bg-red-50 border-red-200' : 'bg-white border-transparent hover:border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={isSelected}
                      onChange={() => toggleService(service)}
                    />
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-red-600 border-red-600' : 'bg-white border-slate-300'
                    }`}>
                      {isSelected && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <span className={`text-sm font-medium ${isSelected ? 'text-red-900' : 'text-slate-700'}`}>{service}</span>
                  </label>

                  {isSelected && config.needsQty && (
                    <div className="flex items-center gap-1 bg-white border border-red-100 rounded-lg p-1">
                      <button 
                        type="button"
                        onClick={() => updateServiceDetail(service, 'quantity', Math.max(1, (selectedService?.quantity || 1) - 1))}
                        className="w-6 h-6 flex items-center justify-center text-red-600 hover:bg-red-50 rounded"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-red-700">{selectedService?.quantity || 1}</span>
                      <button 
                        type="button"
                        onClick={() => updateServiceDetail(service, 'quantity', (selectedService?.quantity || 1) + 1)}
                        className="w-6 h-6 flex items-center justify-center text-red-600 hover:bg-red-50 rounded"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {isSelected && config.needsSide && (
                  <div className="flex gap-2 pl-8">
                    {['LE', 'LD'].map(side => {
                      const isSideSelected = selectedService?.sides.includes(side);
                      return (
                        <button
                          key={side}
                          type="button"
                          onClick={() => {
                            const currentSides = selectedService?.sides || [];
                            const newSides = isSideSelected 
                              ? currentSides.filter(s => s !== side)
                              : [...currentSides, side];
                            updateServiceDetail(service, 'sides', newSides);
                          }}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all border ${
                            isSideSelected 
                              ? 'bg-red-600 border-red-600 text-white shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500'
                          }`}
                        >
                          {side === 'LE' ? 'ESQUERDO' : 'DIREITO'}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {filteredServices.length === 0 && (
            <div className="text-center py-8 text-slate-400 italic">Nenhum serviço encontrado.</div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outros Serviços Realizados</label>
          <textarea 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none min-h-[80px]"
            value={formData.other_services}
            onChange={e => setFormData({...formData, other_services: e.target.value})}
            placeholder="Descreva serviços manuais..."
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Observações Gerais</label>
          <textarea 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none min-h-[80px]"
            value={formData.observations}
            onChange={e => setFormData({...formData, observations: e.target.value})}
            placeholder="Notas adicionais..."
          />
        </div>
      </div>

      <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-64 z-40">
        <Button type="submit" className="w-full shadow-lg py-4 text-lg"><Save size={24} /> Registrar</Button>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6"
            >
              <div className="flex items-center gap-3 text-red-600">
                <CheckCircle2 size={28} />
                <h3 className="text-xl font-bold">Confirmar Registro</h3>
              </div>
              
              <div className="space-y-3 text-slate-600">
                <p>Deseja confirmar o registro da manutenção para o veículo <span className="font-bold text-slate-800">{vehicles.find((v: any) => v.id.toString() === formData.vehicle_id.toString())?.plate}</span>?</p>
                <div className="bg-slate-50 p-3 rounded-xl text-sm space-y-2">
                  <p>• <span className="font-medium">Tipo:</span> {formData.type}</p>
                  <p>• <span className="font-medium">Data:</span> {formatLocalDate(formData.date)}</p>
                  <p>• <span className="font-medium">Horário:</span> {formData.start_time || '--:--'} às {formData.end_time || '--:--'}</p>
                  
                  <div>
                    <p className="font-medium mb-1">• Mecânicos Responsáveis:</p>
                    <ul className="list-disc list-inside pl-2 text-xs text-slate-500">
                      {formData.mechanics.map((m: string) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="font-medium mb-1">• Serviços ({formData.services.length}):</p>
                    <ul className="list-disc list-inside pl-2 text-xs text-slate-500 max-h-32 overflow-y-auto">
                      {formData.services.map((s: any, idx: number) => (
                        <li key={idx}>
                          {s.name}
                          {s.quantity > 1 && ` (${s.quantity}x)`}
                          {s.sides && s.sides.length > 0 && ` [${s.sides.join(', ')}]`}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1" onClick={confirmSave}>Confirmar e Salvar</Button>
                <Button variant="secondary" onClick={() => setShowConfirm(false)}>Revisar</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </form>
  );
};

const Settings = ({ intervals, onSaveInterval, onDeleteInterval }: { intervals: MaintenanceInterval[], onSaveInterval: (data: any) => void, onDeleteInterval: (id: number) => void }) => {
  const [activeType, setActiveType] = useState<'odometer' | 'hour_meter'>('odometer');
  const [newInterval, setNewInterval] = useState({ service_type: 'Geral', interval_km: 10000, measurement_type: 'odometer' as 'odometer' | 'hour_meter' });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    setNewInterval(prev => ({ ...prev, measurement_type: activeType }));
  }, [activeType]);

  const handleEdit = (i: MaintenanceInterval) => {
    setNewInterval({ service_type: i.service_type, interval_km: i.interval_km, measurement_type: i.measurement_type });
    setActiveType(i.measurement_type);
    setEditingId(i.id);
  };

  const handleSubmit = () => {
    onSaveInterval({ ...newInterval, id: editingId });
    setNewInterval({ service_type: 'Geral', interval_km: activeType === 'odometer' ? 10000 : 250, measurement_type: activeType });
    setEditingId(null);
  };

  const filteredIntervals = intervals.filter(i => i.measurement_type === activeType || (!i.measurement_type && activeType === 'odometer'));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <SettingsIcon size={24} />
        Configurações do Sistema
      </h2>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button 
          onClick={() => setActiveType('odometer')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeType === 'odometer' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Intervalos em KM
        </button>
        <button 
          onClick={() => setActiveType('hour_meter')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeType === 'hour_meter' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Intervalos em Horas
        </button>
      </div>

      <Card className="p-6">
        <h3 className="font-bold text-slate-700 mb-4">
          {editingId ? 'Editar Intervalo' : `Definir Intervalos (${activeType === 'odometer' ? 'KM' : 'Horas'})`}
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Select 
              label="Tipo de Serviço" 
              value={newInterval.service_type} 
              onChange={(e: any) => setNewInterval({...newInterval, service_type: e.target.value})}
              options={[
                { label: 'Geral', value: 'Geral' },
                ...MAINTENANCE_TYPES.map(s => ({ label: s, value: s }))
              ]}
            />
            <Input 
              label={`Intervalo (${activeType === 'odometer' ? 'km' : 'h'})`} 
              type="number" 
              value={newInterval.interval_km} 
              onChange={(e: any) => setNewInterval({...newInterval, interval_km: parseInt(e.target.value)})} 
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="flex-1">
                <Save size={20} /> {editingId ? 'Salvar' : 'Adicionar'}
              </Button>
              {editingId && (
                <Button variant="secondary" onClick={() => { setEditingId(null); setNewInterval({ service_type: 'Geral', interval_km: activeType === 'odometer' ? 10000 : 250, measurement_type: activeType }); }}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">
              Intervalos Definidos ({activeType === 'odometer' ? 'KM' : 'Horas'})
            </h4>
            <div className="grid gap-2">
              {filteredIntervals.length === 0 ? (
                <p className="text-sm text-slate-400 italic p-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  Nenhum intervalo definido para esta categoria.
                </p>
              ) : (
                filteredIntervals.map(i => (
                  <div key={i.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-700">{i.service_type}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-bold text-red-600">
                        {i.interval_km.toLocaleString()} {activeType === 'odometer' ? 'km' : 'h'}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(i)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => onDeleteInterval(i.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const Reports = ({ vehicles }: { vehicles: Vehicle[] }) => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    vehicleId: '',
    maintenanceType: '',
    specificService: '',
    globalSearch: ''
  });
  const [crossFilters, setCrossFilters] = useState<{
    service?: string;
    mechanic?: string;
    vehicle_plate?: string;
    type?: string;
    date?: string;
  }>({});
  const [allMaintenances, setAllMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMaintenances = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getMaintenances(
        undefined, 
        filters.startDate, 
        filters.endDate
      );
      setAllMaintenances(data);
    } catch (error) {
      console.error("Erro ao buscar manutenções:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenances();
  }, [filters.startDate, filters.endDate]);

  const normalize = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const baseFilteredData = useMemo(() => {
    return allMaintenances.filter(m => {
      if (filters.vehicleId && m.vehicle_id !== parseInt(filters.vehicleId)) return false;
      if (filters.maintenanceType && m.type !== filters.maintenanceType) return false;
      
      const services = JSON.parse(m.services || '[]');
      const serviceNames = services.map((s: any) => typeof s === 'object' ? s.name : s);
      
      if (filters.specificService && !serviceNames.includes(filters.specificService)) return false;
      
      if (filters.globalSearch) {
        const search = normalize(filters.globalSearch);
        const content = normalize(`${m.vehicle_plate} ${m.mechanic} ${m.observations} ${m.other_services} ${serviceNames.join(' ')}`);
        if (!content.includes(search)) return false;
      }
      return true;
    });
  }, [allMaintenances, filters]);

  const filteredData = useMemo(() => {
    return baseFilteredData.filter(m => {
      const services = JSON.parse(m.services || '[]');
      const serviceNames = services.map((s: any) => typeof s === 'object' ? s.name : s);

      if (crossFilters.service && !serviceNames.includes(crossFilters.service)) return false;
      if (crossFilters.mechanic && !m.mechanic.includes(crossFilters.mechanic)) return false;
      if (crossFilters.vehicle_plate && m.vehicle_plate !== crossFilters.vehicle_plate) return false;
      if (crossFilters.type && m.type !== crossFilters.type) return false;
      if (crossFilters.date && m.date !== crossFilters.date) return false;

      return true;
    });
  }, [baseFilteredData, crossFilters]);

  const getDuration = (start?: string, end?: string) => {
    if (!start || !end) return 0;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    return Math.max(0, diff / 60); // in hours
  };

  const durationTrend = useMemo(() => {
    const data = baseFilteredData.filter(m => {
      const services = JSON.parse(m.services || '[]');
      const serviceNames = services.map((s: any) => typeof s === 'object' ? s.name : s);
      if (crossFilters.service && !serviceNames.includes(crossFilters.service)) return false;
      if (crossFilters.mechanic && !m.mechanic.includes(crossFilters.mechanic)) return false;
      if (crossFilters.vehicle_plate && m.vehicle_plate !== crossFilters.vehicle_plate) return false;
      if (crossFilters.type && m.type !== crossFilters.type) return false;
      return true;
    });

    const daily = new Map();
    data.forEach(m => {
      const date = m.date;
      const duration = getDuration(m.start_time, m.end_time);
      const current = daily.get(date) || { total: 0, count: 0 };
      daily.set(date, { total: current.total + duration, count: current.count + 1 });
    });
    return Array.from(daily.entries())
      .map(([date, val]) => ({ date, duration: parseFloat((val.total / val.count).toFixed(2)) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [baseFilteredData, crossFilters]);

  const topServices = useMemo(() => {
    const data = baseFilteredData.filter(m => {
      if (crossFilters.mechanic && !m.mechanic.includes(crossFilters.mechanic)) return false;
      if (crossFilters.vehicle_plate && m.vehicle_plate !== crossFilters.vehicle_plate) return false;
      if (crossFilters.type && m.type !== crossFilters.type) return false;
      if (crossFilters.date && m.date !== crossFilters.date) return false;
      return true;
    });

    const counts = new Map();
    data.forEach(m => {
      const services = JSON.parse(m.services || '[]');
      services.forEach((s: any) => {
        const name = typeof s === 'object' ? s.name : s;
        counts.set(name, (counts.get(name) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [baseFilteredData, crossFilters]);

  const problematicVehicles = useMemo(() => {
    const data = baseFilteredData.filter(m => {
      const services = JSON.parse(m.services || '[]');
      const serviceNames = services.map((s: any) => typeof s === 'object' ? s.name : s);
      if (crossFilters.service && !serviceNames.includes(crossFilters.service)) return false;
      if (crossFilters.mechanic && !m.mechanic.includes(crossFilters.mechanic)) return false;
      if (crossFilters.type && m.type !== crossFilters.type) return false;
      if (crossFilters.date && m.date !== crossFilters.date) return false;
      return true;
    });

    const counts = new Map();
    data.forEach(m => {
      counts.set(m.vehicle_plate, (counts.get(m.vehicle_plate) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([vehicle_plate, count]) => ({ vehicle_plate, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [baseFilteredData, crossFilters]);

  const mechanicPerformance = useMemo(() => {
    const data = baseFilteredData.filter(m => {
      const services = JSON.parse(m.services || '[]');
      const serviceNames = services.map((s: any) => typeof s === 'object' ? s.name : s);
      if (crossFilters.service && !serviceNames.includes(crossFilters.service)) return false;
      if (crossFilters.vehicle_plate && m.vehicle_plate !== crossFilters.vehicle_plate) return false;
      if (crossFilters.type && m.type !== crossFilters.type) return false;
      if (crossFilters.date && m.date !== crossFilters.date) return false;
      return true;
    });

    const stats = new Map();
    data.forEach(m => {
      const mechanics = m.mechanic.split(',').map(s => s.trim());
      const duration = getDuration(m.start_time, m.end_time);
      mechanics.forEach(mech => {
        const current = stats.get(mech) || { total: 0, count: 0 };
        stats.set(mech, { total: current.total + duration, count: current.count + 1 });
      });
    });
    return Array.from(stats.entries())
      .map(([name, val]) => ({ name, avgDuration: parseFloat((val.total / val.count).toFixed(2)) }))
      .sort((a, b) => b.avgDuration - a.avgDuration);
  }, [baseFilteredData, crossFilters]);

  const exportCSV = () => {
    const headers = ['Data', 'Veículo', 'Tipo', 'Km', 'Mecânico', 'Serviços', 'Duração (h)', 'Custo'];
    const rows = filteredData.map(m => {
      const services = JSON.parse(m.services || '[]');
      const servicesStr = services.map((s: any) => {
        if (typeof s === 'object' && s !== null) {
          const qty = s.quantity > 1 ? ` (${s.quantity}x)` : '';
          const sides = s.sides?.length > 0 ? ` [${s.sides.join(', ')}]` : '';
          return `${s.name}${qty}${sides}`;
        }
        return s;
      }).join('; ');

      return [
        m.date,
        m.vehicle_plate,
        m.type,
        m.km,
        m.mechanic,
        servicesStr,
        getDuration(m.start_time, m.end_time).toFixed(2),
        m.cost
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_manutencao_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const toggleCrossFilter = (key: keyof typeof crossFilters, value: string) => {
    setCrossFilters(prev => {
      if (prev[key] === value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 size={24} />
          Relatórios de Gestão
        </h2>
        <div className="flex items-center gap-2">
          {Object.keys(crossFilters).length > 0 && (
            <Button variant="ghost" onClick={() => setCrossFilters({})} className="text-xs">
              Limpar Filtros Gráficos
            </Button>
          )}
          <Button variant="secondary" onClick={exportCSV}>
            <Download size={18} /> Exportar CSV
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
          <Input label="Data Início" type="date" value={filters.startDate} onChange={(e: any) => setFilters({...filters, startDate: e.target.value})} />
          <Input label="Data Fim" type="date" value={filters.endDate} onChange={(e: any) => setFilters({...filters, endDate: e.target.value})} />
          <Select 
            label="Veículo" 
            value={filters.vehicleId} 
            onChange={(e: any) => setFilters({...filters, vehicleId: e.target.value})}
            options={[
              { label: 'Todos', value: '' },
              ...vehicles.map(v => ({ label: v.plate, value: v.id }))
            ]}
          />
          <Select 
            label="Tipo" 
            value={filters.maintenanceType} 
            onChange={(e: any) => setFilters({...filters, maintenanceType: e.target.value})}
            options={[
              { label: 'Todos', value: '' },
              { label: 'Preventiva', value: 'Preventiva' },
              { label: 'Corretiva', value: 'Corretiva' },
              { label: 'Preditiva', value: 'Preditiva' },
            ]}
          />
          <Select 
            label="Serviço" 
            value={filters.specificService} 
            onChange={(e: any) => setFilters({...filters, specificService: e.target.value})}
            options={[
              { label: 'Todos', value: '' },
              ...MAINTENANCE_TYPES.map(s => ({ label: s, value: s }))
            ]}
          />
          <div className="relative">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Busca Global</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Pesquisar..."
                value={filters.globalSearch}
                onChange={e => setFilters({...filters, globalSearch: e.target.value})}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 flex flex-col items-center justify-center">
          <Truck size={32} className="mb-2 text-red-600" />
          <span className="text-3xl font-black text-slate-800">{filteredData.length}</span>
          <span className="text-xs font-bold uppercase text-slate-400">Manutenções Filtradas</span>
        </Card>
        <Card className="p-6 flex flex-col items-center justify-center border-emerald-100 bg-emerald-50/30">
          <Clock size={32} className="mb-2 text-emerald-600" />
          <span className="text-3xl font-black text-slate-800">
            {filteredData.reduce((acc, m) => acc + getDuration(m.start_time, m.end_time), 0).toFixed(1)}h
          </span>
          <span className="text-xs font-bold uppercase text-slate-400">Tempo Total de Oficina</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendência de Duração */}
        <Card className="p-6">
          <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
            <History size={18} /> Tendência de Duração (Horas Médias)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={durationTrend} onClick={(data: any) => data && data.activePayload && toggleCrossFilter('date', data.activePayload[0].payload.date)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={10} tickFormatter={(val) => formatLocalDateShort(val)} />
                <YAxis fontSize={10} />
                <Tooltip labelFormatter={(val) => formatLocalDate(val)} />
                <Line 
                  type="monotone" 
                  dataKey="duration" 
                  stroke="#dc2626" 
                  strokeWidth={2} 
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (crossFilters.date === payload.date) {
                      return <circle cx={cx} cy={cy} r={6} fill="#dc2626" stroke="#fff" strokeWidth={2} />;
                    }
                    return <circle cx={cx} cy={cy} r={4} fill="#dc2626" />;
                  }}
                  activeDot={{ r: 8 }} 
                  cursor="pointer"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Serviços */}
        <Card className="p-6">
          <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
            <Wrench size={18} /> Top Serviços (Frequência)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topServices} layout="vertical" onClick={(data: any) => data && data.activePayload && toggleCrossFilter('service', data.activePayload[0].payload.name)}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" fontSize={10} />
                <YAxis dataKey="name" type="category" fontSize={10} width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]}>
                  {topServices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={crossFilters.service === entry.name ? '#059669' : '#10b981'} cursor="pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Veículos mais problemáticos */}
        <Card className="p-6">
          <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
            <AlertTriangle size={18} /> Veículos com Mais Manutenções
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={problematicVehicles} onClick={(data: any) => data && data.activePayload && toggleCrossFilter('vehicle_plate', data.activePayload[0].payload.vehicle_plate)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="vehicle_plate" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                  {problematicVehicles.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={crossFilters.vehicle_plate === entry.vehicle_plate ? '#d97706' : '#f59e0b'} cursor="pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Tempo médio por mecânico */}
        <Card className="p-6">
          <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
            <User size={18} /> Tempo Médio por Mecânico (Horas)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mechanicPerformance} layout="vertical" onClick={(data: any) => data && data.activePayload && toggleCrossFilter('mechanic', data.activePayload[0].payload.name)}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" fontSize={10} />
                <YAxis dataKey="name" type="category" fontSize={10} width={100} />
                <Tooltip />
                <Bar dataKey="avgDuration" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                  {mechanicPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={crossFilters.mechanic === entry.name ? '#7c3aed' : '#8b5cf6'} cursor="pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Histórico Detalhado */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <ClipboardList size={18} /> Histórico Detalhado das Manutenções
          </h3>
          <span className="text-xs font-medium text-slate-500">{filteredData.length} registros encontrados</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-3 border-b border-slate-100">Data</th>
                <th className="px-6 py-3 border-b border-slate-100">Veículo</th>
                <th className="px-6 py-3 border-b border-slate-100">Tipo</th>
                <th className="px-6 py-3 border-b border-slate-100">Mecânico</th>
                <th className="px-6 py-3 border-b border-slate-100">Serviços</th>
                <th className="px-6 py-3 border-b border-slate-100">Duração</th>
                <th className="px-6 py-3 border-b border-slate-100">Km</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((m) => {
                const services = JSON.parse(m.services || '[]');
                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">{formatLocalDate(m.date)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{m.vehicle_plate}</span>
                        <span className="text-[10px] text-slate-400">{m.vehicle_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.type === 'Preventiva' ? 'bg-emerald-100 text-emerald-700' : 
                        m.type === 'Corretiva' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {m.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{m.mechanic}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {services.slice(0, 2).map((s: any, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                            {typeof s === 'object' ? s.name : s}
                          </span>
                        ))}
                        {services.length > 2 && <span className="text-[10px] text-slate-400">+{services.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{getDuration(m.start_time, m.end_time).toFixed(1)}h</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {m.km.toLocaleString()} {vehicles.find((v: any) => v.id === m.vehicle_id)?.measurement_type === 'hour_meter' ? 'h' : 'km'}
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">Nenhum registro encontrado para os filtros selecionados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const VehicleHistory = ({ vehicle, maintenances, onBack, onEditMaintenance, onDeleteMaintenance, onEditVehicle, userRole }: any) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-2"><ChevronRight size={24} className="rotate-180" /></Button>
          <h2 className="text-xl font-bold text-slate-800">Histórico do Veículo</h2>
        </div>
        {userRole === 'admin' && (
          <Button variant="secondary" onClick={() => onEditVehicle(vehicle)} className="h-10">
            <SettingsIcon size={18} />
            <span className="hidden sm:inline">Configurações</span>
          </Button>
        )}
      </div>

      <Card className="p-6 bg-red-600 text-white border-none shadow-red-200 shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-red-200 text-xs font-bold uppercase tracking-widest">Veículo</span>
            <h3 className="text-4xl font-black">{vehicle.plate}</h3>
          </div>
          <div className="text-right">
            <span className="text-red-200 text-xs font-bold uppercase tracking-widest">Placa</span>
            <p className="text-xl font-bold">{vehicle.plate}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-red-200 text-[10px] font-bold uppercase">{vehicle.measurement_type === 'hour_meter' ? 'Horas Atuais' : 'Km Atual'}</p>
            <p className="text-lg font-mono">{vehicle.km_current.toLocaleString()} {vehicle.measurement_type === 'hour_meter' ? 'h' : 'km'}</p>
          </div>
          <div className="text-right">
            <p className="text-red-200 text-[10px] font-bold uppercase">Investimento Total</p>
            <p className="text-lg font-mono">R$ {maintenances.reduce((acc: number, m: any) => acc + (m.cost || 0), 0).toLocaleString()}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <History size={18} />
          Registros de Manutenção
        </h3>
        
        {maintenances.length > 0 ? (
          <div className="space-y-4">
            {maintenances.map((m: any) => {
              const services = JSON.parse(m.services || '[]');
              return (
                <Card key={m.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{formatLocalDate(m.date)}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><User size={12} /> {m.mechanic}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                        {m.km.toLocaleString()} {vehicle.measurement_type === 'hour_meter' ? 'h' : 'km'}
                      </span>
                      {userRole === 'admin' && (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => onEditMaintenance(m)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => onDeleteMaintenance(m)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {services.map((s: any, idx: number) => {
                      const isObject = typeof s === 'object' && s !== null;
                      const name = isObject ? s.name : s;
                      const qty = isObject && s.quantity > 1 ? ` (${s.quantity}x)` : '';
                      const sides = isObject && s.sides?.length > 0 ? ` [${s.sides.join(', ')}]` : '';
                      return (
                        <span key={idx} className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100">
                          {name}{qty}{sides}
                        </span>
                      );
                    })}
                  </div>

                  {m.other_services && (
                    <div className="mb-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Outros Serviços</p>
                      <p className="text-xs text-slate-600">{m.other_services}</p>
                    </div>
                  )}

                  {m.observations && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Observações</p>
                      <p className="text-xs text-slate-600 italic">"{m.observations}"</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center text-slate-400 italic">
            Nenhuma manutenção registrada para este veículo.
          </Card>
        )}
      </div>
    </div>
  );
};

const formatLocalDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
};

const formatLocalDateShort = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<{ role: 'admin' | 'mechanic', username: string } | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalVehicles: 0, inMaintenance: 0, available: 0, maintenancesThisMonth: 0 });
  const [intervals, setIntervals] = useState<MaintenanceInterval[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingMaintenance, setEditingMaintenance] = useState<any | null>(null);
  const [vehicleHistory, setVehicleHistory] = useState<Maintenance[]>([]);
  const [allMaintenances, setAllMaintenances] = useState<any[]>([]);
  const [updatingKMVehicle, setUpdatingKMVehicle] = useState<Vehicle | null>(null);
  const [newKM, setNewKM] = useState<number>(0);
  const [maintenanceSearch, setMaintenanceSearch] = useState('');
  const [reportIssues, setReportIssues] = useState<any[]>([]);
  const [reportForm, setReportForm] = useState({ maintenance_id: '', description: '' });
  const [confirmReport, setConfirmReport] = useState<any>(null);
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday is 0, so subtract day to get Sunday
    const sunday = new Date(d.getFullYear(), d.getMonth(), diff);
    const y = sunday.getFullYear();
    const m = String(sunday.getMonth() + 1).padStart(2, '0');
    const dd = String(sunday.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [vData, aData, sData, iData, mData, allMData, rData] = await Promise.all([
        supabaseService.getVehicles(),
        supabaseService.getAgenda(selectedWeek),
        supabaseService.getStats(),
        supabaseService.getIntervals(),
        supabaseService.getMechanics(),
        supabaseService.getMaintenances(),
        supabaseService.getReportIssues()
      ]);
      setVehicles(vData);
      setAgenda(aData);
      setStats(sData);
      setIntervals(iData);
      setMechanics(mData);
      setAllMaintenances(allMData);
      setReportIssues(rData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMechanic = async (name: string, id?: number) => {
    await supabaseService.saveMechanic(name, id);
    fetchData();
  };

  const handleDeleteMechanic = async (id: number) => {
    await supabaseService.deleteMechanic(id);
    fetchData();
  };

  const handleSaveInterval = async (data: any) => {
    await supabaseService.saveInterval(data);
    fetchData();
  };

  const handleDeleteInterval = async (id: number) => {
    await supabaseService.deleteInterval(id);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [selectedWeek]);

  const handleSaveVehicle = async (data: any) => {
    const payload = editingVehicle?.id ? { ...data, id: editingVehicle.id } : data;
    await supabaseService.saveVehicle(payload);
    
    setEditingVehicle(null);
    fetchData();
  };

  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [deletingMaintenance, setDeletingMaintenance] = useState<any | null>(null);

  const confirmDeleteVehicle = async () => {
    if (!deletingVehicle) return;

    try {
      await supabaseService.deleteVehicle(deletingVehicle.id);
      
      setDeletingVehicle(null);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir veículo. Tente novamente.');
    }
  };

  const confirmDeleteMaintenance = async () => {
    if (!deletingMaintenance) return;

    try {
      await supabaseService.deleteMaintenance(deletingMaintenance.id);
      setDeletingMaintenance(null);
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir manutenção. Tente novamente.');
    }
  };

  const handleDeleteVehicle = (v: Vehicle) => {
    setDeletingVehicle(v);
  };

  const handleQuickUpdateKM = async () => {
    if (!updatingKMVehicle) return;
    
    await supabaseService.saveVehicle({ ...updatingKMVehicle, km_current: newKM });
    
    setUpdatingKMVehicle(null);
    fetchData();
  };

  const handleSaveMaintenance = async (data: any) => {
    const payload = editingMaintenance ? { ...data, id: editingMaintenance.id } : data;
    await supabaseService.saveMaintenance(payload);
    
    setEditingMaintenance(null);
    setActiveTab('dashboard');
    fetchData();
  };

  const handleAgendaMove = async (id: number, day: string) => {
    await supabaseService.saveAgenda({ id, day_of_week: day });
    fetchData();
  };

  const handleAgendaComplete = async (id: number) => {
    await supabaseService.saveAgenda({ id, status: 'Concluído' });
    fetchData();
  };

  const handleAgendaDelete = async (id: number) => {
    await supabaseService.deleteAgenda(id);
    fetchData();
  };

  const handleAgendaAdd = async (entry: any) => {
    await supabaseService.saveAgenda({ day_of_week: entry.day, vehicle_id: entry.vehicleId, week_start_date: selectedWeek });
    fetchData();
  };

  const handleReportSubmit = async () => {
    if (!confirmReport || !reportForm.description) return;
    await supabaseService.saveReportIssue({
      maintenance_id: confirmReport.id,
      mechanic_name: user?.username || 'Mecânico',
      description: reportForm.description,
      status: 'pendente'
    });
    setReportForm({ maintenance_id: '', description: '' });
    setConfirmReport(null);
    alert('Reportagem enviada com sucesso!');
    fetchData();
  };

  const handleReportStatusChange = async (id: number, status: 'pendente' | 'resolvida') => {
    await supabaseService.updateReportIssueStatus(id, status);
    fetchData();
  };

  const handleLogin = (role: 'admin' | 'mechanic', username: string) => {
    setUser({ role, username });
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
  };

  const viewHistory = async (v: Vehicle) => {
    setSelectedVehicle(v);
    const data = await supabaseService.getMaintenances(v.id);
    setVehicleHistory(data);
    setActiveTab('history');
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Carregando FrotaControl...</p>
      </div>
    </div>
  );

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const allTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Veículos', icon: Truck },
    { id: 'contracts', label: 'Contratos', icon: FileText },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'register', label: 'Manutenção', icon: ClipboardList },
    { id: 'maintenances', label: 'Histórico', icon: History },
    { id: 'mechanics', label: 'Mecânicos', icon: Wrench },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'report_issue', label: 'Reportar', icon: AlertTriangle },
    { id: 'admin_reports', label: 'Reportagens', icon: AlertTriangle },
    { id: 'settings', label: 'Configurações', icon: SettingsIcon },
  ];

  const availableTabs = user.role === 'mechanic' 
    ? allTabs.filter(t => ['dashboard', 'vehicles', 'agenda', 'register', 'maintenances', 'report_issue'].includes(t.id))
    : allTabs.filter(t => t.id !== 'report_issue');

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-6 md:pl-64">
      {/* Sidebar Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:w-64 bg-white border-t md:border-t-0 md:border-r border-slate-200 z-50 flex flex-col justify-between">
        <div className="hidden md:flex flex-col p-6 gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-200">
              <img src="/icon.svg" className="w-6 h-6 invert brightness-0" alt="Logo" />
            </div>
            <div>
              <h1 className="font-black text-slate-800 tracking-tight leading-none">FROTA</h1>
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Control</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {availableTabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedVehicle(null); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={20} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:block p-4 border-t border-slate-100">
            <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                        <User size={16} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-700">{user.role === 'admin' ? 'Administrador' : 'Mecânico'}</p>
                        <p className="text-[10px] text-slate-400 uppercase">Logado</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Sair">
                    <LogOut size={18} />
                </button>
            </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden justify-around items-center p-2 overflow-x-auto">
          {availableTabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedVehicle(null); }}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                activeTab === tab.id ? 'text-red-600' : 'text-slate-400'
              }`}
            >
              <tab.icon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label}</span>
            </button>
          ))}
           <button 
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 p-2 rounded-lg text-slate-400 hover:text-red-500"
            >
              <LogOut size={20} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Sair</span>
            </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (selectedVehicle?.id || '') + (editingVehicle ? 'edit' : '')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <Dashboard vehicles={vehicles} stats={stats} intervals={intervals} maintenances={allMaintenances} role={user.role} />}
            
            {activeTab === 'contracts' && <Contracts vehicles={vehicles} />}

            {activeTab === 'vehicles' && (
              editingVehicle ? (
                <VehicleForm 
                  vehicle={editingVehicle} 
                  onSave={handleSaveVehicle} 
                  onCancel={() => setEditingVehicle(null)} 
                />
              ) : (
                <VehicleList 
                  vehicles={vehicles} 
                  onEdit={(v) => setEditingVehicle(v)} 
                  onSelect={viewHistory}
                  onEditKM={(v) => {
                    setUpdatingKMVehicle(v);
                    setNewKM(v.km_current);
                  }}
                  onDelete={handleDeleteVehicle}
                  userRole={user.role}
                />
              )
            )}

            {activeTab === 'agenda' && (
              <Agenda 
                agenda={agenda} 
                vehicles={vehicles} 
                onAdd={handleAgendaAdd}
                onMove={handleAgendaMove}
                onComplete={handleAgendaComplete}
                onDelete={handleAgendaDelete}
                selectedWeek={selectedWeek}
                setSelectedWeek={setSelectedWeek}
              />
            )}

            {activeTab === 'register' && (
              <MaintenanceForm 
                vehicles={vehicles} 
                mechanics={mechanics}
                initialData={editingMaintenance}
                onSave={handleSaveMaintenance} 
                onCancel={() => { setEditingMaintenance(null); setActiveTab('dashboard'); }} 
              />
            )}

            {activeTab === 'maintenances' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <History size={24} />
                    Histórico Geral de Manutenções
                  </h2>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar por número (#)" 
                      value={maintenanceSearch}
                      onChange={(e) => setMaintenanceSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  {allMaintenances
                    .filter(m => maintenanceSearch ? m.id.toString().includes(maintenanceSearch.replace('#', '')) : true)
                    .map((m: any) => {
                    const services = JSON.parse(m.services || '[]');
                    const v = vehicles.find(v => v.id === m.vehicle_id);
                    const isHourMeter = v?.measurement_type === 'hour_meter';
                    return (
                      <Card key={m.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono font-bold text-slate-500 text-sm">#{m.id}</span>
                              <span className="font-black text-red-600">{m.vehicle_plate}</span>
                              <span className="text-xs text-slate-400">• {m.vehicle_type}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800">{formatLocalDate(m.date)}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1"><User size={12} /> {m.mechanic}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                              {m.km.toLocaleString()} {isHourMeter ? 'h' : 'km'}
                            </span>
                            {user.role === 'admin' && (
                              <>
                                <button 
                                  onClick={() => { setEditingMaintenance(m); setActiveTab('register'); }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit size={16} />
                                </button>
                                <button 
                                  onClick={() => setDeletingMaintenance(m)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Apagar"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {services.map((s: any, idx: number) => (
                            <span key={idx} className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100">
                              {typeof s === 'object' ? s.name : s}
                            </span>
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                  {allMaintenances.filter(m => maintenanceSearch ? m.id.toString().includes(maintenanceSearch.replace('#', '')) : true).length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      Nenhuma manutenção encontrada.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'report_issue' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <AlertTriangle size={24} />
                  Reportar Erro em Manutenção
                </h2>
                <Card className="p-6 max-w-2xl">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Número da Manutenção (#)</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                          placeholder="Ex: 123"
                          value={reportForm.maintenance_id}
                          onChange={(e) => setReportForm({...reportForm, maintenance_id: e.target.value.replace(/\D/g, '')})}
                        />
                        <Button 
                          onClick={() => {
                            const m = allMaintenances.find(m => m.id.toString() === reportForm.maintenance_id);
                            if (m) {
                              setConfirmReport(m);
                            } else {
                              alert('Manutenção não encontrada.');
                            }
                          }}
                        >
                          Buscar
                        </Button>
                      </div>
                    </div>
                    
                    {confirmReport && (
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="font-bold text-slate-800 mb-2">Confirmar Manutenção:</p>
                        <p className="text-sm text-slate-600">Veículo: {confirmReport.vehicle_plate} ({confirmReport.vehicle_type})</p>
                        <p className="text-sm text-slate-600">Data: {formatLocalDate(confirmReport.date)}</p>
                        <p className="text-sm text-slate-600">Mecânico: {confirmReport.mechanic}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Erro</label>
                      <textarea 
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none min-h-[100px]"
                        placeholder="Descreva o que foi preenchido incorretamente..."
                        value={reportForm.description}
                        onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                      />
                    </div>

                    <Button 
                      className="w-full" 
                      disabled={!confirmReport || !reportForm.description}
                      onClick={handleReportSubmit}
                    >
                      Enviar Reportagem
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'admin_reports' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <AlertTriangle size={24} />
                  Reportagens de Erros
                </h2>
                <div className="space-y-4">
                  {reportIssues.map((report: any) => {
                    const m = allMaintenances.find(m => m.id === report.maintenance_id);
                    return (
                      <Card key={report.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-slate-800">Manutenção #{report.maintenance_id}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${report.status === 'resolvida' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {report.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 flex items-center gap-1"><User size={12} /> Reportado por: {report.mechanic_name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12} /> {new Date(report.created_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                          {report.status === 'pendente' && (
                            <Button className="px-3 py-1 text-sm" onClick={() => handleReportStatusChange(report.id, 'resolvida')}>
                              Marcar como Resolvida
                            </Button>
                          )}
                        </div>
                        <div className="p-3 bg-slate-50 rounded border border-slate-100 text-sm text-slate-700">
                          <p className="font-medium mb-1">Descrição do erro:</p>
                          <p>{report.description}</p>
                        </div>
                        {m && (
                          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                            Detalhes originais: {m.vehicle_plate} • {formatLocalDate(m.date)} • {m.mechanic}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                  {reportIssues.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      Nenhuma reportagem encontrada.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'mechanics' && (
              <Mechanics 
                mechanics={mechanics}
                onSave={handleSaveMechanic}
                onDelete={handleDeleteMechanic}
              />
            )}

            {activeTab === 'history' && selectedVehicle && (
              <VehicleHistory 
                vehicle={selectedVehicle} 
                maintenances={vehicleHistory} 
                onBack={() => setActiveTab('vehicles')} 
                onEditMaintenance={(m: any) => { setEditingMaintenance(m); setActiveTab('register'); }}
                onDeleteMaintenance={(m: any) => {
                  const v = vehicles.find(veh => veh.id === m.vehicle_id);
                  setDeletingMaintenance({ ...m, vehicle_plate: v?.plate || 'Desconhecido' });
                }}
                onEditVehicle={(v: any) => { setEditingVehicle(v); setActiveTab('vehicles'); }}
                userRole={user.role}
              />
            )}

            {activeTab === 'reports' && (
              <Reports vehicles={vehicles} />
            )}

            {activeTab === 'settings' && (
              <Settings 
                intervals={intervals} 
                onSaveInterval={handleSaveInterval} 
                onDeleteInterval={handleDeleteInterval}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Delete Maintenance Confirmation Modal */}
      {deletingMaintenance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4 mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Excluir Manutenção</h3>
              <p className="text-slate-500 text-center mb-6">
                Tem certeza que deseja excluir a manutenção <strong>#{deletingMaintenance.id}</strong> do veículo <strong>{deletingMaintenance.vehicle_plate}</strong>? 
                Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setDeletingMaintenance(null)} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={confirmDeleteMaintenance} 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Excluir
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4 mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Excluir Veículo</h3>
              <p className="text-slate-500 text-center mb-6">
                Tem certeza que deseja excluir o veículo <strong>{deletingVehicle.plate}</strong>? 
                Esta ação não pode ser desfeita e removerá todo o histórico de manutenções e agendamentos.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setDeletingVehicle(null)} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={confirmDeleteVehicle} 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Excluir
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Quick KM Update Modal */}
      <AnimatePresence>
        {updatingKMVehicle && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Atualizar {updatingKMVehicle.measurement_type === 'hour_meter' ? 'Horas' : 'KM'} - {updatingKMVehicle.plate}</h3>
                <button onClick={() => setUpdatingKMVehicle(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <Input 
                  label={updatingKMVehicle.measurement_type === 'hour_meter' ? 'Novas Horas' : 'Nova Quilometragem'} 
                  type="text" 
                  value={newKM} 
                  onChange={(e: any) => {
                    const val = e.target.value.replace(/\D/g, '');
                    const maxLen = updatingKMVehicle.measurement_type === 'hour_meter' ? 12 : 10;
                    setNewKM(val.slice(0, maxLen));
                  }}
                  autoFocus
                />
                
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleQuickUpdateKM}>
                    <Save size={18} /> Salvar
                  </Button>
                  <Button variant="secondary" onClick={() => setUpdatingKMVehicle(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
