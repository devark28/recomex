import { Router } from 'express';
import { ClientService } from '../services/clientService';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/', async (req: AuthRequest, res) => {
    try {
        const { name } = req.body;
        const client = await ClientService.createClient(name, req.user!.userId);
        res.status(201).json(client);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create client' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { token, publicKey, name } = req.body;
        const client = await ClientService.activateClient(token, publicKey, name);
        console.log(client)
        res.json({ clientId: client.id, message: 'Client activated successfully' });
    } catch (error) {
        console.log(error)
        res.status(400).json({ error: (error as Error)?.message });
    }
});

router.get('/', async (req: AuthRequest, res) => {
    try {
        const clients = await ClientService.getClientsByOwner(req.user!.userId);
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        const success = await ClientService.deleteClient(
            parseInt(req.params.id),
            req.user!.userId
        );

        if (success) {
            res.json({ message: 'Client deleted' });
        } else {
            res.status(404).json({ error: 'Client not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete client' });
    }
});

export default router;