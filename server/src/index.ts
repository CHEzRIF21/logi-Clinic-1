import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { licenseCheckMiddleware } from './middleware/licenseCheck';
import { appSecurityMiddleware } from './middleware/appSecurity';
import licenseService from './services/licenseService';
// #region agent log
import * as fs from 'fs';
import * as path from 'path';
const logPath = path.join(__dirname, '../../.cursor/debug.log');
// #endregion

// Routes
import invoicesRouter from './routes/invoices';
import paymentsRouter from './routes/payments';
import operationsRouter from './routes/operations';
import statisticsRouter from './routes/statistics';
import productsRouter from './routes/products';
import patientsRouter from './routes/patients';
import caisseRouter from './routes/caisse';
import lignesBudgetairesRouter from './routes/lignes-budgetaires';
import auditRouter from './routes/audit';
import reportsRouter from './routes/reports';
import pharmacyRouter from './routes/pharmacy';
import licenseRouter from './routes/license';
import monitoringRouter from './routes/monitoring';
import speechToTextRouter from './routes/speechToText';
import clinicsRouter from './routes/clinics';
import pricingRouter from './routes/pricing';
import authRouter from './routes/auth';
import anamneseTemplatesRouter from './routes/anamneseTemplates';
import examsRouter from './routes/exams';
import consultationsRouter from './routes/consultations';
import laboratoireRouter from './routes/laboratoire';
import imagerieRouter from './routes/imagerie';
import materniteRouter from './routes/maternite';
import configurationsRouter from './routes/configurations';

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Vérification de licence au démarrage (en production uniquement)
if (process.env.NODE_ENV === 'production' && process.env.LICENSE_KEY) {
  const licenseKey = process.env.LICENSE_KEY;
  const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || [];
  const domain = allowedDomains[0] || 'localhost';

  console.log('🔐 Vérification de la licence au démarrage...');
  licenseService.validateLicense(licenseKey, domain)
    .then((result) => {
      if (result.valid) {
        console.log('✅ Licence valide - Serveur autorisé à démarrer');
        
        // Démarrer la vérification périodique
        const checkInterval = parseInt(process.env.LICENSE_CHECK_INTERVAL || '3600000', 10);
        licenseService.checkLicensePeriodically(licenseKey, domain, checkInterval);
      } else {
        console.error('❌ Licence invalide:', result.message);
        console.error('🚫 Le serveur ne peut pas démarrer sans une licence valide.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Erreur lors de la vérification de la licence:', error);
      if (process.env.NODE_ENV === 'production') {
        console.error('🚫 Le serveur ne peut pas démarrer en production sans vérification de licence.');
        process.exit(1);
      }
    });

  // Appliquer le middleware de vérification sur toutes les routes (sauf les routes de licence)
  app.use(licenseCheckMiddleware);
}

// Middleware de sécurité applicative (vérification AppID/AppSecret)
// Ce middleware vérifie que chaque requête provient d'une application autorisée
if (process.env.NODE_ENV === 'production' || process.env.ENFORCE_APP_SECURITY === 'true') {
  console.log('🛡️ Middleware de sécurité applicative activé');
  app.use(appSecurityMiddleware);
}

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// #region agent log
app.use('/api/auth', (req, _res, next) => {
  try {
    fs.appendFileSync(logPath, JSON.stringify({location:'index.ts:93',message:'Requête reçue sur /api/auth',data:{method:req.method,path:req.path,originalUrl:req.originalUrl,ip:req.ip},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n');
  } catch(e) {}
  next();
});
// #endregion
// API Routes
app.use('/api/auth', authRouter);
app.use('/api/license', licenseRouter);
app.use('/api/monitoring', monitoringRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/invoices/:invoiceId/payments', paymentsRouter); // Payments sont sous /api/invoices/:id/payments
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
app.use('/api/anamnese-templates', anamneseTemplatesRouter);
app.use('/api/exams', examsRouter);
app.use('/api/consultations', consultationsRouter);
app.use('/api/laboratoire', laboratoireRouter);
app.use('/api/imagerie', imagerieRouter);
app.use('/api/maternite', materniteRouter);
app.use('/api/configurations', configurationsRouter);

// Error handler
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
  });
});

const PORT = config.port;

// #region agent log
try {
  fs.appendFileSync(logPath, JSON.stringify({location:'index.ts:128',message:'Démarrage serveur - avant app.listen',data:{port:PORT,configPort:config.port,nodeEnv:config.nodeEnv},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
} catch(e) {}
// #endregion

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 Environnement: ${config.nodeEnv}`);
  console.log(`🔗 API disponible sur http://localhost:${PORT}/api`);
  // #region agent log
  try {
    fs.appendFileSync(logPath, JSON.stringify({location:'index.ts:131',message:'Serveur démarré avec succès',data:{port:PORT,hostname:'localhost',apiUrl:`http://localhost:${PORT}/api`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
  } catch(e) {}
  // #endregion
});

export default app;

