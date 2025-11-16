const API_BASE = '/api';

class ApiService {
    private token: string | null = localStorage.getItem('token');

    private async request(endpoint: string, options: RequestInit = {}) {
        const url = `${API_BASE}${endpoint}`;
        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && {Authorization: `Bearer ${this.token}`}),
            },
            ...options,
        };

        const response = await fetch(url, config);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async login(username: string, password: string) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({username, password}),
        });

        this.token = data.token;
        localStorage.setItem('token', data.token);
        return data;
    }

    async register(username: string, password: string) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({username, password}),
        });
    }

    async getClients() {
        return this.request('/clients');
    }

    async createClient(name: string) {
        return this.request('/clients', {
            method: 'POST',
            body: JSON.stringify({name}),
        });
    }

    async deleteClient(id: number) {
        return this.request(`/clients/${id}`, {
            method: 'DELETE',
        });
    }

    async sendAction(clientId: number, type: string, payload: string, dueAt?: string) {
        return this.request('/actions', {
            method: 'POST',
            body: JSON.stringify({clientId, type, payload, dueAt}),
        });
    }

    logout() {
        this.token = null;
        localStorage.removeItem('token');
    }

    isAuthenticated() {
        return !!this.token;
    }
}

export default new ApiService();
