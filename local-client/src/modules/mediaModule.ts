import { exec } from 'child_process';
import { promisify } from 'util';
import { ActionPayload } from '../types';

const execAsync = promisify(exec);

export class MediaModule {
  private enabled: boolean = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  async executeAction(payload: ActionPayload): Promise<void> {
    if (!this.enabled) {
      throw new Error('Media module is disabled');
    }

    const mediaAction = payload.media;
    if (!mediaAction) {
      throw new Error('Invalid media action payload');
    }

    const command = this.mapAction(mediaAction.action);
    await execAsync(command);
  }

  private mapAction(action: string): string {
    switch (action) {
      case 'next': return 'playerctl next';
      case 'previous': return 'playerctl previous';
      case 'play_pause': return 'playerctl play-pause';
      case 'stop': return 'playerctl stop';
      default: throw new Error(`Unknown media action: ${action}`);
    }
  }
}