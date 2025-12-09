/*
  Migration script: MongoDB (RendezVous) -> Supabase (rendez_vous)
  Requirements:
  - ENV: MONGO_URI, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  - Supabase table created via supabase_migrations/create_rendezvous_table.sql
*/

/* eslint-disable no-console */
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');

// Load env
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!MONGO_URI) {
  console.error('Missing MONGO_URI');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Supabase client (service role for inserts)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Mongo models
const RendezVous = require('../backend/models/RendezVous');
const Patient = require('../backend/models/Patient');

async function findSupabasePatientIdByIdentifiant(identifiant) {
  const { data, error } = await supabase
    .from('patients')
    .select('id, identifiant')
    .eq('identifiant', identifiant)
    .maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

function mapRendezVousToSupabaseRow(rv, patientSupabaseId) {
  return {
    patient_id: patientSupabaseId,
    service: rv.service,
    praticien_id: null, // Optionnel: map si une table users existe dans Supabase
    motif: rv.motif,
    date_debut: rv.dateDebut,
    date_fin: rv.dateFin,
    duree_minutes: rv.dureeMinutes ?? null,
    statut: rv.statut || 'programmé',
    priorite: rv.priorite || 'normal',
    notes: rv.notes || null,
    rappel_sms: !!rv?.rappel?.sms,
    rappel_email: !!rv?.rappel?.email,
    rappel_envoye_le: rv?.rappel?.envoyeLe || null,
    confirme_par_patient: !!rv?.confirmation?.confirmeParPatient,
    confirme_le: rv?.confirmation?.confirmeLe || null,
    created_at: rv.createdAt,
    updated_at: rv.updatedAt,
  };
}

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);

  try {
    console.log('Fetching rendez-vous from MongoDB...');
    const rendezvous = await RendezVous.find({})
      .populate('patient', 'identifiant nom prenom')
      .lean();

    console.log(`Found ${rendezvous.length} rendez-vous.`);

    let migrated = 0;
    let skipped = 0;
    for (const rv of rendezvous) {
      try {
        // Map patient by identifiant
        const patientDoc = rv.patient ? rv.patient : await Patient.findById(rv.patient).lean();
        const identifiant = patientDoc?.identifiant;
        if (!identifiant) {
          skipped += 1;
          console.warn(`Skip RV ${rv._id}: patient identifiant missing`);
          continue;
        }

        const patientId = await findSupabasePatientIdByIdentifiant(identifiant);
        if (!patientId) {
          skipped += 1;
          console.warn(`Skip RV ${rv._id}: Supabase patient not found for identifiant=${identifiant}`);
          continue;
        }

        const row = mapRendezVousToSupabaseRow(rv, patientId);
        const { error } = await supabase.from('rendez_vous').insert([row]);
        if (error) throw error;
        migrated += 1;
      } catch (e) {
        skipped += 1;
        console.error(`Failed to migrate RV ${rv._id}:`, e.message);
      }
    }

    console.log(`Migration done. Migrated=${migrated}, Skipped=${skipped}`);
  } finally {
    await mongoose.disconnect();
  }
}

migrate().catch((e) => {
  console.error('Migration fatal error:', e);
  process.exit(1);
});


