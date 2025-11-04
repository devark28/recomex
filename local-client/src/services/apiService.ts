// @ts-ignore
import Soup from 'gi://Soup';
import { Action } from '../types';

export class ApiService {
  private serverUrl: string;
  private clientId: number;
  private session: any;

  constructor(serverUrl: string, clientId: number) {
    this.serverUrl = serverUrl;
    this.clientId = clientId;
    this.session = new Soup.Session();
  }

  async request(method: string, path: string, data?: any): Promise<any> {
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