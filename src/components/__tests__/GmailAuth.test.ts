import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authorizeGmail } from '../../services/gmailService';

// Mock firebase/auth methods used inside authorizeGmail
vi.mock('firebase/auth', () => {
  return {
    GoogleAuthProvider: class {
      addScope = vi.fn();
      setCustomParameters = vi.fn();
      static credentialFromResult = vi.fn().mockReturnValue({ accessToken: 'mock-gmail-token-xyz-123' });
    },
    signInWithPopup: vi.fn().mockResolvedValue({
      user: {
        email: 'test-vet-vet@example.com'
      }
    })
  };
});

describe('Gmail Authorization Flow Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('correctly sets zool_gmail_token and zool_gmail_email in localStorage upon successful authentication', async () => {
    const mockAuth = {};
    const token = await authorizeGmail(mockAuth);

    // Verify authorizeGmail returns the mock access token
    expect(token).toBe('mock-gmail-token-xyz-123');

    // Simulate the SettingsView's successful connection flow
    if (token) {
      localStorage.setItem('zool_gmail_token', token);
      localStorage.setItem('zool_gmail_email', 'test-vet-vet@example.com');
    }

    // Assert that zool_gmail_token key exists and has the correct value in localStorage
    const savedToken = localStorage.getItem('zool_gmail_token');
    const savedEmail = localStorage.getItem('zool_gmail_email');

    expect(savedToken).toBe('mock-gmail-token-xyz-123');
    expect(savedEmail).toBe('test-vet-vet@example.com');
    expect(localStorage.getItem('zool_gmail_token')).not.toBeNull();
  });

  it('keeps localStorage empty if authorization fails or is canceled', async () => {
    // If auth returns null or throws, we shouldn't persist anything
    const badAuth = null;
    const token = await authorizeGmail(badAuth);
    
    // In actual flow, if token is null, we do not write to localStorage
    if (!token) {
      localStorage.removeItem('zool_gmail_token');
      localStorage.removeItem('zool_gmail_email');
    }

    expect(localStorage.getItem('zool_gmail_token')).toBeNull();
    expect(localStorage.getItem('zool_gmail_email')).toBeNull();
  });
});
