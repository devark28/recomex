export interface Client {
  id: number;
  name: string;
  ownerId: number;
  securityToken: string;
  lastCheckIn?: string;
  createdAt: string;
}

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