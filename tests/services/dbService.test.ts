import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addOwnerPet } from '../../src/services/dbService';
import { PetProfile } from '../../src/types';

// Mock the firebase auth, db, and firestore functions
vi.mock('../../src/lib/firebase', () => ({
  auth: { currentUser: { uid: 'test-user-uid' } },
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn().mockResolvedValue(undefined),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: vi.fn(),
  addDoc: vi.fn(),
}));

describe('dbService - addOwnerPet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw an error if pet name is missing', async () => {
    const petWithoutName = {
      species: 'Dog',
      ownerUid: 'owner-123',
      breed: 'Mixed',
      age: 2,
      weightKg: 10,
      trialModeActive: false,
    } as PetProfile;

    await expect(addOwnerPet(petWithoutName)).rejects.toThrowError(
      "Missing required pet fields (name, species, ownerUid)."
    );
  });

  it('should throw an error if pet species is missing', async () => {
    const petWithoutSpecies = {
      name: 'Buddy',
      ownerUid: 'owner-123',
      breed: 'Mixed',
      age: 2,
      weightKg: 10,
      trialModeActive: false,
    } as PetProfile;

    await expect(addOwnerPet(petWithoutSpecies)).rejects.toThrowError(
      "Missing required pet fields (name, species, ownerUid)."
    );
  });

  it('should throw an error if ownerUid is missing', async () => {
    const petWithoutOwnerUid = {
      name: 'Buddy',
      species: 'Dog',
      breed: 'Mixed',
      age: 2,
      weightKg: 10,
      trialModeActive: false,
    } as PetProfile;

    await expect(addOwnerPet(petWithoutOwnerUid)).rejects.toThrowError(
      "Missing required pet fields (name, species, ownerUid)."
    );
  });

  it('should successfully add a pet if all required fields are present', async () => {
    const validPet = {
      name: 'Buddy',
      species: 'Dog',
      ownerUid: 'owner-123',
      breed: 'Mixed',
      age: 2,
      weightKg: 10,
      trialModeActive: false,
    } as PetProfile;

    const result = await addOwnerPet(validPet);

    // Result should be the petId which starts with "pet_"
    expect(result).toMatch(/^pet_\d+$/);

    // Should call setDoc
    const { setDoc } = await import('firebase/firestore');
    expect(setDoc).toHaveBeenCalledTimes(1);
  });
});
