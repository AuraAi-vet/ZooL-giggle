// src/utils/dataMappers.ts

export const mapToActivePatientProps = (rawPetData: any, computedScore: number) => {
  // We no longer need to guess the status on the frontend; 
  // we use the rigorously calculated backend score.
  let status: "CLEAR" | "MONITORING" | "ACTION_NEEDED" = "CLEAR";
  if (computedScore < 60) status = "ACTION_NEEDED";
  else if (computedScore < 85) status = "MONITORING";

  return {
    petName: rawPetData.name, 
    speciesBreed: `${rawPetData.species} - ${rawPetData.breed}`, 
    avatarUrl: rawPetData.imageUrl,
    healthStatus: status,
    healthScore: computedScore, // <--- New prop ready for the SVG animation
    nextMilestone: rawPetData.nextVaccineDate ? `Vaccination due ${rawPetData.nextVaccineDate}` : "Up to date"
  };
};

export const mapToTimelineProps = (rawLogs: any[]) => {
  return rawLogs.map(log => ({
    id: log.id,
    date: new Date(log.timestamp).toLocaleDateString(),
    type: log.visitType as any,
    title: log.primaryReason,
    summaryText: log.vetSummaryNotes,
  }));
};
