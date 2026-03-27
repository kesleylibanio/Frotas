import jsPDF from 'jspdf';
import { Maintenance, Vehicle, MaintenanceInterval } from '../types';

export const generateMaintenancePDF = (
  maintenance: Maintenance, 
  vehicle: Vehicle | undefined, 
  intervals: MaintenanceInterval[], 
  allMaintenances: Maintenance[],
  nextChangeKMValue?: string | number | null
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const currentServices = JSON.parse(maintenance.services || '[]');
  const currentServicesNames = currentServices.map((s: any) => typeof s === 'object' ? s.name : s);

  // Troca de óleo logic
  let lastOilChangeMaintenance: Maintenance | undefined;
  if (currentServicesNames.includes('Troca óleo')) {
    lastOilChangeMaintenance = maintenance;
  } else {
    const oilChangeMaintenances = allMaintenances
      .filter(m => m.vehicle_id === maintenance.vehicle_id && m.id !== maintenance.id)
      .filter(m => JSON.parse(m.services || '[]').some((s: any) => (typeof s === 'object' ? s.name : s) === 'Troca óleo'))
      .sort((a, b) => b.km - a.km);
    lastOilChangeMaintenance = oilChangeMaintenances[0];
  }
  
  // Fallback to vehicle.last_maintenance_km if no oil change found in history, 
  // as requested: "terá como base a informação 'última manutenção' que aparece no card do veículo"
  const lastOilChangeKM = lastOilChangeMaintenance 
    ? lastOilChangeMaintenance.km.toLocaleString() 
    : (vehicle?.last_maintenance_km ? vehicle.last_maintenance_km.toLocaleString() : 'Não informado');
  
  const lastOilChangeDate = lastOilChangeMaintenance 
    ? new Date(lastOilChangeMaintenance.date).toLocaleDateString('pt-BR') 
    : 'Não informado';

  // Use the provided value if available, otherwise fallback to calculation
  let nextChangeKM = nextChangeKMValue !== undefined && nextChangeKMValue !== null 
    ? nextChangeKMValue.toLocaleString() 
    : 'Não informado';

  if (nextChangeKMValue === undefined || nextChangeKMValue === null) {
    const interval = intervals.find(i => i.service_type === 'Troca óleo' && (!i.brand || i.brand === vehicle?.brand) && (!i.vehicle_type || i.vehicle_type === vehicle?.type));
    nextChangeKM = lastOilChangeMaintenance && interval 
      ? (lastOilChangeMaintenance.km + interval.interval_km).toLocaleString() 
      : (vehicle?.last_maintenance_km && interval 
          ? (vehicle.last_maintenance_km + interval.interval_km).toLocaleString() 
          : 'Não informado');
  }

  // Helper for "Não informado"
  const val = (v: any) => (v === null || v === undefined || v === '' ? 'Não informado' : v);

  // Layout
  doc.setFontSize(10);
  
  // [TOPO]
  doc.setFont('helvetica', 'bold');
  doc.text('Pipa Alves Locacoes e Transportes LTDA', 105, 15, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('CNPJ: 07.862.400/0001-5 | Rua Begônias, 121 | Tel: 3831-3245 - 987429819', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDEM DE SERVIÇO', 105, 30, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`OS #: ${maintenance.id}`, 190, 30, { align: 'right' });
  doc.line(10, 33, 200, 33);

  // [DADOS PRINCIPAIS]
  doc.text('DADOS PRINCIPAIS', 15, 40);
  doc.setFont('helvetica', 'normal');
  doc.text(`Placa / TAG: ${val(maintenance.vehicle_plate)}`, 15, 46);
  doc.text(`Equipamento: ${val(vehicle?.description)}`, 80, 46);
  doc.text(`Odômetro: ${val(maintenance.km.toLocaleString())}`, 150, 46);
  doc.line(10, 50, 200, 50);

  // [TROCA DE ÓLEO]
  doc.setFont('helvetica', 'bold');
  doc.text('TROCA DE ÓLEO', 15, 57);
  doc.setFont('helvetica', 'normal');
  doc.text(`Última troca: ${lastOilChangeDate} - ${lastOilChangeKM} km`, 15, 63);
  doc.text(`Próxima troca: ${nextChangeKM} km`, 15, 69);
  doc.line(10, 73, 200, 73);

  // [MANUTENÇÃO]
  doc.setFont('helvetica', 'bold');
  doc.text('MANUTENÇÃO', 15, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tipo: ${val(maintenance.type)}`, 15, 86);
  doc.text('Descrição dos Serviços Realizados:', 15, 92);
  const servicesText = currentServicesNames.join(', ').replace(/, ([^,]*)$/, ' e $1');
  doc.text(servicesText, 15, 98, { maxWidth: 180 });
  doc.line(10, 110, 200, 110);

  // [RODAPÉ]
  doc.setFont('helvetica', 'bold');
  doc.text('RODAPÉ', 15, 117);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data início: ${val(maintenance.date)} | Hora início: ${val(maintenance.start_time)}`, 15, 123);
  doc.text(`Data fim: ${val(maintenance.end_date)} | Hora fim: ${val(maintenance.end_time)}`, 15, 129);
  doc.text(`Responsável: ${val(maintenance.mechanic)}`, 15, 135);

  // [ASSINATURA]
  doc.line(60, 154, 150, 154);
  doc.text('Assinatura do responsável', 105, 159, { align: 'center' });

  doc.save(`OS_${maintenance.id}.pdf`);
};
