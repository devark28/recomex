import { exec } from 'child_process';
import { promisify } from 'util';
import { ActionPayload } from '../types';

const execAsync = promisify(exec);

export class VolumeModule {
  private enabled: boolean = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  async executeAction(payload: ActionPayload): Promise<void> {
    if (!this.enabled) {
      throw new Error('Volume module is disabled');
    }

    const volumeAction = payload.volume;
    if (!volumeAction) {
      throw new Error('Invalid volume action payload');
    }

    const command = this.mapAction(volumeAction);
    await execAsync(command);
  }

  private mapAction(action: any): string {
    switch (action.action) {
      case 'increase': return 'pamixer --increase 5';
      case 'decrease': return 'pamixer --decrease 5';
      case 'mute': return 'pamixer --mute';
      case 'unmute': return 'pamixer --unmute';
      case 'set': 
        if (action.value !== undefined) {
          return `pamixer --set-volume ${action.value}`;
        }
        throw new Error('Set volume requires value');
      default: throw new Error(`Unknown volume action: ${action.action}`);
    }
  }
}