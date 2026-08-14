import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from '../server/src/routes/auth.routes';
import jobRoutes from '../server/src/routes/job.routes';
import candidateRoutes from '../server/src/routes/candidate.routes';
import interviewRoutes from '../server/src/routes/interview.routes';
import dashboardRoutes from '../server/src/routes/dashboard.routes';
import aiRoutes from '../server/src/routes/ai.routes';
import candidatePortalRoutes from '../server/src/routes/candidatePortal.routes';
import { errorHandler } from '../server/src/middleware/error.middleware';

dotenv.config();

const app = express();

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

export default app;
