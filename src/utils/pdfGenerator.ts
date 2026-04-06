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

  const unit = vehicle?.measurement_type === 'hour_meter' ? 'horas' : 'km';
  const measurementLabel = vehicle?.measurement_type === 'hour_meter' ? 'Horímetro' : 'Odômetro';

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
  doc.text(`${measurementLabel}: ${val(maintenance.km.toLocaleString())}`, 150, 46);
  doc.line(10, 50, 200, 50);

  // [TROCA DE ÓLEO]
  doc.setFont('helvetica', 'bold');
  doc.text('TROCA DE ÓLEO', 15, 57);
  doc.setFont('helvetica', 'normal');
  doc.text(`Última troca: ${lastOilChangeDate} - ${lastOilChangeKM} ${unit}`, 15, 63);
  doc.text(`Próxima troca: ${nextChangeKM} ${unit}`, 15, 69);
  doc.line(10, 73, 200, 73);

  // [MANUTENÇÃO]
  doc.setFont('helvetica', 'bold');
  doc.text('MANUTENÇÃO', 15, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tipo: ${val(maintenance.type)}`, 15, 86);
  doc.text('Descrição dos Serviços Realizados:', 15, 92);
  
  let servicesText = currentServicesNames.join(', ').replace(/, ([^,]*)$/, ' e $1');
  if (maintenance.other_services) {
    servicesText += (servicesText ? ', ' : '') + maintenance.other_services;
  }
  
  const splitServices = doc.splitTextToSize(servicesText || 'Nenhum serviço selecionado', 180);
  doc.text(splitServices, 15, 98);
  
  const servicesHeight = splitServices.length * 5;
  let currentY = 98 + servicesHeight + 5;

  // [OBSERVAÇÕES GERAIS]
  doc.setFont('helvetica', 'bold');
  doc.text('OBSERVAÇÕES GERAIS', 15, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 6;
  const splitObs = doc.splitTextToSize(val(maintenance.observations), 180);
  doc.text(splitObs, 15, currentY);
  
  currentY += (splitObs.length * 5) + 5;
  doc.line(10, currentY, 200, currentY);
  currentY += 7;

  // [RODAPÉ]
  doc.setFont('helvetica', 'bold');
  doc.text('RODAPÉ', 15, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 6;
  doc.text(`Data início: ${val(maintenance.date)} | Hora início: ${val(maintenance.start_time)}`, 15, currentY);
  currentY += 6;
  doc.text(`Data fim: ${val(maintenance.end_date)} | Hora fim: ${val(maintenance.end_time)}`, 15, currentY);
  currentY += 6;
  doc.text(`Responsável: ${val(maintenance.mechanic)}`, 15, currentY);

  // [ASSINATURA]
  currentY += 20;
  if (currentY > 270) {
    doc.addPage();
    currentY = 20;
  }
  doc.line(60, currentY, 150, currentY);
  doc.text('Assinatura do responsável', 105, currentY + 5, { align: 'center' });

  doc.save(`OS_${maintenance.id}.pdf`);
};
