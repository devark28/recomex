import { Client, ActionPayload } from '../types';
import { CryptoService } from '../services/crypto';
import apiService from '../services/api';

interface ClientCardProps {
  client: Client;
}

export default function ClientCard({ client }: ClientCardProps) {
  const isOnline = client.lastCheckIn && 
    new Date().getTime() - new Date(client.lastCheckIn).getTime() < 60000; // 1 minute

  const sendAction = async (type: string, payload: ActionPayload) => {
    try {
      const encryptedPayload = await CryptoService.encryptPayload(payload, client.securityToken);
      await apiService.sendAction(client.id, type, encryptedPayload);
      alert('Action sent successfully!');
    } catch (error) {
      alert('Failed to send action');
    }
  };

  return (
    <div style={{ 
      border: '1px solid #ccc', 
      borderRadius: '8px', 
      padding: '16px', 
      margin: '10px',
      backgroundColor: isOnline ? '#f0fff0' : '#fff0f0'
    }}>
      <h3>{client.name}</h3>
      <p>Status: {isOnline ? '🟢 Online' : '🔴 Offline'}</p>
      
      <div style={{ marginTop: '16px' }}>
        <h4>Media Controls</h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => sendAction('media', { media: { action: 'previous' } })}>
            ⏮️ Previous
          </button>
          <button onClick={() => sendAction('media', { media: { action: 'play_pause' } })}>
            ⏯️ Play/Pause
          </button>
          <button onClick={() => sendAction('media', { media: { action: 'next' } })}>
            ⏭️ Next
          </button>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <h4>Volume Controls</h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => sendAction('volume', { volume: { action: 'decrease' } })}>
            🔉 Volume Down
          </button>
          <button onClick={() => sendAction('volume', { volume: { action: 'mute' } })}>
            🔇 Mute
          </button>
          <button onClick={() => sendAction('volume', { volume: { action: 'increase' } })}>
            🔊 Volume Up
          </button>
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <h4>Brightness Controls</h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => sendAction('brightness', { brightness: { action: 'decrease' } })}>
            🔅 Brightness Down
          </button>
          <button onClick={() => sendAction('brightness', { brightness: { action: 'increase' } })}>
            🔆 Brightness Up
          </button>
        </div>
      </div>
    </div>
  );
}