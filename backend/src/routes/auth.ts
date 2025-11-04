import { Router } from 'express';
import { UserService } from '../services/userService';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await UserService.register(username, password);
    res.status(201).json({ message: 'User created', userId: user.id });
  } catch (error) {
      console.error('Registration error:', error);
    res.status(400).json({ error: 'Username already exists' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const token = await UserService.login(username, password);
    
    if (!token) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;