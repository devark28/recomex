export class CryptoService {
  static async encryptPayload(payload: object, publicKey: string): Promise<string> {
    console.log(JSON.stringify({payload, publicKey}))
    try {
      // Import the public key
      const keyData = await crypto.subtle.importKey(
        'spki',
        this.base64ToArrayBuffer(publicKey.replace(/-----BEGIN PUBLIC KEY-----/, '').replace(/-----END PUBLIC KEY-----/, '').replace(/\s+/g, '')),
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['encrypt']
      );

      // Encrypt the payload
      const encodedPayload = new TextEncoder().encode(JSON.stringify(payload));
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP',
        },
        keyData,
        encodedPayload
      );

      return this.arrayBufferToBase64(encrypted);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}