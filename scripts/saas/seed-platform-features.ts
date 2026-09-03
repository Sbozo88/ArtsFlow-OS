/**
 * Seed Platform Features
 * 
 * Populates the global platformFeatures collection with the standard feature definitions.
 * Safe to run multiple times (idempotent using deterministic document IDs based on feature key).
 */

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { STANDARD_PLATFORM_FEATURES } from '../../src/config/platformFeaturesRegistry';

export async function seedPlatformFeatures(actorId = 'system_seeder') {
  console.log(`[Seed] Seeding ${STANDARD_PLATFORM_FEATURES.length} platform features...`);
  const now = new Date().toISOString();
  let createdCount = 0;
  let skippedCount = 0;

  for (const feat of STANDARD_PLATFORM_FEATURES) {
    const docRef = doc(db, 'platformFeatures', feat.key.replace(/\./g, '_'));
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      await setDoc(docRef, {
        ...feat,
        id: feat.key.replace(/\./g, '_'),
        createdAt: now,
        updatedAt: now,
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      });
      createdCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`[Seed] Platform Features complete: ${createdCount} created, ${skippedCount} existing.`);
  return { createdCount, skippedCount };
}

// Run standalone if executed directly
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.endsWith('seed-platform-features.ts')) {
  seedPlatformFeatures()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]', err);
      process.exit(1);
    });
}
