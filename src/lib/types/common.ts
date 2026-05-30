export type EntityId = string;

export type ISODateString = string;

export type MoneyAmount = number;

export type AuditFields = {
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type OrganizationScoped = {
  organizationId: EntityId;
};
