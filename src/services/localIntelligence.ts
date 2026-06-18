import { Pet, HealthRecord } from '../types';

export interface LocalSuggestion {
  title: string;
  description: string;
  type: 'vaccination' | 'checkup' | 'medication' | 'other';
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}

const WSAVA_GUIDELINES = {
  dog: {
    core_vaccines: [
      { name: "Rabies", ageWeeks: 12, frequencyMonths: 36 },
      { name: "DAPP (Distemper, Adenovirus, Parvovirus, Parainfluenza)", ageWeeks: 6, frequencyMonths: 12 },
    ],
    checkup: { frequencyMonths: 12 },
    senior_checkup: { frequencyMonths: 6, ageThresholdYears: 7 },
  },
  cat: {
    core_vaccines: [
      { name: "Rabies", ageWeeks: 12, frequencyMonths: 12 },
      { name: "FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)", ageWeeks: 6, frequencyMonths: 12 },
    ],
    checkup: { frequencyMonths: 12 },
    senior_checkup: { frequencyMonths: 6, ageThresholdYears: 7 },
  }
};

const getAgeInWeeks = (birthDate: string) => {
  const diffTime = Math.abs(new Date().getTime() - new Date(birthDate).getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
};

const getAgeInYears = (birthDate: string) => {
  const diffTime = Math.abs(new Date().getTime() - new Date(birthDate).getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
};

export const generateLocalReminders = (pet: Pet, records: HealthRecord[]): LocalSuggestion[] => {
  const suggestions: LocalSuggestion[] = [];
  
  const species = pet.type.toLowerCase();
  const guidelines = WSAVA_GUIDELINES[species as keyof typeof WSAVA_GUIDELINES];
  
  if (!guidelines) return suggestions;

  const ageYears = pet.age;
  const ageWeeks = ageYears * 52; // Approximation since we have age in years

  // Checkups
  const checkupFreq = ageYears >= guidelines.senior_checkup.ageThresholdYears 
    ? guidelines.senior_checkup.frequencyMonths 
    : guidelines.checkup.frequencyMonths;
    
  const lastCheckup = records
    .filter(r => r.type === 'checkup')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const now = new Date();
  
  if (lastCheckup) {
    const monthsSinceLast = (now.getTime() - new Date(lastCheckup.date).getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsSinceLast >= checkupFreq - 1) { // Alert 1 month before due
      const dueDate = new Date(lastCheckup.date);
      dueDate.setMonth(dueDate.getMonth() + checkupFreq);
      suggestions.push({
        title: "Annual Wellness Exam",
        description: `It's time for ${pet.name}'s regular health checkup based on their age factor.`,
        type: 'checkup',
        dueDate: dueDate.toISOString(),
        priority: monthsSinceLast >= checkupFreq ? 'high' : 'medium'
      });
    }
  } else {
    // No checkup on record, suggest one immediately if older than 6 months
    if (ageWeeks > 24) {
      suggestions.push({
        title: "Initial Wellness Exam",
        description: `We don't have a recent checkup on file. It's highly recommended to schedule a baseline exam.`,
        type: 'checkup',
        dueDate: now.toISOString(),
        priority: 'high'
      });
    }
  }

  // Core Vaccines
  guidelines.core_vaccines.forEach(vaccine => {
    // Simple heuristic: If past initial age + no recent record with name matching
    const latestVax = records
      .filter(r => r.type === 'vaccination' && r.title.toLowerCase().includes(vaccine.name.toLowerCase().split(' ')[0]))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    if (latestVax) {
      const monthsSinceLast = (now.getTime() - new Date(latestVax.date).getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsSinceLast >= vaccine.frequencyMonths - 1) {
        const dueDate = new Date(latestVax.date);
        dueDate.setMonth(dueDate.getMonth() + vaccine.frequencyMonths);
        suggestions.push({
          title: `${vaccine.name} Booster`,
          description: `Due for regular booster coverage according to WSAVA scheduling protocols.`,
          type: 'vaccination',
          dueDate: dueDate.toISOString(),
          priority: monthsSinceLast >= vaccine.frequencyMonths ? 'high' : 'medium'
        });
      }
    } else {
      if (ageWeeks >= vaccine.ageWeeks) {
         // Should have gotten it, but no record
         suggestions.push({
          title: `Initial ${vaccine.name.split(' (')[0]} Series`,
          description: `Pet is at the required age for this core vaccine and there's no record of it yet.`,
          type: 'vaccination',
          dueDate: now.toISOString(),
          priority: 'high'
        });
      }
    }
  });

  return suggestions;
};

export const runLocalClinicalTriage = (query: string) => {
  const q = query.toLowerCase();
  
  if (q.includes('breathing') || q.includes('gasping')) {
    if (q.includes('blue gums') || q.includes('cyanosis') || q.includes('pale')) {
      return {
        severity: 'high' as const,
        differentials: ['Hypoxia / Respiratory Distress', 'Congestive Heart Failure', 'Severe Trauma', 'Airway Obstruction'],
        assessment: 'CRITICAL: Severe respiratory distress indicated by cyanosis. Immediate oxygen support required.',
        plan: ['Provide immediate supplemental oxygen', 'Establish IV access', 'Prepare for intubation if deterioration continues']
      };
    }
  }

  if (q.includes('vomit') || q.includes('diarrhea')) {
    if (q.includes('blood') || q.includes('lethargic') || q.includes('weak')) {
      return {
        severity: 'high' as const,
        differentials: ['Hemorrhagic Gastroenteritis (HGE)', 'Parvovirus', 'Foreign Body Obstruction', 'Severe Toxicity'],
        assessment: 'URGENT: Hemorrhagic presentation with systemic weakness indicates high risk of hypovolemic shock.',
        plan: ['Aggressive IV fluid therapy', 'Check PCV/TP and blood glucose', 'Abdominal radiographs']
      };
    }
    return {
      severity: 'low' as const,
      differentials: ['Dietary Indiscretion', 'Mild Gastroenteritis', 'Internal Parasites'],
      assessment: 'MILD: Uncomplicated gastrointestinal upset. Hydration status appears stable.',
      plan: ['Bland diet trial (chicken and rice)', 'Fecal flotation', 'Monitor for progression to lethargy or hematemesis']
    };
  }

  if (q.includes('seizure') || q.includes('convulsion')) {
    return {
      severity: 'high' as const,
      differentials: ['Idiopathic Epilepsy', 'Toxin Ingestion', 'Hypoglycemia', 'Intracranial Lesion'],
      assessment: 'URGENT: Neurological event. Seizure activity requires immediate stabilization if ongoing (status epilepticus).',
      plan: ['Administer IV Diazepam/Midazolam if actively seizing', 'Stat blood work (specifically glucose and calcium)', 'Neurological exam post-ictal']
    };
  }
  
  return null;
};
