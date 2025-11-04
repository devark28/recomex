import { Router } from 'express';
import { ClientService } from '../services/clientService';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, securityToken } = req.body;
    const client = await ClientService.createClient(name, req.user!.userId, securityToken);
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create client' });
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