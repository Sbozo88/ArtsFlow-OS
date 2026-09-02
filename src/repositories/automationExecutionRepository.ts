import { BaseRepository } from './BaseRepository';
import { AutomationExecution, ExecutionStatus } from '../types';

class AutomationExecutionRepository extends BaseRepository<AutomationExecution> {
  constructor() {
    super('automationExecutions');
  }

  async getRecentExecutions(organisationId: string, limitCount = 50): Promise<AutomationExecution[]> {
    const executions = await this.getByOrganisation(organisationId);
    return executions
      .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
      .slice(0, limitCount);
  }

  async getByRuleId(organisationId: string, ruleId: string): Promise<AutomationExecution[]> {
    const executions = await this.getByOrganisation(organisationId);
    return executions
      .filter(e => e.automationRuleId === ruleId)
      .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
  }

  async getByStatus(organisationId: string, status: ExecutionStatus): Promise<AutomationExecution[]> {
    const executions = await this.getByOrganisation(organisationId);
    return executions
      .filter(e => e.executionStatus === status)
      .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
  }

  async findByDeduplicationKey(
    organisationId: string, 
    deduplicationKey: string, 
    sinceTimestampIso?: string
  ): Promise<AutomationExecution | null> {
    const executions = await this.getByOrganisation(organisationId);
    const matched = executions
      .filter(e => {
        if (e.deduplicationKey !== deduplicationKey) return false;
        if (e.isDryRun) return false;
        if (sinceTimestampIso && e.triggeredAt < sinceTimestampIso) return false;
        return true;
      })
      .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());

    return matched[0] || null;
  }
}

export const automationExecutionRepository = new AutomationExecutionRepository();
