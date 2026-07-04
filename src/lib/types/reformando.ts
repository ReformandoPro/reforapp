export type ReformandoRole = "owner" | "admin" | "member";

export type Organization = {
  id: string;
  name: string;
  slug?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Membership = {
  id?: string;
  organizationId: string;
  userId: string;
  role: ReformandoRole;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Client = {
  id: string;
  organizationId: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ProjectLifecycleStatus =
  | "lead"
  | "budgeting"
  | "approved"
  | "scheduled"
  | "in_progress"
  | "paused"
  | "completed"
  | "delivered"
  | "closed"
  | "cancelled";

export type Project = {
  id: string;
  organizationId: string;
  clientId: string | null;
  name: string;
  status: ProjectLifecycleStatus;
  address: string | null;
  type: string | null;
  progress: number;
  clientName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ListState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty"; items: [] }
  | { status: "ready"; items: T[] };

export type DetailState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "not_found" }
  | { status: "ready"; item: T };
