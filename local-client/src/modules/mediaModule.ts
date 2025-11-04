// @ts-ignore
import Gio from 'gi://Gio';
import { ActionPayload } from '../types';

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

    try {
      await this.callMpris(this.mapAction(mediaAction.action));
    } catch (error) {
      throw new Error(`Media action failed: ${error}`);
    }
  }

  private mapAction(action: string): string {
    switch (action) {
      case 'next': return 'Next';
      case 'previous': return 'Previous';
      case 'play_pause': return 'PlayPause';
      case 'stop': return 'Stop';
      default: throw new Error(`Unknown media action: ${action}`);
    }
  }

  private async callMpris(method: string): Promise<void> {
    const bus = Gio.DBus.session;

    // Get available MPRIS players
    const namesResult = bus.call_sync(
      'org.freedesktop.DBus',
      '/org/freedesktop/DBus',
      'org.freedesktop.DBus',
      'ListNames',
      null,
      null,
      Gio.DBusCallFlags.NONE,
      -1,
      null
    );

    const [names] = namesResult.deepUnpack() as [string[]];
    const mprisNames = names.filter((n: string) => n.startsWith('org.mpris.MediaPlayer2.'));

    if (mprisNames.length === 0) {
      throw new Error('No MPRIS players found');
    }

    // Use the first available player
    const playerName = mprisNames[0];

    const proxy = Gio.DBusProxy.new_sync(
      bus,
      Gio.DBusProxyFlags.DO_NOT_CONNECT_SIGNALS,
      null,
      playerName,
      '/org/mpris/MediaPlayer2',
      'org.mpris.MediaPlayer2.Player',
      null
    );

    proxy.call_sync(
      method,
      null,
      Gio.DBusCallFlags.NO_AUTO_START,
      -1,
      null
    );
  }
}