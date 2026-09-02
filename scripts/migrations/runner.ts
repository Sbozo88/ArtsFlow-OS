import type { Migration, MigrationContext } from './types';
import { migration001BaselineSchema } from './001_baseline_schema';

export const ALL_MIGRATIONS: Migration[] = [
  migration001BaselineSchema
];

export async function runMigrations(options?: {
  dryRun?: boolean;
  targetVersion?: number;
  organisationId?: string;
  logger?: (msg: string) => void;
}): Promise<{
  appliedMigrations: number;
  allSucceeded: boolean;
  results: Array<{ version: number; name: string; success: boolean; recordsUpdated: number }>;
}> {
  const isDryRun = options?.dryRun !== undefined ? options.dryRun : true;
  const logger = options?.logger || console.log;
  const targetVersion = options?.targetVersion || Infinity;

  logger(`[MIGRATION RUNNER] Starting migration execution (dryRun: ${isDryRun}, targetVersion: ${targetVersion})`);

  const results: Array<{ version: number; name: string; success: boolean; recordsUpdated: number }> = [];
  let allSucceeded = true;

  for (const m of ALL_MIGRATIONS) {
    if (m.version > targetVersion) continue;

    logger(`[MIGRATION RUNNER] Running version ${m.version}: ${m.name}`);
    const ctx: MigrationContext = {
      organisationId: options?.organisationId,
      isDryRun,
      logger
    };

    try {
      const res = await m.apply(ctx);
      results.push({
        version: m.version,
        name: m.name,
        success: res.success,
        recordsUpdated: res.recordsUpdated
      });
      if (!res.success) {
        allSucceeded = false;
        logger(`[MIGRATION RUNNER] Migration ${m.version} failed. Aborting further migrations.`);
        break;
      }
    } catch (err) {
      allSucceeded = false;
      logger(`[MIGRATION RUNNER] Exception in migration ${m.version}: ${(err as Error).message}`);
      results.push({
        version: m.version,
        name: m.name,
        success: false,
        recordsUpdated: 0
      });
      break;
    }
  }

  return {
    appliedMigrations: results.filter(r => r.success).length,
    allSucceeded,
    results
  };
}
