import { BaseRepository } from './BaseRepository';
import { OperationalAlert, AlertStatus, OperationalAlertType } from '../types';

class OperationalAlertRepository extends BaseRepository<OperationalAlert> {
  constructor() {
    super('operationalAlerts');
  }

  async getActiveAlerts(organisationId: string): Promise<OperationalAlert[]> {
    const alerts = await this.getByOrganisation(organisationId);
    return alerts
      .filter(a => a.alertStatus === 'active' || a.alertStatus === 'acknowledged')
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
  }

  async getByStatus(organisationId: string, status: AlertStatus): Promise<OperationalAlert[]> {
    const alerts = await this.getByOrganisation(organisationId);
    return alerts
      .filter(a => a.alertStatus === status)
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
  }

  async getByType(organisationId: string, alertType: OperationalAlertType): Promise<OperationalAlert[]> {
    const alerts = await this.getByOrganisation(organisationId);
    return alerts.filter(a => a.alertType === alertType);
  }
}

export const operationalAlertRepository = new OperationalAlertRepository();
