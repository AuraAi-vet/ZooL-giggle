import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HealthRecord, Pet } from '../types';

export const exportHealthRecordsToPDF = (records: HealthRecord[], pets: Pet[]) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Pet Health Records', 14, 22);
  
  // Date
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  // Group records by pet
  const recordsByPet = records.reduce((acc, record) => {
    if (!acc[record.petId]) {
      acc[record.petId] = [];
    }
    acc[record.petId].push(record);
    return acc;
  }, {} as Record<string, HealthRecord[]>);

  let startY = 40;

  Object.entries(recordsByPet).forEach(([petId, petRecords], index) => {
    const pet = pets.find(p => p.id === petId);
    const petName = pet ? pet.name : 'Unknown Pet';

    if (index > 0) {
      startY = (doc as any).lastAutoTable.finalY + 15;
      if (startY > 250) {
        doc.addPage();
        startY = 20;
      }
    }

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Records for ${petName}`, 14, startY);

    const tableData = petRecords.map(record => [
      new Date(record.date).toLocaleDateString(),
      record.type.charAt(0).toUpperCase() + record.type.slice(1),
      record.title,
      record.description || 'N/A',
      record.nextDueDate ? new Date(record.nextDueDate).toLocaleDateString() : 'None'
    ]);

    autoTable(doc, {
      startY: startY + 5,
      head: [['Date', 'Type', 'Title', 'Description', 'Next Due']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [90, 90, 64] }, // ruru-navy-light
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 40 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 25 }
      }
    });
  });

  if (records.length === 0) {
    doc.setFontSize(12);
    doc.text('No health records found.', 14, startY + 10);
  }

  doc.save('pet-health-records.pdf');
};
