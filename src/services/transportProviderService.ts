import { transportProviderRepository } from '../repositories/transportProviderRepository';
import { TransportProvider } from '../types';
import { auditService } from './auditService';

export const transportProviderService = {
  async getProviders(organisationId: string): Promise<TransportProvider[]> {
    return transportProviderRepository.getByOrganisation(organisationId);
  },

  async getProvider(organisationId: string, id: string): Promise<TransportProvider | null> {
    return transportProviderRepository.getById(organisationId, id);
  },

  async createProvider(
    organisationId: string,
    data: Omit<TransportProvider, keyof import('../types').BaseRecord | 'organisationId'>,
    userId: string
  ): Promise<TransportProvider> {
    const provider = await transportProviderRepository.create(organisationId, userId, data as never);
    await auditService.log(
      organisationId,
      userId,
      'CREATE_TRANSPORT_PROVIDER',
      'transportProviders',
      provider.id,
      undefined,
      provider
    );
    return provider;
  },

  async updateProvider(
    organisationId: string,
    id: string,
    updates: Partial<Omit<TransportProvider, keyof import('../types').BaseRecord | 'organisationId'>>,
    userId: string
  ): Promise<void> {
    const existing = await this.getProvider(organisationId, id);
    if (!existing) throw new Error('Transport provider not found');

    await transportProviderRepository.update(organisationId, userId, id, updates as never);
    const updated = await this.getProvider(organisationId, id);
    await auditService.log(
      organisationId,
      userId,
      'UPDATE_TRANSPORT_PROVIDER',
      'transportProviders',
      id,
      existing,
      updated
    );
  },

  async deleteProvider(organisationId: string, id: string, userId: string): Promise<void> {
    const existing = await this.getProvider(organisationId, id);
    if (!existing) throw new Error('Transport provider not found');

    await transportProviderRepository.softDelete(organisationId, userId, id);
    await auditService.log(
      organisationId,
      userId,
      'DELETE' as never,
      'transportProviders',
      id,
      existing,
      { ...existing, status: 'deleted' }
    );
  }
};
