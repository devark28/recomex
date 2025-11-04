#!/usr/bin/env gjs

const { Gio, GLib, Soup } = imports.gi;

// Configuration
const SERVER_URL = 'http://localhost:3000';
const POLL_INTERVAL = 5000;
const CONFIG_PATH = GLib.get_home_dir() + '/.config/recomex/client.json';

// Crypto Service
class CryptoService {
    static generateKeyPair() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        return {
            publicKey: `public-${timestamp}-${random}`,
            privateKey: `private-${timestamp}-${random}`
        };
    }

    static decrypt(encryptedPayload, privateKey) {
        try {
            return JSON.parse(encryptedPayload);
        } catch (error) {
            throw new Error('Decryption failed: ' + error.message);
        }
    }
}

// Config Service
class ConfigService {
    static load() {
        try {
            const file = Gio.File.new_for_path(CONFIG_PATH);
            const [success, contents] = file.load_contents(null);
            if (success) {
                const decoder = new TextDecoder();
                return JSON.parse(decoder.decode(contents));
            }
        } catch (error) {
            return null;
        }
        return null;
    }

    static save(config) {
        try {
            const dir = Gio.File.new_for_path(GLib.path_get_dirname(CONFIG_PATH));
            if (!dir.query_exists(null)) {
                dir.make_directory_with_parents(null);
            }
            
            const file = Gio.File.new_for_path(CONFIG_PATH);
            const content = JSON.stringify(config, null, 2);
            const encoder = new TextEncoder();
            const bytes = encoder.encode(content);
            
            file.replace_contents(bytes, null, false, 
                Gio.FileCreateFlags.REPLACE_DESTINATION, null);
            return true;
        } catch (error) {
            print('Failed to save config:', error.message);
            return false;
        }
    }
}

// API Service
class ApiService {
    constructor(serverUrl) {
        this.serverUrl = serverUrl;
        this.session = new Soup.Session();
    }

    async request(method, path, data = null) {
        return new Promise((resolve, reject) => {
            const message = Soup.Message.new(method, this.serverUrl + path);
            
            if (data) {
                const body = JSON.stringify(data);
                message.set_request('application/json', Soup.MemoryUse.COPY, body);
            }

            this.session.queue_message(message, () => {
                if (message.status_code >= 200 && message.status_code < 300) {
                    try {
                        const response = message.response_body.data ? 
                            JSON.parse(message.response_body.data) : {};
                        resolve(response);
                    } catch (e) {
                        resolve({});
                    }
                } else {
                    reject(new Error(`HTTP ${message.status_code}: ${message.reason_phrase}`));
                }
            });
        });
    }

    async registerClient(token, publicKey, name) {
        return this.request('POST', '/api/clients/register', {
            token, publicKey, name
        });
    }

    async pollActions(clientId) {
        return this.request('GET', `/api/actions/poll/${clientId}`);
    }

    async reportFailure(actionId, reason) {
        return this.request('PATCH', `/api/actions/${actionId}/failure`, {
            failureReason: reason
        });
    }
}

// Media Module
class MediaModule {
    constructor() {
        this.enabled = true;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    async execute(action) {
        if (!this.enabled) {
            throw new Error('Media module is disabled');
        }

        const method = this._mapAction(action.action);
        const bus = Gio.DBus.session;
        
        const result = bus.call_sync(
            'org.freedesktop.DBus', '/org/freedesktop/DBus',
            'org.freedesktop.DBus', 'ListNames',
            null, null, Gio.DBusCallFlags.NONE, -1, null
        );
        
        const [names] = result.deep_unpack();
        const mprisNames = names.filter(n => n.startsWith('org.mpris.MediaPlayer2.'));
        
        if (mprisNames.length === 0) {
            throw new Error('No media players found');
        }

        bus.call_sync(
            mprisNames[0], '/org/mpris/MediaPlayer2',
            'org.mpris.MediaPlayer2.Player', method,
            null, null, Gio.DBusCallFlags.NONE, -1, null
        );
    }

    _mapAction(action) {
        const actionMap = {
            'next': 'Next',
            'previous': 'Previous', 
            'play_pause': 'PlayPause',
            'stop': 'Stop'
        };
        return actionMap[action] || 'PlayPause';
    }
}

// Volume Module (using pactl commands)
class VolumeModule {
    constructor() {
        this.enabled = true;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    async execute(action) {
        if (!this.enabled) {
            throw new Error('Volume module is disabled');
        }

        try {
            switch (action.action) {
                case 'increase':
                    GLib.spawn_command_line_async('pactl set-sink-volume @DEFAULT_SINK@ +10%');
                    break;
                case 'decrease':
                    GLib.spawn_command_line_async('pactl set-sink-volume @DEFAULT_SINK@ -10%');
                    break;
                case 'mute':
                    GLib.spawn_command_line_async('pactl set-sink-mute @DEFAULT_SINK@ 1');
                    break;
                case 'unmute':
                    GLib.spawn_command_line_async('pactl set-sink-mute @DEFAULT_SINK@ 0');
                    break;
                case 'set':
                    if (action.value !== undefined) {
                        GLib.spawn_command_line_async(`pactl set-sink-volume @DEFAULT_SINK@ ${action.value}%`);
                    }
                    break;
            }
        } catch (error) {
            throw new Error(`Volume control failed: ${error.message}`);
        }
    }
}

// Brightness Module
class BrightnessModule {
    constructor() {
        this.enabled = true;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    async execute(action) {
        if (!this.enabled) {
            throw new Error('Brightness module is disabled');
        }

        try {
            const currentBrightness = this._getCurrentBrightness();
            let newBrightness = currentBrightness;

            switch (action.action) {
                case 'increase':
                    newBrightness = Math.min(100, currentBrightness + 10);
                    break;
                case 'decrease':
                    newBrightness = Math.max(0, currentBrightness - 10);
                    break;
                case 'set':
                    if (action.value !== undefined) {
                        newBrightness = Math.max(0, Math.min(100, action.value));
                    }
                    break;
            }

            this._setBrightness(newBrightness);
        } catch (error) {
            throw new Error(`Brightness control failed: ${error.message}`);
        }
    }

    _getCurrentBrightness() {
        try {
            const [success, stdout] = GLib.spawn_command_line_sync(
                'gdbus call --session --dest org.gnome.SettingsDaemon.Power ' +
                '--object-path /org/gnome/SettingsDaemon/Power ' +
                '--method org.freedesktop.DBus.Properties.Get ' +
                'org.gnome.SettingsDaemon.Power.Screen Brightness'
            );
            
            if (success) {
                const match = stdout.toString().match(/\d+/);
                return match ? parseInt(match[0]) : 50;
            }
        } catch (error) {
            // Fallback
        }
        return 50;
    }

    _setBrightness(value) {
        GLib.spawn_command_line_async(
            `gdbus call --session --dest org.gnome.SettingsDaemon.Power ` +
            `--object-path /org/gnome/SettingsDaemon/Power ` +
            `--method org.freedesktop.DBus.Properties.Set ` +
            `org.gnome.SettingsDaemon.Power.Screen Brightness "<${value}>"`
        );
    }
}

// Main Client Class
class RemoteControlClient {
    constructor() {
        this.serverUrl = SERVER_URL;
        this.pollInterval = POLL_INTERVAL;
        this.apiService = new ApiService(this.serverUrl);
        
        this.mediaModule = new MediaModule();
        this.volumeModule = new VolumeModule();
        this.brightnessModule = new BrightnessModule();
        
        this.config = null;
        this.pollTimer = null;
    }

