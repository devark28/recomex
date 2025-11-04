import { ClientConfig, Action } from './types';
import { CryptoService } from './services/crypto';
import { ApiService } from './services/apiService';
import { MediaModule } from './modules/mediaModule';
import { BrightnessModule } from './modules/brightnessModule';
import { VolumeModule } from './modules/volumeModule';

class RemoteControlClient {
  private config: ClientConfig;
  private cryptoService: CryptoService;
  private apiService: ApiService;
  private mediaModule: MediaModule;
  private brightnessModule: BrightnessModule;
  private volumeModule: VolumeModule;
  private pollTimer?: any;

  constructor(config: ClientConfig) {
    this.config = config;
    this.cryptoService = new CryptoService(config.privateKey);
    this.apiService = new ApiService(config.serverUrl, config.clientId);

    // Initialize modules
    this.mediaModule = new MediaModule();
    this.brightnessModule = new BrightnessModule();
    this.volumeModule = new VolumeModule();

    // Configure modules based on config
    this.mediaModule.setEnabled(config.enabledModules.media);
    this.brightnessModule.setEnabled(config.enabledModules.brightness);
    this.volumeModule.setEnabled(config.enabledModules.volume);
  }

  start() {
    console.log('Starting remote control client...');
    this.startPolling();
  }

  stop() {
    console.log('Stopping remote control client...');
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private startPolling() {
    this.pollTimer = setInterval(async () => {
      try {
        const actions = await this.apiService.pollActions();

        for (const action of actions) {
          await this.processAction(action);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, this.config.pollInterval);
  }

  private async processAction(action: Action): Promise<void> {
    try {
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

      console.log(`Successfully executed ${action.type} action`);
    } catch (error) {
      console.error(`Failed to execute action ${action.id}:`, error);
      await this.apiService.reportFailure(action.id, (error as Error)?.message);
    }
  }
}

// Example configuration - in a real implementation, this would be loaded from a config file
const config: ClientConfig = {
  clientId: 1, // This should be set during client registration
  serverUrl: 'http://localhost:3000',
  privateKey: 'private-key-placeholder', // This should be generated during registration
  pollInterval: 5000, // 5 seconds
  enabledModules: {
    media: true,
    brightness: true,
    volume: true,
  },
};

// Start the client
const client = new RemoteControlClient(config);
client.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  client.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  client.stop();
  process.exit(0);
});