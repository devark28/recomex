import {Client, ActionPayload} from '../types';
import {CryptoService} from '../services/crypto';
import apiService from '../services/api';

interface ClientCardProps {
    client: Client;
    onDelete?: (clientId: number) => void;
}

export default function ClientCard({client, onDelete}: ClientCardProps) {
    const isOnline = client.last_check_in &&
        new Date().getTime() - new Date(client.last_check_in).getTime() < 60000; // 1 minute

    const sendAction = async (type: string, payload: ActionPayload) => {
        try {
            const encryptedPayload = await CryptoService.encryptPayload(payload, client.security_token);
            await apiService.sendAction(client.id, type, encryptedPayload);
            alert('Action sent successfully!');
        } catch (error) {
            alert('Failed to send action');
        }
    };

    const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete "${client.name}"?`)) {
            try {
                await apiService.deleteClient(client.id);
                onDelete?.(client.id);
            } catch (error) {
                alert('Failed to delete client');
            }
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-sm border transition-all ${
            isOnline ? 'border-green-200 bg-green-50' : 'border-gray-200'
        }`}>
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                        <div className="flex items-center mt-2">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                                isOnline ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className={`text-sm font-medium ${
                                isOnline ? 'text-green-700' : 'text-red-700'
                            }`}>
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={handleDelete}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete client"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="p-6 space-y-6">
                {/* Media Controls */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Media Controls</h4>
                    <div className="flex gap-2 flex-wrap">
                        <button 
                            onClick={() => sendAction('media', {media: {action: 'previous'}})}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                        >
                            ⏮️ Previous
                        </button>
                        <button 
                            onClick={() => sendAction('media', {media: {action: 'play_pause'}})}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                        >
                            ⏯️ Play/Pause
                        </button>
                        <button 
                            onClick={() => sendAction('media', {media: {action: 'next'}})}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                        >
                            ⏭️ Next
                        </button>
                    </div>
                </div>

                {/* Volume Controls */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Volume Controls</h4>
                    <div className="flex gap-2 flex-wrap">
                        <button 
                            onClick={() => sendAction('volume', {volume: {action: 'decrease'}})}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                        >
                            🔉 Volume Down
                        </button>
                        <button 
                            onClick={() => sendAction('volume', {volume: {action: 'mute'}})}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                        >
                            🔇 Mute
                        </button>
                        <button 
                            onClick={() => sendAction('volume', {volume: {action: 'increase'}})}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                        >
                            🔊 Volume Up
                        </button>
                    </div>
                </div>

                {/* Brightness Controls */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Brightness Controls</h4>
                    <div className="flex gap-2 flex-wrap">
                        <button 
                            onClick={() => sendAction('brightness', {brightness: {action: 'decrease'}})}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                        >
                            🔅 Brightness Down
                        </button>
                        <button 
                            onClick={() => sendAction('brightness', {brightness: {action: 'increase'}})}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                        >
                            🔆 Brightness Up
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}