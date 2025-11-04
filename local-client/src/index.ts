// @ts-ignore
import GLib from 'gi://GLib';
import { ClientConfig, Action } from './types';
import { CryptoService } from './services/crypto';
import { ApiService } from './services/apiService';
import { ConfigService } from './services/configService';
import { MediaModule } from './modules/mediaModule';
import { BrightnessModule } from './modules/brightnessModule';
import { VolumeModule } from './modules/volumeModule';

class RemoteControlClient {
  private config: ClientConfig | null = null;
  private cryptoService?: CryptoService;
  private apiService?: ApiService;
  private configService: ConfigService;
  private mediaModule: MediaModule;
  private brightnessModule: BrightnessModule;
  private volumeModule: VolumeModule;
  private pollTimer?: any;

  constructor() {
    this.configService = new ConfigService();
    this.mediaModule = new MediaModule();
    this.brightnessModule = new BrightnessModule();
    this.volumeModule = new VolumeModule();
  }

  async register(token: string): Promise<void> {
    try {
      console.log('Registering client with token:', token);
      
      const keyPair = await CryptoService.generateKeyPair();
      const hostname = GLib.get_host_name();
      
      const tempApiService = new ApiService('http://localhost:3000', 0);
      const response = await tempApiService.registerClient(token, keyPair.publicKey, hostname);

      this.config = {
        clientId: response.clientId,
        privateKey: keyPair.privateKey,
        serverUrl: 'http://localhost:3000',
        pollInterval: 5000,
        enabledModules: {
          media: true,
          brightness: true,
          volume: true
        }
      };

      if (this.configService.save(this.config)) {
        console.log('✓ Client registered successfully!');
        console.log(`  Client ID: ${this.config.clientId}`);
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('✗ Registration failed:', error);
      throw error;
    }
  }

  start() {
    this.config = this.configService.load();
    
    if (!this.config) {
      console.error('✗ Client not registered. Run: gjs dist/index.js register <token>');
      return;
    }

    console.log('✓ Starting remote control client...');
    console.log(`  Client ID: ${this.config.clientId}`);
    
    this.cryptoService = new CryptoService(this.config.privateKey);
    this.apiService = new ApiService(this.config.serverUrl, this.config.clientId);
    
    // Configure modules
    this.mediaModule.setEnabled(this.config.enabledModules.media);
    this.brightnessModule.setEnabled(this.config.enabledModules.brightness);
    this.volumeModule.setEnabled(this.config.enabledModules.volume);

    this.startPolling();
    
    const loop = GLib.MainLoop.new(null, false);
    
    GLib.unix_signal_add(GLib.PRIORITY_DEFAULT, 2, () => {
      console.log('\n✓ Shutting down gracefully...');
      this.stop();
      loop.quit();
      return false;
    });
    
    loop.run();
  }

  stop() {
    if (this.pollTimer) {
      GLib.source_remove(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private startPolling() {
    if (!this.config || !this.apiService) return;
    
    this.pollTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, this.config.pollInterval, () => {
      this.pollActions().catch(error => {
        if (!error.message.includes('HTTP')) {
          console.error('Polling error:', error);
        }
      });
      return GLib.SOURCE_CONTINUE;
    });
    
    console.log('✓ Polling started (interval: 5s)');
  }

  private async pollActions(): Promise<void> {
    if (!this.apiService) return;
    
    try {
      const actions = await this.apiService.pollActions();
      
      if (actions.length > 0) {
        console.log(`Received ${actions.length} action(s)`);
        
        for (const action of actions) {
          await this.processAction(action);
        }
      }
    } catch (error) {
      throw error;
    }
  }

  private async processAction(action: Action): Promise<void> {
    if (!this.cryptoService || !this.apiService) return;
    
    try {
      console.log(`Processing ${action.type} action (ID: ${action.id})`);
      
      // Decrypt the payload
      const payload = await this.cryptoService.decryptPayload(action.payload);

      // Execute the action based on type
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

      console.log(`✓ ${action.type} action completed`);
    } catch (error) {
      console.error(`✗ Action failed: ${(error as Error)?.message}`);
      await this.apiService.reportFailure(action.id, (error as Error)?.message);
    }
  }
}

// CLI Interface
function printUsage() {
  console.log('Recomex Local Client');
  console.log('');
  console.log('Usage:');
  console.log('  gjs dist/index.js register <token>  - Register client with server');
  console.log('  gjs dist/index.js start             - Start the client daemon');
  console.log('');
  console.log('Examples:');
  console.log('  gjs dist/index.js register abc123');
  console.log('  gjs dist/index.js start');
}

async function main() {
  // @ts-ignore - ARGV is available in GJS
  const args = ARGV;
  
  if (args.length === 0) {
    printUsage();
    return;
  }

  const client = new RemoteControlClient();
  
  try {
    switch (args[0]) {
      case 'register':
        if (args.length < 2) {
          console.error('✗ Error: Registration token required');
          console.log('Usage: gjs dist/index.js register <token>');
          return;
        }
        await client.register(args[1]);
        break;
        
      case 'start':
        client.start();
        break;
        
      default:
        console.error('✗ Unknown command:', args[0]);
        printUsage();
        break;
    }
  } catch (error) {
    console.error('✗ Error:', (error as Error)?.message);
  }
}

main();