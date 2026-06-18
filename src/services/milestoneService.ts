import { Pet } from '../types';
import { toast } from 'sonner';

const triggeredMilestones = new Set<string>();

export const checkMilestones = (pets: Pet[]) => {
  const now = new Date();
  
  pets.forEach(pet => {
    if (pet.birthday && !triggeredMilestones.has(pet.id)) {
      const bday = new Date(pet.birthday);
      // Check if month and day match
      if (bday.getMonth() === now.getMonth() && bday.getDate() === now.getDate()) {
        const ageYears = now.getFullYear() - bday.getFullYear();
        
        let message = "";
        
        if (ageYears > 0) {
          message = `${pet.name} is ${ageYears} years old today! 🎉`;
        } else {
          // Check for months
          const ageMonths = (now.getFullYear() - bday.getFullYear()) * 12 + (now.getMonth() - bday.getMonth());
          if (ageMonths > 0) {
            message = `${pet.name} is ${ageMonths} months old today! 🎉`;
          }
        }
        
        if (message) {
            triggeredMilestones.add(pet.id);
            toast.success("Milestone!", {
                description: message,
            });
        }
      }
    }
  });
};
