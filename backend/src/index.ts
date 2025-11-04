import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import clientRoutes from './routes/clients';
import actionRoutes from './routes/actions';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/actions', actionRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});