import { Action } from '../types';

export class ApiService {
  private serverUrl: string;
  private clientId: number;

  constructor(serverUrl: string, clientId: number) {
    this.serverUrl = serverUrl;
    this.clientId = clientId;
  }

  private async request(method: string, path: string, data?: any): Promise<any> {
    const url = `${this.serverUrl}${path}`;
    const options: any = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      console.log(response)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async pollActions(): Promise<Action[]> {
    try {
      return await this.request('GET', `/api/actions/poll/${this.clientId}`);
    } catch (error) {
      console.error('Failed to poll actions:', error);
      return [];
    }
  }

  async reportFailure(actionId: number, failureReason: string): Promise<void> {
    try {
      await this.request('PATCH', `/api/actions/${actionId}/failure`, {
        failureReason
      });
    } catch (error) {
      console.error('Failed to report failure:', error);
    }
  }

  async registerClient(token: string, publicKey: string, name: string): Promise<any> {
    return this.request('POST', '/api/clients/register', {
      token, publicKey, name
    });
  }
}