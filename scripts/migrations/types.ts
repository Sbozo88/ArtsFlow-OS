export interface MigrationContext {
  organisationId?: string;
  isDryRun: boolean;
  logger: (msg: string) => void;
}

export interface Migration {
  version: number;
  name: string;
  description: string;
  apply: (ctx: MigrationContext) => Promise<{ success: boolean; recordsUpdated: number; details?: string }>;
}
