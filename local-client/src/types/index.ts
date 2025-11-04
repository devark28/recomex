export interface ActionPayload {
  media?: {
    action: 'next' | 'previous' | 'play_pause' | 'stop';
  };
  brightness?: {
    action: 'set' | 'increase' | 'decrease';
    value?: number;
  };
  volume?: {
    action: 'set' | 'increase' | 'decrease' | 'mute' | 'unmute';
    value?: number;
  };
}

export interface Action {
  id: number;
  clientId: number;
  type: 'media' | 'brightness' | 'volume';
  payload: string;
  dueAt?: string;
  isSent: boolean;
  createdAt: string;
}

export interface ClientConfig {
  clientId: number;
  serverUrl: string;
  privateKey: string;
  pollInterval: number;
  enabledModules: {
    media: boolean;
    brightness: boolean;
    volume: boolean;
  };
}