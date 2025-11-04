// @ts-ignore
import Gio from 'gi://Gio';
import { ActionPayload } from '../types';

export class BrightnessModule {
  private enabled: boolean = true;
  private brightnessProxy?: any;

  constructor() {
    this.initBrightnessProxy();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private initBrightnessProxy() {
    try {
      // Create a simple proxy for brightness control
      this.brightnessProxy = Gio.DBusProxy.new_sync(
        Gio.DBus.session,
        Gio.DBusProxyFlags.DO_NOT_CONNECT_SIGNALS,
        null,
        'org.gnome.SettingsDaemon.Power',
        '/org/gnome/SettingsDaemon/Power',
        'org.gnome.SettingsDaemon.Power.Screen',
        null
      );
    } catch (error) {
      console.error('Failed to initialize brightness proxy:', error);
    }
  }

  async executeAction(payload: ActionPayload): Promise<void> {
    if (!this.enabled) {
      throw new Error('Brightness module is disabled');
    }

    const brightnessAction = payload.brightness;
    if (!brightnessAction) {
      throw new Error('Invalid brightness action payload');
    }

    if (!this.brightnessProxy) {
      throw new Error('Brightness control not available');
    }

    try {
      const currentBrightness = this.brightnessProxy.Brightness || 50;
      let newBrightness = currentBrightness;

      switch (brightnessAction.action) {
        case 'set':
          if (brightnessAction.value !== undefined) {
            newBrightness = Math.max(0, Math.min(100, brightnessAction.value));
          }
          break;
        case 'increase':
          newBrightness = Math.min(100, currentBrightness + 10);
          break;
        case 'decrease':
          newBrightness = Math.max(0, currentBrightness - 10);
          break;
        default:
          throw new Error(`Unknown brightness action: ${brightnessAction.action}`);
      }

      this.brightnessProxy.Brightness = newBrightness;
    } catch (error) {
      throw new Error(`Brightness action failed: ${error}`);
    }
  }
}