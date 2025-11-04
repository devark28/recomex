export interface User {
  id: number;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

export interface Client {
  id: number;
  name: string;
  owner_id: number;
  security_token: string; // public key
  registration_token?: string;
  is_active: boolean;
  last_check_in?: Date;
  created_at: Date;
}

export interface Action {
  id: number;
  clientId: number;
  type: 'media' | 'brightness' | 'volume';
  payload: string; // encrypted
  dueAt?: Date;
  isSent: boolean;
  failureReason?: string;
  createdAt: Date;
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