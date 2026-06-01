# Screens style inventory (selected)

## `src/components/screens/ReformistDashboardScreen.tsx`

**UI imports (raw):**

```ts
import type { DashboardSummary, OperationalAlertLevel } from "@/lib/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { ListItem } from "../ui/ListItem";
import { MetricCard } from "../ui/MetricCard";
import { ProgressBar } from "../ui/ProgressBar";
```
**CSS vars referenced (`--*`):**

```txt
--bg-base
--bg-surface
--border-subtle
--text-primary
--text-secondary
--text-tertiary
```
**`var(--token)` usages detected:**

```txt
--bg-base
--bg-surface
--border-subtle
--text-primary
--text-secondary
--text-tertiary
```
**Tailwind-ish class strings (heuristic):**

```txt
bg-[var(--bg-base)] p-4 shadow-none
flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between
flex flex-col gap-6
flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between
flex items-center justify-between gap-3
flex items-start justify-between gap-3
flex items-start justify-between gap-4
font-semibold text-[var(--text-primary)]
grid gap-3 sm:grid-cols-2 lg:min-w-[320px] lg:max-w-[360px]
grid gap-4 sm:grid-cols-2 xl:grid-cols-4
grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-start
max-w-2xl
mt-1 text-lg font-semibold
mt-1 text-sm leading-5 text-[var(--text-secondary)]
mt-1 text-sm text-[var(--text-secondary)]
mt-2 text-3xl font-semibold
mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base
mt-4 text-3xl font-semibold tracking-tight sm:text-4xl
mt-5
mt-5 grid gap-3 sm:grid-cols-3
mt-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/40 p-4
mt-5 space-y-3
mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-1 sm:px-6 xl:px-0
overflow-hidden
p-6 shadow-none
text-base font-semibold
text-lg font-semibold
text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]
text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]
w-full sm:w-auto
```
## `src/app/projects/[id]/tasks/page.tsx`

**UI imports (raw):**

```ts
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { getProjectOverview } from "@/lib/services/projects";
import { getProjectTasks } from "@/lib/services/tasks";
import { ProjectTasksClient } from "./ProjectTasksClient";
```
**CSS vars referenced (`--*`):**

```txt
None
```
**`var(--token)` usages detected:**

```txt
None
```
**Tailwind-ish class strings (heuristic):**

```txt
flex flex-col gap-3
inline-flex text-sm font-medium text-slate-600 hover:text-slate-900
mt-1 text-sm text-slate-600
mx-auto flex w-full max-w-6xl flex-col gap-6
text-2xl font-semibold text-slate-900 sm:text-3xl
text-sm text-slate-500
```
## `src/app/projects/[id]/tasks/ProjectTasksClient.tsx`

**UI imports (raw):**

```ts
import { useMemo, useState } from "react";
import { updateTaskStatusAction } from "./actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { TaskPriority } from "@/lib/domain/tasks/priority";
import type { TaskStatus } from "@/lib/domain/tasks/status";
import type { ProjectTaskListItem } from "@/lib/types";
```
**CSS vars referenced (`--*`):**

```txt
None
```
**`var(--token)` usages detected:**

```txt
None
```
**Tailwind-ish class strings (heuristic):**

```txt
flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between
flex flex-col items-stretch gap-2 sm:items-end
grid gap-4
mt-1 text-sm text-slate-900
mt-2 flex flex-wrap gap-2
mt-5 grid gap-3 sm:grid-cols-3
text-sm text-slate-500
text-xs text-rose-600
text-xs uppercase tracking-[0.14em] text-slate-500
```
## `src/app/projects/[id]/tasks/actions.ts`

**UI imports (raw):**

```ts
import { isTaskStatus, type TaskStatus } from "@/lib/domain/tasks/status";
import { updateTaskStatus } from "@/lib/services/tasks";
```
**CSS vars referenced (`--*`):**

```txt
None
```
**`var(--token)` usages detected:**

```txt
None
```
**Tailwind-ish class strings (heuristic):**

```txt
None
```
## `src/app/projects/[id]/page.tsx`

