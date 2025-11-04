// @ts-ignore
import Gio from 'gi://Gio';
// @ts-ignore
import GLib from 'gi://GLib';
import { ClientConfig } from '../types';

export class ConfigService {
  private configPath: string;

  constructor() {
    this.configPath = GLib.get_home_dir() + '/.config/recomex/client.json';
  }

  load(): ClientConfig | null {
    try {
      const file = Gio.File.new_for_path(this.configPath);
      const [success, contents] = file.load_contents(null);
      if (success) {
        const decoder = new TextDecoder();
        const jsonStr = decoder.decode(contents);
        return JSON.parse(jsonStr);
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  save(config: ClientConfig): boolean {
    try {
      const dir = Gio.File.new_for_path(GLib.path_get_dirname(this.configPath));
      if (!dir.query_exists(null)) {
        dir.make_directory_with_parents(null);
      }
      
      const file = Gio.File.new_for_path(this.configPath);
      const content = JSON.stringify(config, null, 2);
      const encoder = new TextEncoder();
      const bytes = encoder.encode(content);
      
      file.replace_contents(bytes, null, false, 
        Gio.FileCreateFlags.REPLACE_DESTINATION, null);
      return true;
    } catch (error) {
      console.error('Failed to save config:', error);
      return false;
    }
  }
}