import { Place, Location, findNearbyPlaces } from './mapsService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { HealthRecord, Pet } from '../types';

/**
 * ZooL Services - Aggregated services for ZooL Vet & Co
 */

export const exportHealthRecordsToPDF = async (records: HealthRecord[], pets: Pet[]) => {
  console.log(`Exporting ${records.length} records for ${pets.length} pets to PDF`);
  try {
    // Basic dynamic pdf render
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Pet Health Clinical Passport', 14, 22);
    
    let currentY = 40;
    
    pets.forEach(pet => {
       doc.setFontSize(16);
       doc.setTextColor(0, 0, 0);
       doc.text(`Patient: ${pet.name} (${pet.breed || 'Companion'})`, 14, currentY);
       currentY += 10;
       
       const petRecords = records.filter(r => r.petId === pet.id);
       if (petRecords.length === 0) {
           doc.setFontSize(12);
           doc.setTextColor(100, 100, 100);
           doc.text('No clinical records found.', 14, currentY);
           currentY += 10;
       } else {
           petRecords.forEach(record => {
               if (currentY > 270) {
                   doc.addPage();
                   currentY = 20;
               }
               doc.setFontSize(12);
               doc.setTextColor(0, 0, 0);
               doc.text(`• ${record.date}: [${record.type.toUpperCase()}] ${record.title}`, 14, currentY);
               currentY += 6;
               if (record.description) {
                   doc.setFontSize(10);
                   doc.setTextColor(100, 100, 100);
                   const splitDesc = doc.splitTextToSize(record.description, 180);
                   doc.text(splitDesc, 18, currentY);
                   currentY += splitDesc.length * 5 + 4;
               }
           });
       }
       currentY += 10;
    });
    
    doc.save('zool-clinical-passport.pdf');
    return Promise.resolve();
  } catch (error) {
    console.error('PDF Generation failed', error);
    throw error;
  }
};

export interface TelemedicineSession {
  id: string;
  petId: string;
  vetId: string;
  startTime: string;
  duration: number; // in minutes
  status: 'scheduled' | 'active' | 'completed';
  meetingUrl: string;
}

export const TelemedicineService = {
  createSession: async (petId: string, vetId: string): Promise<TelemedicineSession> => {
    // Integrates with WebRTC / Daily.co
    return {
      id: Math.random().toString(36).substr(2, 9),
      petId,
      vetId,
      startTime: new Date().toISOString(),
      duration: 30,
      status: 'scheduled',
      meetingUrl: `https://ai-studio-demo.daily.co/zool-telehealth-demo`
    };
  }
};

export const PharmacyService = {
  findNearbyPharmacies: async (location: Location): Promise<Place[]> => {
    try {
      const pharmacies = await findNearbyPlaces(location, 'pharmacy');
      const vets = await findNearbyPlaces(location, 'vet');
      return [...pharmacies, ...vets];
    } catch (err) {
      console.warn("Failed to find nearby pharmacies via Overpass:", err);
      return [];
    }
  },
  orderPrescription: async (petId: string, prescriptionId: string, pharmacyId: string) => {
    // Simulated integration with a pharmacy fulfillment network like TruePill
    return new Promise((resolve) => setTimeout(() => resolve({
      success: true,
      orderId: `RX-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      status: 'processing',
      estimatedDelivery: new Date(Date.now() + 86400000).toISOString()
    }), 1500));
  }
};

export const InsuranceService = {
  getQuote: async (petId: string) => {
    // Simulated integration with a provider like Trupanion
    return new Promise((resolve) => setTimeout(() => resolve({
      provider: 'Trupanion',
      monthlyPremium: Math.floor(Math.random() * 30) + 20,
      deductible: 250,
      coverageLimit: 10000,
      quoteId: `QT-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
    }), 1500));
  }
};
