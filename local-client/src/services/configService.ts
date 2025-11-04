import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { ClientConfig } from '../types';

export class ConfigService {
  private configPath: string;

  constructor() {
    this.configPath = join(homedir(), '.config', 'recomex', 'client.json');
  }

  async load(): Promise<ClientConfig | null> {
    try {
      if (!existsSync(this.configPath)) {
        return null;
      }

      const content = await readFile(this.configPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async save(config: ClientConfig): Promise<boolean> {
    try {
      const dir = dirname(this.configPath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }

      await writeFile(this.configPath, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to save config:', error);
      return false;
    }
  }
}