import { platformFeatureRepository } from '../repositories/platformFeatureRepository';
import { auditService } from './auditService';
import type { PlatformFeature, FeatureStatus, FeatureCategory, FeatureType } from '../types';

export const platformFeatureService = {
  async listFeatures(): Promise<PlatformFeature[]> {
    return platformFeatureRepository.getAll();
  },

  async getFeature(key: string): Promise<PlatformFeature | null> {
    return platformFeatureRepository.getByKey(key);
  },

  async createFeature(
    actorId: string,
    data: {
      key: string;
      name: string;
      description: string;
      category: FeatureCategory;
      featureType: FeatureType;
      featureStatus?: FeatureStatus;
      defaultEnabled?: boolean;
    }
  ): Promise<PlatformFeature> {
    const existing = await platformFeatureRepository.getByKey(data.key);
    if (existing) {
      throw new Error(`Feature key '${data.key}' already exists. Feature keys must be unique and immutable.`);
    }

    const now = new Date().toISOString();
    const feature: PlatformFeature = {
      id: data.key,
      key: data.key,
      name: data.name,
      description: data.description,
      category: data.category,
      featureType: data.featureType,
      featureStatus: data.featureStatus || 'active',
      defaultEnabled: data.defaultEnabled ?? false,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    };

    await platformFeatureRepository.save(feature);

    await auditService.log({
      organisationId: 'platform',
      actorId,
      action: 'PLATFORM_CREATE_FEATURE',
      entityType: 'platformFeature',
      entityId: feature.key,
      scopeType: 'platform',
      after: feature
    });

    return feature;
  },

  async updateFeature(
    actorId: string,
    key: string,
    updates: {
      name?: string;
      description?: string;
      category?: FeatureCategory;
      featureStatus?: FeatureStatus;
      defaultEnabled?: boolean;
    }
  ): Promise<PlatformFeature> {
    const current = await platformFeatureRepository.getByKey(key);
    if (!current) {
      throw new Error(`Feature '${key}' not found.`);
    }

    const updated: PlatformFeature = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: actorId
    };

    await platformFeatureRepository.save(updated);

    await auditService.log({
      organisationId: 'platform',
      actorId,
      action: 'PLATFORM_UPDATE_FEATURE',
      entityType: 'platformFeature',
      entityId: key,
      scopeType: 'platform',
      before: current,
      after: updated
    });

    return updated;
  }
};
