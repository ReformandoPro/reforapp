export type ExternalReference = {
  provider: 'odoo';
  model: string;
  externalId: string;
  syncedAt?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  lastError?: string;
};
