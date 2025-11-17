import {exec} from 'child_process';
import {promisify} from 'util';
import {readFile, mkdir} from 'fs/promises';
import {existsSync} from 'fs';
import {join} from 'path';
import {homedir} from 'os';
import {webcrypto} from 'crypto';

const execAsync = promisify(exec);

export class CryptoService {
    private static readonly KEY_DIR = join(homedir(), '.ssh');
    private static readonly PRIVATE_KEY_PATH = join(CryptoService.KEY_DIR, 'recomex_private.pem');
    private static readonly PUBLIC_KEY_PATH = join(CryptoService.KEY_DIR, 'recomex_public.pem');

    static async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
        try {
            // Ensure .ssh directory exists
            if (!existsSync(CryptoService.KEY_DIR)) {
                await mkdir(CryptoService.KEY_DIR, {mode: 0o700});
            }

            await execAsync(`openssl genpkey -algorithm RSA -out ${CryptoService.PRIVATE_KEY_PATH} -pkeyopt rsa_keygen_bits:2048`);
            await execAsync(`openssl rsa -in ${CryptoService.PRIVATE_KEY_PATH} -pubout -out ${CryptoService.PUBLIC_KEY_PATH}`);

            // Read the generated keys
            const privateKey = await readFile(CryptoService.PRIVATE_KEY_PATH, 'utf8');
            const publicKey = await readFile(CryptoService.PUBLIC_KEY_PATH, 'utf8');

            return {
                publicKey: publicKey.trim(),
                privateKey: privateKey.trim()
            };
        } catch (error) {
            throw new Error(`Key generation failed: ${error}`);
        }
    }

    static async loadKeys(): Promise<{ publicKey: string; privateKey: string } | null> {
        try {
            if (!existsSync(CryptoService.PRIVATE_KEY_PATH) || !existsSync(CryptoService.PUBLIC_KEY_PATH)) {
                return null;
            }

            const privateKey = await readFile(CryptoService.PRIVATE_KEY_PATH, 'utf8');
            const publicKey = await readFile(CryptoService.PUBLIC_KEY_PATH, 'utf8');

            return {
                publicKey: publicKey.trim().replace(/-----BEGIN PUBLIC KEY-----/, '').replace(/-----END PUBLIC KEY-----/, '').replace(/\s+/g, ''),
                privateKey: privateKey.trim().replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s+/g, '')
            };
        } catch (error) {
            return null;
        }
    }

    static async decryptPayload(encryptedPayload: string): Promise<any> {
        const privateKey = (await readFile(this.PRIVATE_KEY_PATH, 'utf8')).replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s+/g, '');
        try {
            // Import the private key
            const keyData = await webcrypto.subtle.importKey(
                'pkcs8',
                Buffer.from(privateKey, 'base64'),
                {
                    name: 'RSA-OAEP',
                    hash: 'SHA-256',
                },
                false,
                ['decrypt']
            );

            // Dencrypt the payload
            const encodedPayload = Buffer.from(encryptedPayload, 'base64');
            const decrypted = await webcrypto.subtle.decrypt(
                {
                    name: 'RSA-OAEP',
                },
                keyData,
                encodedPayload
            );

            return JSON.parse(Buffer.from(decrypted).toString('utf-8'));
        } catch (error) {
            throw new Error(`Decryption failed: ${error}`);
        }
    }
}