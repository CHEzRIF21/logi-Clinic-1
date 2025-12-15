// Point d'entrée pour Vercel Serverless Functions
import express from 'express';
import cors from 'cors';
import { config } from '../src/config';
import { errorHandler } from '../src/middleware/errorHandler';

// Routes
import invoicesRouter from '../src/routes/invoices';
import paymentsRouter from '../src/routes/payments';
import operationsRouter from '../src/routes/operations';
import statisticsRouter from '../src/routes/statistics';
import productsRouter from '../src/routes/products';
import patientsRouter from '../src/routes/patients';
import caisseRouter from '../src/routes/caisse';
import lignesBudgetairesRouter from '../src/routes/lignes-budgetaires';
import auditRouter from '../src/routes/audit';
import reportsRouter from '../src/routes/reports';
import pharmacyRouter from '../src/routes/pharmacy';
import licenseRouter from '../src/routes/license';
import monitoringRouter from '../src/routes/monitoring';
import speechToTextRouter from '../src/routes/speechToText';
import clinicsRouter from '../src/routes/clinics';
import pricingRouter from '../src/routes/pricing';
import authRouter from '../src/routes/auth';

const app = express();

// Middleware CORS
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-App-ID', 'X-App-Secret'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/license', licenseRouter);
app.use('/api/monitoring', monitoringRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/invoices/:invoiceId/payments', paymentsRouter);
app.use('/api/operations', operationsRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/products', productsRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/caisse', caisseRouter);
app.use('/api/lignes-budgetaires', lignesBudgetairesRouter);
app.use('/api/audit', auditRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/pharmacy', pharmacyRouter);
app.use('/api/speech-to-text', speechToTextRouter);
app.use('/api/clinics', clinicsRouter);
app.use('/api', pricingRouter);

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
  });
});

export default app;
