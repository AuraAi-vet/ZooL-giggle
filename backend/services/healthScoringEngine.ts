// backend/services/healthScoringEngine.ts

interface PetProfile {
  lastVaccineDate: string; // ISO Date
  idealWeight: number;
  currentWeight: number;
}

interface ClinicalLog {
  timestamp: string;
  type: 'ROUTINE' | 'LAB_RESULT' | 'EMERGENCY';
  abnormalFlags: number; 
  resolved: boolean;
}

export const calculatePetHealthScore = (profile: PetProfile, logs: ClinicalLog[]): number => {
  let score = 100;

  // 1. Preventative Care Penalty (e.g., Overdue Vaccines)
  const daysSinceVaccine = (new Date().getTime() - new Date(profile.lastVaccineDate).getTime()) / (1000 * 3600 * 24);
  if (daysSinceVaccine > 365) {
    score -= 20; // Heavy penalty for overdue core vaccines
  } else if (daysSinceVaccine > 330) {
    score -= 5; // Gentle warning penalty when due soon
  }

  // 2. Weight Fluctuation Penalty
  const weightVariance = Math.abs(profile.currentWeight - profile.idealWeight) / profile.idealWeight;
  if (weightVariance > 0.10) {
    // If weight fluctuates more than 10% from ideal
    score -= 15; 
  }

  // 3. Clinical Telemetry Penalty (Recent Labs & Visits)
  // Only look at the last 6 months of logs for immediate health scoring
  const recentLogs = logs.filter(log => 
    (new Date().getTime() - new Date(log.timestamp).getTime()) / (1000 * 3600 * 24) < 180
  );

  recentLogs.forEach(log => {
    if (log.abnormalFlags > 0 && !log.resolved) {
      // Deduct 10 points for every unresolved clinical flag
      score -= (log.abnormalFlags * 10); 
    }
    if (log.type === 'EMERGENCY') {
      // Base penalty for recent emergency, degrades over time
      score -= 25; 
    }
  });

  // Ensure the score never drops below 0 or exceeds 100
  return Math.max(0, Math.min(100, Math.round(score)));
};
