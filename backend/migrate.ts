// migrate.ts
import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

// 1. Initialize Firebase Admin (Requires your Firebase service account JSON)
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const firestore = admin.firestore();

// 2. Initialize Supabase (Use your Service Role Key for admin privileges)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Starting Database Migration: Firebase -> Supabase');
  
  // This dictionary tracks old Firebase IDs to link relational data later
  const petIdMapping: { [firebaseId: string]: string } = {};

  try {
    // ==========================================
    // STEP 1: MIGRATE PETS
    // ==========================================
    console.log('📦 Fetching Pets from Firebase...');
    const petsSnapshot = await firestore.collection('pets').get();
    
    for (const doc of petsSnapshot.docs) {
      const petData = doc.data();
      const firebaseId = doc.id;

      // Transform the data to match our strict SQL schema
      const { data: newPet, error } = await supabase
        .from('pets')
        .insert({
          owner_id: petData.ownerId || '00000000-0000-0000-0000-000000000000', // Placeholder until Auth migration
          name: petData.name,
          species: petData.species,
          breed: petData.breed || null,
          ideal_weight: petData.idealWeight || null,
          current_weight: petData.currentWeight || null,
          last_vaccine_date: petData.lastVaccineDate ? new Date(petData.lastVaccineDate).toISOString() : null,
          image_url: petData.imageUrl || null,
        })
        .select('id')
        .single();

      if (error) {
        console.error(`❌ Error inserting pet ${petData.name}:`, error.message);
        continue;
      }

      // Store the mapping of the old Firebase ID to the new Supabase UUID
      petIdMapping[firebaseId] = newPet.id;
      console.log(`✅ Migrated Pet: ${petData.name}`);
    }

    // ==========================================
    // STEP 2: MIGRATE CLINICAL LOGS
    // ==========================================
    console.log('\n📦 Fetching Clinical Logs from Firebase...');
    const logsSnapshot = await firestore.collection('clinicalLogs').get();

    for (const doc of logsSnapshot.docs) {
      const logData = doc.data();
      
      // Look up the new UUID for the pet using our mapping dictionary
      const newPetUuid = petIdMapping[logData.petId];

      if (!newPetUuid) {
        console.warn(`⚠️ Skipping log ${doc.id}: No matching migrated pet found.`);
        continue;
      }

      const { error } = await supabase
        .from('clinical_logs')
        .insert({
          pet_id: newPetUuid,
          visit_type: logData.visitType || 'ROUTINE',
          primary_reason: logData.primaryReason || 'General Checkup',
          vet_summary_notes: logData.vetSummaryNotes || null,
          abnormal_flags: logData.abnormalFlags || 0,
          requires_follow_up: logData.requiresFollowUp || false,
          resolved: logData.resolved !== undefined ? logData.resolved : true,
          timestamp: logData.timestamp ? new Date(logData.timestamp).toISOString() : new Date().toISOString()
        });

      if (error) {
        console.error(`❌ Error inserting log for pet ${newPetUuid}:`, error.message);
      } else {
        console.log(`✅ Migrated Log: ${logData.primaryReason}`);
      }
    }

    console.log('\n🎉 Migration Complete!');

  } catch (error) {
    console.error('🔥 Critical Migration Failure:', error);
  }
}

// Execute the migration
runMigration();
