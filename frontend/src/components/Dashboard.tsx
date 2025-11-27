import {useState, useEffect} from 'react';
import {Client} from '../types';
import apiService from '../services/api';
import ClientCard from './ClientCard';

interface DashboardProps {
    onLogout: () => void;
}

export default function Dashboard({onLogout}: DashboardProps) {
    const [clients, setClients] = useState<Client[]>([]);
    const [showAddClient, setShowAddClient] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [showToken, setShowToken] = useState<string | null>(null);

    useEffect(() => {
        void loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const clientsData = await apiService.getClients();
            setClients(clientsData);
        } catch (error) {
            console.error('Failed to load clients:', error);
        }
    };

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const client = await apiService.createClient(newClientName);
            setNewClientName('');
            setShowAddClient(false);
            setShowToken(client.registration_token);
            void loadClients();
        } catch (error) {
            alert('Failed to add client');
        }
    };

    const handleDeleteClient = (clientId: number) => {
        setClients(clients.filter(client => client.id !== clientId));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">Remote Control Dashboard</h1>
                        <button 
                            onClick={onLogout}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Add Client Button */}
                <div className="mb-8">
                    <button 
                        onClick={() => setShowAddClient(!showAddClient)}
                        className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                        {showAddClient ? 'Cancel' : 'Add New Client'}
                    </button>
                </div>

                {/* Add Client Form */}
                {showAddClient && (
                    <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Client</h3>
                        <form onSubmit={handleAddClient} className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Client Name"
                                value={newClientName}
                                onChange={(e) => setNewClientName(e.target.value)}
                                required
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none"
                            />
                            <button 
                                type="submit"
                                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                            >
                                Add Client
                            </button>
                        </form>
                    </div>
                )}

                {/* Registration Token */}
                {showToken && (
                    <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-green-900 mb-2">Client Registration Token</h3>
                        <p className="text-green-800 font-mono bg-green-100 p-3 rounded border">{showToken}</p>
                        <p className="text-sm text-green-700 mt-2">Use this token to register your local client.</p>
                    </div>
                )}

                {/* Clients Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clients.map(client => (
                        <ClientCard key={client.id} client={client} onDelete={handleDeleteClient}/>
                    ))}
                </div>

                {/* Empty State */}
                {clients.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-gray-400 mb-4">
                            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No clients registered</h3>
                        <p className="text-gray-600">Add a client to get started with remote control.</p>
                    </div>
                )}
            </div>
        </div>
    );
}