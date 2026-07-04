import type { SupabaseClient } from "@supabase/supabase-js";

import { mockClients } from "@/lib/mock/reformando";
import type { Client, ListState, DetailState } from "@/lib/types/reformando";

type ClientRow = {
  id: string;
  organization_id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ClientsReader = {
  listClients(organizationId: string): Promise<Client[]>;
  getClient(organizationId: string, clientId: string): Promise<Client | null>;
};

export function mapClientRow(row: ClientRow): Client {
  return {
    id: row.id,
    organizationId: row.organization_id,
    displayName: row.display_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    notes: row.notes,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export function createMockClientsReader(): ClientsReader {
  // TODO: replace mock adapter with Supabase query when staging data is ready.
  return {
    async listClients(organizationId) {
      return mockClients.filter((client) => client.organizationId === organizationId);
    },
    async getClient(organizationId, clientId) {
      return (
        mockClients.find(
          (client) => client.organizationId === organizationId && client.id === clientId
        ) ?? null
      );
    },
  };
}

export function createSupabaseClientsReader(supabase: SupabaseClient): ClientsReader {
  return {
    async listClients(organizationId) {
      const { data, error } = await supabase
        .from("clients")
        .select("id, organization_id, display_name, email, phone, address, notes, created_at, updated_at")
        .eq("organization_id", organizationId)
        .order("display_name", { ascending: true });

      if (error) {
        return [];
      }

      return ((data ?? []) as ClientRow[]).map(mapClientRow);
    },
    async getClient(organizationId, clientId) {
      const { data, error } = await supabase
        .from("clients")
        .select("id, organization_id, display_name, email, phone, address, notes, created_at, updated_at")
        .eq("organization_id", organizationId)
        .eq("id", clientId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return mapClientRow(data as ClientRow);
    },
  };
}

export async function toClientsListState(items: Client[]): Promise<ListState<Client>> {
  if (items.length === 0) return { status: "empty", items: [] };
  return { status: "ready", items };
}

export async function toClientDetailState(item: Client | null): Promise<DetailState<Client>> {
  if (!item) return { status: "not_found" };
  return { status: "ready", item };
}