**UI imports (raw):**

```ts
import Link from "next/link";
import { ProjectOverviewScreen } from "@/components/screens/ProjectOverviewScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { getProjectOverview } from "@/lib/services/projects";
```
**CSS vars referenced (`--*`):**

```txt
None
```
**`var(--token)` usages detected:**

```txt
None
```
**Tailwind-ish class strings (heuristic):**

```txt
flex flex-wrap gap-3
inline-flex text-sm font-medium text-slate-600 hover:text-slate-900
inline-flex text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline
mx-auto flex w-full max-w-6xl flex-col gap-6
```
## `src/app/projects/page.tsx`

**UI imports (raw):**

```ts
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getProjectCards } from "@/lib/services/projects";
import type { ProjectStatus } from "@/lib/domain/projects/status";
```
**CSS vars referenced (`--*`):**

```txt
--bg-surface
--bg-surface-raised
--border-subtle
--primary-300
--text-primary
--text-secondary
--text-tertiary
```
**`var(--token)` usages detected:**

```txt
--bg-surface
--bg-surface-raised
--border-subtle
--primary-300
--text-primary
--text-secondary
--text-tertiary
```
**Tailwind-ish class strings (heuristic):**

```txt
block p-5 transition-colors hover:bg-[var(--bg-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]
border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 text-[var(--text-primary)] shadow-none
border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none
flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between
grid gap-4
max-w-2xl
mt-1 text-lg font-semibold text-[var(--text-primary)]
mt-1 text-sm text-[var(--text-secondary)]
mt-2 text-sm text-[var(--text-secondary)] sm:text-base
mt-5 grid gap-3 sm:grid-cols-3
mx-auto flex w-full max-w-6xl flex-col gap-6
text-2xl font-semibold tracking-tight sm:text-3xl
text-lg font-semibold text-[var(--text-primary)]
text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]
```
## `src/app/budgets/page.tsx`

**UI imports (raw):**

```ts
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getBudgetSummaries } from "@/lib/services/budgets";
import type { BudgetStatus } from "@/lib/domain/budgets/status";
```
**CSS vars referenced (`--*`):**

```txt
--bg-surface
--bg-surface-raised
--border-subtle
--primary-300
--text-primary
--text-secondary
--text-tertiary
```
**`var(--token)` usages detected:**

```txt
--bg-surface
--bg-surface-raised
--border-subtle
--primary-300
--text-primary
--text-secondary
--text-tertiary
```
**Tailwind-ish class strings (heuristic):**

```txt
block p-5 transition-colors hover:bg-[var(--bg-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]
border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 text-[var(--text-primary)] shadow-none
border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none
flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between
grid gap-4
max-w-2xl
mt-1 text-lg font-semibold text-[var(--text-primary)]
mt-2 text-sm text-[var(--text-secondary)] sm:text-base
mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5
mx-auto flex w-full max-w-6xl flex-col gap-6
space-y-1
text-2xl font-semibold tracking-tight sm:text-3xl
text-lg font-semibold text-[var(--text-primary)]
text-sm text-[var(--text-secondary)]
text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]
```
## `src/app/budgets/[id]/page.tsx`

**UI imports (raw):**

```ts
import Link from "next/link";
import { BudgetSummaryScreen } from "@/components/screens/BudgetSummaryScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { getBudgetSummary } from "@/lib/services/budgets";
```
**CSS vars referenced (`--*`):**

```txt
None
```
**`var(--token)` usages detected:**

```txt
None
```
**Tailwind-ish class strings (heuristic):**

```txt
inline-flex text-sm font-medium text-slate-600 hover:text-slate-900
mx-auto flex w-full max-w-6xl flex-col gap-6
```
## `src/app/layout.tsx`

**UI imports (raw):**

```ts
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout";
import "./globals.css";
```
**CSS vars referenced (`--*`):**

```txt
--font-geist-mono
--font-geist-sans
```
**`var(--token)` usages detected:**

```txt
None
```
**Tailwind-ish class strings (heuristic):**

```txt
min-h-full flex flex-col
```
