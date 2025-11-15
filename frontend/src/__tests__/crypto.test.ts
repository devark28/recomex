import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CryptoService } from '../services/crypto';

// Mock Web Crypto API
const mockCrypto = {
  subtle: {
    importKey: vi.fn(),
    encrypt: vi.fn(),
  },
};

// @ts-ignore
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
});

// @ts-ignore
global.atob = vi.fn();
// @ts-ignore
global.btoa = vi.fn();
// @ts-ignore
global.TextEncoder = vi.fn().mockImplementation(() => ({
  encode: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
}));

describe('CryptoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('encryptPayload', () => {
    it('should encrypt payload with public key', async () => {
      const mockPayload = { action: 'test' };
      const mockPublicKey = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA\n-----END PUBLIC KEY-----';
      const mockEncryptedData = new ArrayBuffer(8);
      
      vi.mocked(atob).mockReturnValue('mockbinarydata');
      vi.mocked(btoa).mockReturnValue('mockbase64result');
      
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncryptedData);

      const result = await CryptoService.encryptPayload(mockPayload, mockPublicKey);

      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        'spki',
        expect.any(ArrayBuffer),
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['encrypt']
      );

      expect(mockCrypto.subtle.encrypt).toHaveBeenCalledWith(
        { name: 'RSA-OAEP' },
        {},
        expect.any(Uint8Array)
      );

      expect(result).toBe('mockbase64result');
    });

    it('should handle encryption errors', async () => {
      const mockPayload = { action: 'test' };
      const mockPublicKey = '-----BEGIN PUBLIC KEY-----\ntest\n-----END PUBLIC KEY-----';
      
      vi.mocked(atob).mockReturnValue('mockbinarydata');
      mockCrypto.subtle.importKey.mockRejectedValue(new Error('Invalid key'));

      await expect(CryptoService.encryptPayload(mockPayload, mockPublicKey))
        .rejects.toThrow('Invalid key');
    });
  });

  describe('base64ToArrayBuffer', () => {
    it('should convert base64 to ArrayBuffer', () => {
      vi.mocked(atob).mockReturnValue('test');
      
      // Access private method through any cast for testing
      const result = (CryptoService as any).base64ToArrayBuffer('dGVzdA==');
      
      expect(atob).toHaveBeenCalledWith('dGVzdA==');
      expect(result).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('arrayBufferToBase64', () => {
    it('should convert ArrayBuffer to base64', () => {
      const buffer = new ArrayBuffer(4);
      const view = new Uint8Array(buffer);
      view[0] = 116; // 't'
      view[1] = 101; // 'e'
      view[2] = 115; // 's'
      view[3] = 116; // 't'
      
      vi.mocked(btoa).mockReturnValue('dGVzdA==');
      
      // Access private method through any cast for testing
      const result = (CryptoService as any).arrayBufferToBase64(buffer);
      
      expect(btoa).toHaveBeenCalledWith('test');
      expect(result).toBe('dGVzdA==');
    });
  });
});