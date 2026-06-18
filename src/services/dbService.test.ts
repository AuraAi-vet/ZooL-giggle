import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setDoc, doc } from 'firebase/firestore';
import { createUserProfile } from './dbService';

// Mock dependencies
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, collection, id) => ({ path: `${collection}/${id}` })),
  setDoc: vi.fn(),
}));

vi.mock('../lib/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user-id' } },
}));

describe('dbService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUserProfile', () => {
    it('should throw and handle error if setDoc fails', async () => {
      const mockError = new Error('Permission denied');
      vi.mocked(setDoc).mockRejectedValueOnce(mockError);

      const mockProfile = {
        uid: 'user-123',
        email: 'test@example.com',
        role: 'owner',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: Date.now()
      };

      // Ensure that createUserProfile throws the error formatted by handleFirestoreError
      await expect(createUserProfile(mockProfile as any)).rejects.toThrowError(/Permission denied/);

      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', mockProfile.uid);
      expect(setDoc).toHaveBeenCalledTimes(1);
    });

    it('should successfully create a user profile', async () => {
      vi.mocked(setDoc).mockResolvedValueOnce(undefined);

      const mockProfile = {
        uid: 'user-123',
        email: 'test@example.com',
        role: 'owner',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: Date.now()
      };

      await expect(createUserProfile(mockProfile as any)).resolves.toBeUndefined();

      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', mockProfile.uid);
      expect(setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'users/user-123' }),
        mockProfile
      );
    });
  });
});
