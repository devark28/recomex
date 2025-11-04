import { Action } from '../types';

export class ApiService {
  private serverUrl: string;
  private clientId: number;

  constructor(serverUrl: string, clientId: number) {
    this.serverUrl = serverUrl;
    this.clientId = clientId;
  }

  async pollActions(): Promise<Action[]> {
    try {
      const response = await fetch(`${this.serverUrl}/api/actions/poll/${this.clientId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to poll actions:', error);
      return [];
    }
  }

  async reportFailure(actionId: number, failureReason: string): Promise<void> {
    try {
      await fetch(`${this.serverUrl}/api/actions/${actionId}/failure`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ failureReason }),
      });
    } catch (error) {
      console.error('Failed to report failure:', error);
    }
  }
}