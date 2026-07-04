import type { Client, Organization, Project } from "@/lib/types/reformando";

export const mockOrganization: Organization = {
  id: "org-reformando-demo",
  name: "Reformas Demo Norte",
  slug: "reformas-demo-norte",
  createdAt: "2026-01-15T09:00:00.000Z",
  updatedAt: "2026-07-01T10:30:00.000Z",
};

export const mockClients: Client[] = [
  {
    id: "client-familia-garcia",
    organizationId: mockOrganization.id,
    displayName: "Familia García",
    email: "garcia@example.com",
    phone: "+34 600 111 222",
    address: "Calle Mayor 18, Madrid",
    notes: "Reforma integral de vivienda habitual. Prefieren comunicación por WhatsApp.",
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-07-02T11:00:00.000Z",
  },
  {
    id: "client-local-serrano",
    organizationId: mockOrganization.id,
    displayName: "Local Comercial Serrano",
    email: "admin@serrano.example",
    phone: "+34 600 333 444",
    address: "Calle Serrano 42, Madrid",
    notes: "Adecuación de local para apertura en septiembre.",
    createdAt: "2026-06-12T08:00:00.000Z",
    updatedAt: "2026-06-30T09:30:00.000Z",
  },
];

export const mockProjects: Project[] = [
  {
    id: "project-vivienda-garcia",
    organizationId: mockOrganization.id,
    clientId: "client-familia-garcia",
    name: "Reforma integral vivienda García",
    status: "in_progress",
    address: "Calle Mayor 18, 3ºB, Madrid",
    type: "Reforma integral",
    progress: 42,
    clientName: "Familia García",
    createdAt: "2026-06-05T08:00:00.000Z",
    updatedAt: "2026-07-03T17:20:00.000Z",
  },
  {
    id: "project-local-serrano",
    organizationId: mockOrganization.id,
    clientId: "client-local-serrano",
    name: "Adecuación local Serrano",
    status: "budgeting",
    address: "Calle Serrano 42, Madrid",
    type: "Local comercial",
    progress: 12,
    clientName: "Local Comercial Serrano",
    createdAt: "2026-06-18T08:00:00.000Z",
    updatedAt: "2026-07-01T13:10:00.000Z",
  },
];
