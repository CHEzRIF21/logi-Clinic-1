// Fonction principale API - Route toutes les requêtes vers les bonnes fonctions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

// Import des handlers
import authHandler from './auth.ts';
import superAdminHandler from './super_admin.ts';
import patientsHandler from './patients.ts';
import invoicesHandler from './invoices.ts';
import pharmacyHandler from './pharmacy.ts';
import operationsHandler from './operations.ts';
import statisticsHandler from './statistics.ts';
import productsHandler from './products.ts';
import caisseHandler from './caisse.ts';

serve(async (req) => {
  // Gérer CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.replace('/api', '');

  try {
    // Router les requêtes vers les bonnes fonctions
    if (path.startsWith('/auth')) {
      return await authHandler(req, path);
    } else if (path.startsWith('/super-admin')) {
      return await superAdminHandler(req, path);
    } else if (path.startsWith('/patients')) {
      return await patientsHandler(req, path);
    } else if (path.startsWith('/invoices')) {
      return await invoicesHandler(req, path);
    } else if (path.startsWith('/pharmacy')) {
      return await pharmacyHandler(req, path);
    } else if (path.startsWith('/operations')) {
      return await operationsHandler(req, path);
    } else if (path.startsWith('/statistics')) {
      return await statisticsHandler(req, path);
    } else if (path.startsWith('/products')) {
      return await productsHandler(req, path);
    } else if (path.startsWith('/caisse')) {
      return await caisseHandler(req, path);
    } else if (path.startsWith('/health')) {
      return new Response(
        JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, message: 'Route non trouvée' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Erreur API:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Erreur serveur' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
