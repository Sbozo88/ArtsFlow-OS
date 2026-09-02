import { BaseRepository } from './BaseRepository';
import { AutomationRule, RuleCategory, RuleStatus } from '../types';

class AutomationRuleRepository extends BaseRepository<AutomationRule> {
  constructor() {
    super('automationRules');
  }

  async getActiveRules(organisationId: string): Promise<AutomationRule[]> {
    const rules = await this.getByOrganisation(organisationId);
    return rules.filter(r => r.ruleStatus === 'active');
  }

  async getByCategory(organisationId: string, category: RuleCategory): Promise<AutomationRule[]> {
    const rules = await this.getByOrganisation(organisationId);
    return rules.filter(r => r.ruleCategory === category);
  }

  async getByStatus(organisationId: string, status: RuleStatus): Promise<AutomationRule[]> {
    const rules = await this.getByOrganisation(organisationId);
    return rules.filter(r => r.ruleStatus === status);
  }
}

export const automationRuleRepository = new AutomationRuleRepository();
