export const localTriageKeywords = {
  emergency: ['bleed', 'blood', 'choking', 'collapse', 'unconscious', 'seizure', 'convulsion', 'poison', 'toxic', 'chocolate', 'grapes', 'xylitol', 'hit by car', 'trauma', 'breathing', 'gasping', 'pale gums', 'bloat', 'vomiting blood'],
  urgent: ['vomit', 'diarrhea', 'lethargic', 'limp', 'pain', 'whining', 'won\'t eat', 'not eating', 'not drinking'],
  routine: ['vaccine', 'vaccination', 'worming', 'deworm', 'flea', 'tick', 'nail clip', 'groom'],
  nutrition: ['how much to feed', 'water', 'diet', 'food amount', 'what can dogs eat', 'what can cats eat', 'treat'],
};

export interface LocalTriageResult {
  isEmergency: boolean;
  message: string | null;
}

export const analyzeQueryLocally = (query: string): LocalTriageResult => {
  const lowerQuery = query.toLowerCase();
  
  // 1. Check for emergencies
  const isEmergency = localTriageKeywords.emergency.some(kw => lowerQuery.includes(kw));
  if (isEmergency) {
    return {
      isEmergency: true,
      message: "**🚨 CRITICAL CRISIS DETECTED** (Local Triage System)\n\n" +
               "**IMMEDIATE ACTION REQUIRED:** Your pet's symptoms indicate a potential life-threatening emergency.\n\n" +
               "1. **STAY CALM.**\n" +
               "2. **DO NOT WAIT.** Contact your nearest 24/7 emergency veterinary clinic IMMEDIATELY.\n" +
               "3. **DO NOT GIVE HUMAN MEDICATION.**\n" +
               "4. **SECURE YOUR PET** safely for transport.\n"
    };
  }

  // 2. Urgent / High Priority
  const isUrgent = localTriageKeywords.urgent.some(kw => lowerQuery.includes(kw));
  if (isUrgent && (lowerQuery.includes('2 days') || lowerQuery.includes('severe') || lowerQuery.includes('constant'))) {
    return {
      isEmergency: false,
      message: "**⚠️ URGENT TRIAGE PROTOCOL** (Local Triage System)\n\n" +
               "Based on your description, this requires veterinary attention soon.\n\n" +
               "1. Keep your pet quiet, warm, and comfortable.\n" +
               "2. Ensure fresh water is available but do not force them to drink.\n" +
               "3. Schedule a veterinary appointment today.\n" +
               "4. If symptoms worsen, proceed to an emergency clinic."
    };
  }

  // 3. Routine Math / Knowledge Base (Cost Saving Heuristics)
  if (lowerQuery.includes('how much water')) {
    return {
      isEmergency: false,
      message: "💧 **Hydration Guideline:** As a general rule, dogs and cats need about 50-60ml of water per kilogram of body weight daily. For example, a 10kg dog needs roughly 500-600ml. Ensure fresh water is always available!"
    };
  }
  
  if (lowerQuery.includes('chocolate') || lowerQuery.includes('grapes') || lowerQuery.includes('xylitol')) {
    return {
      isEmergency: true,
      message: "**🚨 TOXICITY ALERT:** The item mentioned is highly toxic to pets. Please contact an emergency vet or animal poison control immediately."
    };
  }

  // 4. No local match, forward to AI
  return {
    isEmergency: false,
    message: null
  };
};

export const getLocalFallbackResponse = (query: string): string | null => {
  const result = analyzeQueryLocally(query);
  if (result.message) {
    return result.message + "\n\n*(This is an automated local response)*";
  }
  return null;
}
