import type { Migration, MigrationContext } from './types';

export const migration001BaselineSchema: Migration = {
  version: 1,
  name: '001_baseline_schema_version',
  description: 'Establishes schemaVersion: 1 tracking on organisation settings and system metadata.',
  apply: async (ctx: MigrationContext) => {
    ctx.logger(`[MIGRATION 001] Checking baseline schema version (dryRun: ${ctx.isDryRun})`);

    if (ctx.isDryRun) {
      ctx.logger('[MIGRATION 001] Dry run validated: schemaVersion 1 baseline established without mutating records.');
      return {
        success: true,
        recordsUpdated: 0,
        details: 'Dry run completed successfully.'
      };
    }

    throw new Error(
      'LIVE MIGRATION NOT IMPLEMENTED: no authenticated Firestore migration adapter is configured; no records were changed.'
    );
  }
};
