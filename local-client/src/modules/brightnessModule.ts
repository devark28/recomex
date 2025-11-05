import {exec} from 'child_process';
import {promisify} from 'util';
import {ActionPayload} from '../types';

const execAsync = promisify(exec);

export class BrightnessModule {
    private enabled: boolean = true;

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    async executeAction(payload: ActionPayload): Promise<void> {
        if (!this.enabled) {
            throw new Error('Brightness module is disabled');
        }

        const brightnessAction = payload.brightness;
        if (!brightnessAction) {
            throw new Error('Invalid brightness action payload');
        }

        const command = this.mapAction(brightnessAction);
        await execAsync(command);
    }

    private mapAction(action: any): string {
        switch (action.action) {
            case 'increase':
                return 'sudo brightnessctl set +10%';
            case 'decrease':
                return 'sudo brightnessctl set 10%-';
            case 'set':
                if (action.value !== undefined) {
                    return `sudo brightnessctl set ${action.value}%`;
                }
                throw new Error('Set brightness requires value');
            default:
                throw new Error(`Unknown brightness action: ${action.action}`);
        }
    }
}