import {ClientConfig, Action} from './types';
import {CryptoService} from './services/cryptoService';
import {ApiService} from './services/apiService';
import {ConfigService} from './services/configService';
import {MediaModule} from './modules/mediaModule';
import {BrightnessModule} from './modules/brightnessModule';
import {VolumeModule} from './modules/volumeModule';
import {hostname} from 'os';

class RemoteControlClient {
    private config: ClientConfig | null = null;
    private apiService?: ApiService;
    private configService: ConfigService;
    private mediaModule: MediaModule;
    private brightnessModule: BrightnessModule;
    private volumeModule: VolumeModule;
    private pollTimer?: NodeJS.Timeout;

    constructor() {
        this.configService = new ConfigService();
        this.mediaModule = new MediaModule();
        this.brightnessModule = new BrightnessModule();
        this.volumeModule = new VolumeModule();
    }

    async register(token: string): Promise<void> {
        try {
            console.log('🔑 Generating RSA key pair...');
            const keyPair = await CryptoService.generateKeyPair();

            console.log('📡 Registering client with server...');
            const tempApiService = new ApiService('http://localhost:3000', 0);
            const response = await tempApiService.registerClient(
                token,
                keyPair.publicKey,
                hostname()
            );

            this.config = {
                clientId: response.clientId,
                serverUrl: 'http://localhost:3000',
                pollInterval: 5000,
                enabledModules: {
                    media: true,
                    brightness: true,
                    volume: true
                }
            };

            if (await this.configService.save(this.config)) {
                console.log('✅ Client registered successfully!');
                console.log(`   Client ID: ${this.config.clientId}`);
                console.log(`   Keys saved to: ~/.ssh/recomex*`);
            } else {
                throw new Error('Failed to save configuration');
            }
        } catch (error) {
            console.error('❌ Registration failed:', (error as Error).message);
            throw error;
        }
    }

    async start(): Promise<void> {
        this.config = await this.configService.load();

        if (!this.config) {
            console.error('❌ Client not registered. Run: npm run register -- <token>');
            return;
        }

        console.log('🚀 Starting remote control client...');
        console.log(`   Client ID: ${this.config.clientId}`);
        console.log(`   Server: ${this.config.serverUrl}`);

        this.apiService = new ApiService(this.config.serverUrl, this.config.clientId);

        // Configure modules
        this.mediaModule.setEnabled(this.config.enabledModules.media);
        this.brightnessModule.setEnabled(this.config.enabledModules.brightness);
        this.volumeModule.setEnabled(this.config.enabledModules.volume);

        this.startPolling();

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down gracefully...');
            this.stop();
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('\n🛑 Shutting down gracefully...');
            this.stop();
            process.exit(0);
        });

        console.log('✅ Client started. Press Ctrl+C to stop.');
    }

    private startPolling(): void {
        if (!this.config || !this.apiService) return;

        this.pollTimer = setInterval(async () => {
            try {
                const actions = await this.apiService!.pollActions();

                if (actions.length > 0) {
                    console.log(`📨 Received ${actions.length} action(s)`);

                    for (const action of actions) {
                        await this.processAction(action);
                    }
                }
            } catch (error) {
                const err = error as Error;
                if (!err.message.includes('HTTP')) {
                    console.error('⚠️  Polling error:', err.message);
                }
            }
        }, this.config.pollInterval);

        console.log('🔄 Polling started (interval: 5s)');
    }

    private stop(): void {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = undefined;
        }
    }

    private async processAction(action: Action): Promise<void> {
        if (!this.config || !this.apiService) return;

        try {
            console.log(`⚡ Processing ${action.type} action (ID: ${action.id})`);

            // Decrypt payload
            const payload = await CryptoService.decryptPayload(action.payload);

            // Execute action
            switch (action.type) {
                case 'media':
                    await this.mediaModule.executeAction(payload);
                    break;
                case 'brightness':
                    await this.brightnessModule.executeAction(payload);
                    break;
                case 'volume':
                    await this.volumeModule.executeAction(payload);
                    break;
                default:
                    throw new Error(`Unknown action type: ${action.type}`);
            }

            console.log(`✅ ${action.type} action completed`);
        } catch (error) {
            const err = error as Error;
            console.error(`❌ Action failed: ${err.message}`);
            await this.apiService.reportFailure(action.id, err.message);
        }
    }
}

// CLI Interface
function printUsage() {
    console.log('🎮 Recomex Local Client');
    console.log('');
    console.log('Usage:');
    console.log('  npm run register -- <token>  Register client with server');
    console.log('  npm start                    Start the client daemon');
    console.log('');
    console.log('Examples:');
    console.log('  npm run register -- abc123');
    console.log('  npm start');
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        printUsage();
        return;
    }

    const client = new RemoteControlClient();

    try {
        switch (args[0]) {
            case 'register':
                if (args.length < 2) {
                    console.error('❌ Error: Registration token required');
                    console.log('Usage: npm run register -- <token>');
                    return;
                }
                await client.register(args[1]);
                break;

            case 'start':
                await client.start();
                break;

            default:
                console.error('❌ Unknown command:', args[0]);
                printUsage();
                break;
        }
    } catch (error) {
        console.error('❌ Error:', (error as Error).message);
        process.exit(1);
    }
}

main();