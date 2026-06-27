import type { ProjectStatus } from "@/lib/domain/projects/status";

/**
 * Minimal project detail shape for `/projects/[id]`.
 *
 * This is intentionally small and read-only for the MVP.
 */
export type ProjectDetail = {
  id: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  address: string | null;
  type: string | null;
  progress: number | null;
  updatedAt: string | null;
};

