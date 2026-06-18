import { z } from 'zod';

export const petProfileSchema = z.object({
  name: z.string().min(1, "Pet name is required").max(100),
  species: z.string().min(1, "Species is required"),
  breed: z.string().min(1, "Breed is required").max(100),
  age: z.number().min(0, "Age must be at least 0").max(50),
  weightKg: z.number().min(0, "Weight must be positive"),
  trialModeActive: z.boolean().default(false),
  ownerUid: z.string().optional()
});

export type PetProfileInput = z.infer<typeof petProfileSchema>;
