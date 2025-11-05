export interface Client {
    id: number;
    name: string;
    owner_id: number;
    security_token: string;
    last_check_in?: string;
    created_at: string;
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