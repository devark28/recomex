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

    return (
        <div style={{padding: '20px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <h1>Remote Control Dashboard</h1>
                <button onClick={onLogout}>Logout</button>
            </div>

            <div style={{marginBottom: '20px'}}>
                <button onClick={() => setShowAddClient(!showAddClient)}>
                    {showAddClient ? 'Cancel' : 'Add New Client'}
                </button>
            </div>

            {showAddClient && (
                <form onSubmit={handleAddClient}
                      style={{marginBottom: '20px', padding: '16px', border: '1px solid #ccc', borderRadius: '8px'}}>
                    <h3>Add New Client</h3>
                    <input
                        type="text"
                        placeholder="Client Name"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        required
                        style={{width: '200px', padding: '8px', marginRight: '10px'}}
                    />
                    <button type="submit">Add Client</button>
                </form>
            )}

            {showToken && (<div style={{marginBottom: '20px'}}>
                <div style={{padding: '16px', border: '1px solid #ccc', borderRadius: '8px'}}>
                    <h3>Client Registration Token</h3>
                    <p>{showToken}</p>
                </div>
            </div>)}

            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px'}}>
                {clients.map(client => (
                    <ClientCard key={client.id} client={client}/>
                ))}
            </div>

            {clients.length === 0 && (
                <p style={{textAlign: 'center', color: '#666', marginTop: '40px'}}>
                    No clients registered. Add a client to get started.
                </p>
            )}
        </div>
    );
}