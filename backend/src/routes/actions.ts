import { Router } from 'express';
import { ActionService } from '../services/actionService';
import { ClientService } from '../services/clientService';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Send action (authenticated user)
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { clientId, type, payload, dueAt } = req.body;
    
    // Verify client ownership
    const client = await ClientService.getClientById(clientId);
    if (!client || client.owner_id !== req.user!.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const action = await ActionService.createAction(
      clientId,
      type,
      payload,
      dueAt ? new Date(dueAt) : undefined
    );
    
    res.status(201).json(action);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create action' });
  }
});

// Poll for actions (client polling)
router.get('/poll/:clientId', async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    
    // Update last check-in
    await ClientService.updateLastCheckIn(clientId);
    
    // Get pending actions
    const actions = await ActionService.getPendingActions(clientId);
    
    // Mark actions as sent
    for (const action of actions) {
      await ActionService.markActionAsSent(action.id);
    }
    
    res.json(actions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to poll actions' });
  }
});

// Report action failure
router.patch('/:actionId/failure', async (req, res) => {
  try {
    const { failureReason } = req.body;
    await ActionService.updateActionFailure(parseInt(req.params.actionId), failureReason);
    res.json({ message: 'Failure reported' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to report failure' });
  }
});

export default router;