    async register(token) {
        try {
            print('Registering client with token:', token);
            
            const keyPair = CryptoService.generateKeyPair();
            const hostname = GLib.get_host_name();
            
            const response = await this.apiService.registerClient(
                token, keyPair.publicKey, hostname
            );

            this.config = {
                clientId: response.clientId,
                privateKey: keyPair.privateKey,
                serverUrl: this.serverUrl,
                enabledModules: {
                    media: true,
                    volume: true,
                    brightness: true
                }
            };

            if (ConfigService.save(this.config)) {
                print('✓ Client registered successfully!');
                print(`  Client ID: ${this.config.clientId}`);
            } else {
                throw new Error('Failed to save configuration');
            }
        } catch (error) {
            print('✗ Registration failed:', error.message);
            throw error;
        }
    }

    start() {
        this.config = ConfigService.load();
        
        if (!this.config) {
            print('✗ Client not registered. Run: gjs client.js register <token>');
            return;
        }

        print('✓ Starting remote control client...');
        print(`  Client ID: ${this.config.clientId}`);
        
        this.mediaModule.setEnabled(this.config.enabledModules.media);
        this.volumeModule.setEnabled(this.config.enabledModules.volume);
        this.brightnessModule.setEnabled(this.config.enabledModules.brightness);

        this.startPolling();
        
        const loop = GLib.MainLoop.new(null, false);
        
        GLib.unix_signal_add(GLib.PRIORITY_DEFAULT, 2, () => {
            print('\n✓ Shutting down gracefully...');
            this.stop();
            loop.quit();
            return false;
        });
        
        loop.run();
    }

    startPolling() {
        this.pollTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, this.pollInterval, () => {
            this.pollActions().catch(error => {
                if (!error.message.includes('HTTP')) {
                    print('Polling error:', error.message);
                }
            });
            return GLib.SOURCE_CONTINUE;
        });
        
        print('✓ Polling started (interval: 5s)');
    }

    stop() {
        if (this.pollTimer) {
            GLib.source_remove(this.pollTimer);
            this.pollTimer = null;
        }
    }

    async pollActions() {
        try {
            const actions = await this.apiService.pollActions(this.config.clientId);
            
            if (actions.length > 0) {
                print(`Received ${actions.length} action(s)`);
                
                for (let action of actions) {
                    await this.processAction(action);
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async processAction(action) {
        try {
            print(`Processing ${action.type} action (ID: ${action.id})`);
            
            const payload = CryptoService.decrypt(action.payload, this.config.privateKey);
            
            switch (action.type) {
                case 'media':
                    await this.mediaModule.execute(payload.media);
                    break;
                case 'volume':
                    await this.volumeModule.execute(payload.volume);
                    break;
                case 'brightness':
                    await this.brightnessModule.execute(payload.brightness);
                    break;
                default:
                    throw new Error(`Unknown action type: ${action.type}`);
            }
            
            print(`✓ ${action.type} action completed`);
        } catch (error) {
            print(`✗ Action failed: ${error.message}`);
            await this.apiService.reportFailure(action.id, error.message);
        }
    }
}

// CLI Interface
function printUsage() {
    print('Recomex Local Client');
    print('');
    print('Usage:');
    print('  gjs client.js register <token>  - Register client with server');
    print('  gjs client.js start             - Start the client daemon');
    print('');
    print('Examples:');
    print('  gjs client.js register abc123');
    print('  gjs client.js start');
}

async function main() {
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
                    print('✗ Error: Registration token required');
                    print('Usage: gjs client.js register <token>');
                    return;
                }
                await client.register(args[1]);
                break;
                
            case 'start':
                client.start();
                break;
                
            default:
                print('✗ Unknown command:', args[0]);
                printUsage();
                break;
        }
    } catch (error) {
        print('✗ Error:', error.message);
    }
}

main();