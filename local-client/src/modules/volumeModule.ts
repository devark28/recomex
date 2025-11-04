// @ts-ignore
import Gvc from 'gi://Gvc';
import { ActionPayload } from '../types';

export class VolumeModule {
  private enabled: boolean = true;
  private controller?: any;
  private sink?: any;
  private maxVolume: number = 100;

  constructor() {
    this.initVolumeControl();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private initVolumeControl() {
    try {
      this.controller = new Gvc.MixerControl({ name: 'Recomex Volume Control' });
      this.controller.open();
      
      this.controller.connect('ready', () => {
        this.sink = this.controller.get_default_sink();
        this.maxVolume = this.controller.get_vol_max_norm();
      });
    } catch (error) {
      console.error('Failed to initialize volume control:', error);
    }
  }

  async executeAction(payload: ActionPayload): Promise<void> {
    if (!this.enabled) {
      throw new Error('Volume module is disabled');
    }

    const volumeAction = payload.volume;
    if (!volumeAction) {
      throw new Error('Invalid volume action payload');
    }

    if (!this.sink) {
      throw new Error('Volume control not available');
    }

    try {
      const currentVolume = this.sink.volume;
      let newVolume = currentVolume;

      switch (volumeAction.action) {
        case 'set':
          if (volumeAction.value !== undefined) {
            newVolume = Math.max(0, Math.min(this.maxVolume, volumeAction.value * this.maxVolume / 100));
          }
          break;
        case 'increase':
          newVolume = Math.min(this.maxVolume, currentVolume + this.maxVolume * 0.1);
          break;
        case 'decrease':
          newVolume = Math.max(0, currentVolume - this.maxVolume * 0.1);
          break;
        case 'mute':
          this.sink.change_is_muted(true);
          return;
        case 'unmute':
          this.sink.change_is_muted(false);
          return;
        default:
          throw new Error(`Unknown volume action: ${volumeAction.action}`);
      }

      if (newVolume > 0) {
        this.sink.change_is_muted(false);
      }

      this.sink.volume = newVolume;
      this.sink.push_volume();
    } catch (error) {
      throw new Error(`Volume action failed: ${error}`);
    }
  }
}