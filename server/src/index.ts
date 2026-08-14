import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import jobRoutes from './routes/job.routes';
import candidateRoutes from './routes/candidate.routes';
import interviewRoutes from './routes/interview.routes';
import dashboardRoutes from './routes/dashboard.routes';
import aiRoutes from './routes/ai.routes';
import candidatePortalRoutes from './routes/candidatePortal.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/candidate-portal', candidatePortalRoutes);

// Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
