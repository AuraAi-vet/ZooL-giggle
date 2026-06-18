import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, setDoc, doc } from 'firebase/firestore';

/**
 * Service to orchestrate data ingestion and formatting for Gemma model fine-tuning.
 * This pipeline extracts veterinary clinical guidelines, standard care protocols,
 * and application UI documentation to build context-aware instructions.
 */

export interface TrainingDocument {
  docId: string;
  sourceType: 'clinical_protocol' | 'app_documentation' | 'care_guideline';
  content: string;
  metadata: {
    category: string;
    targetRole: 'vet' | 'owner' | 'admin' | 'staff';
    lastUpdated: number;
  };
}

export interface FinetuneSample {
  instruction: string;
  context: string;
  response: string;
  role: string;
}

export class GemmaPipelineService {
  
  /**
   * Ingests a raw document into the knowledge base (Firestore/Vector DB mock)
   */
  static async ingestDocument(docData: Omit<TrainingDocument, 'docId'>) {
    try {
      const kbCollection = collection(db, 'gemmaKnowledgeBase');
      const docRef = await addDoc(kbCollection, {
        ...docData,
        timestamp: serverTimestamp()
      });
      console.log(`Document ingested successfully for training pipeline: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      const errStr = String(error);
      if (errStr.includes("Missing or insufficient permissions")) {
         try {
           const mockKb = JSON.parse(localStorage.getItem('mock_gemma_kb') || '[]');
           const mockId = 'doc_' + Date.now();
           mockKb.push({ docId: mockId, ...docData });
           localStorage.setItem('mock_gemma_kb', JSON.stringify(mockKb));
           return mockId;
         } catch (e) {}
      }
      console.error('Error ingesting document:', error);
      throw error;
    }
  }

  /**
   * Generates formatted JSONL training data from ingested knowledge base
   * to be used for LoRA fine-tuning workflows in Vertex AI.
   */
  static async exportFinetuningDataset(): Promise<string> {
    const samples: FinetuneSample[] = [];
    
    try {
      const kbCollection = collection(db, 'gemmaKnowledgeBase');
      const kbSnapshot = await getDocs(kbCollection);
      
      kbSnapshot.forEach((docSnap) => {
        const data = docSnap.data() as TrainingDocument;
        this.processDocData(data, samples);
      });
    } catch (error) {
      const errStr = String(error);
      if (errStr.includes("Missing or insufficient permissions")) {
        try {
          const mockKb = JSON.parse(localStorage.getItem('mock_gemma_kb') || '[]');
          mockKb.forEach((data: any) => this.processDocData(data, samples));
        } catch (e) {}
      } else {
        throw error;
      }
    }

    // Convert to strict JSONL format suitable for Vertex AI Gemma fine-tuning
    return samples.map(sample => JSON.stringify({
      messages: [
        { role: "system", content: "You are the ZooL Help Assistant, an expert veterinary and platform support AI." },
        { role: "user", content: `User Role: ${sample.role}\nContext: ${sample.context}\nQuestion: ${sample.instruction}` },
        { role: "model", content: sample.response }
      ]
    })).join('\n');
  }

  private static processDocData(data: TrainingDocument, samples: FinetuneSample[]) {
    if (data.sourceType === 'clinical_protocol') {
      samples.push({
        instruction: `What is the standard clinical protocol for ${data.metadata.category}?`,
        context: data.content,
        response: `According to ZooL clinical guidelines for ${data.metadata.category}:\n\n${data.content}`,
        role: data.metadata.targetRole
      });
      
      samples.push({
        instruction: `Provide diagnostic and treatment support regarding ${data.metadata.category}.`,
        context: data.content,
        response: `Based on standardized protocols:\n${data.content}`,
        role: data.metadata.targetRole
      });
    } else if (data.sourceType === 'app_documentation') {
      samples.push({
        instruction: `How do I use the ${data.metadata.category} feature?`,
        context: data.content,
        response: `To use this feature:\n${data.content}`,
        role: data.metadata.targetRole
      });
      
      samples.push({
        instruction: `I need help with ${data.metadata.category}.`,
        context: data.content,
        response: `Here is the documentation regarding ${data.metadata.category}:\n${data.content}`,
        role: data.metadata.targetRole
      });
    } else {
      samples.push({
        instruction: `Provide support regarding ${data.metadata.category}.`,
        context: data.content,
        response: `Based on ZooL guidelines: ${data.content}`,
        role: data.metadata.targetRole
      });
    }
  }

  /**
   * Seed initial baseline knowledge for the ZooL model.
   */
  static async seedBaselineKnowledge() {
    const baselineDocs: Omit<TrainingDocument, 'docId'>[] = [
      {
        sourceType: 'clinical_protocol',
        content: 'For sudden resting heart rate spikes above 140 BPM in medium dogs, immediately flag for urgent telemetry review and advise owner to restrict activity.',
        metadata: { category: 'Cardiology', targetRole: 'vet', lastUpdated: Date.now() }
      },
      {
        sourceType: 'app_documentation',
        content: 'To log an activity offline, navigate to the Daily Activity widget. Entries will be saved to local device indexedDB and will automatically sync to Firestore upon reconnection. You will see an Offline tag while disconnected.',
        metadata: { category: 'Offline Syncing', targetRole: 'owner', lastUpdated: Date.now() }
      }
    ];

    await Promise.all(baselineDocs.map(doc => this.ingestDocument(doc)));
  }
}
