# Modern component inventory (from ZIPs)

ZIP listing generated with Python `zipfile` (runtime has no `unzip`).

## componentes-tsx-src.zip

- Path: `docs/design/modern-source/componentes-tsx-src.zip`
- Files: **20**

### File list

- `src/components/Card.tsx`
- `src/components/Input.tsx`
- `src/components/Checkbox.tsx`
- `src/components/ProgressBar.tsx`
- `src/components/ListItem.tsx`
- `src/components/Donut.tsx`
- `src/components/Button.tsx`
- `src/components/Badge.tsx`
- `src/components/Avatar.tsx`
- `src/components/SegmentedControl.tsx`
- `src/components/EmptyState.tsx`
- `src/components/Timeline.tsx`
- `src/components/MetricCard.tsx`
- `src/components/GuildChip.tsx`
- `src/components/TabBar.tsx`
- `src/index.ts`
- `src/cn.ts`
- `src/fonts.ts`
- `src/types.ts`
- `README.md`

## componentes-next.zip

- Path: `docs/design/modern-source/componentes-next.zip`
- Files: **24**

### File list

- `components-next/jsconfig.json`
- `components-next/tailwind.config.js`
- `components-next/src/components/Card.jsx`
- `components-next/src/components/Input.jsx`
- `components-next/src/components/Donut.jsx`
- `components-next/src/components/SegmentedControl.jsx`
- `components-next/src/components/ListItem.jsx`
- `components-next/src/components/TabBar.jsx`
- `components-next/src/components/Avatar.jsx`
- `components-next/src/components/Badge.jsx`
- `components-next/src/components/Button.jsx`
- `components-next/src/components/ProgressBar.jsx`
- `components-next/src/components/Timeline.jsx`
- `components-next/src/components/MetricCard.jsx`
- `components-next/src/components/Checkbox.jsx`
- `components-next/src/components/GuildChip.jsx`
- `components-next/src/cn.js`
- `components-next/src/index.js`
- `components-next/src/fonts.js`
- `components-next/app/globals.css`
- `components-next/app/ejemplo-lista/page.jsx`
- `components-next/app/ejemplo-lista/ShoppingList.jsx`
- `components-next/app/layout.jsx`
- `components-next/README.md`

## ZIP differences

### Only in TSX ZIP

- `README.md`
- `src/cn.ts`
- `src/components/Avatar.tsx`
- `src/components/Badge.tsx`
- `src/components/Button.tsx`
- `src/components/Card.tsx`
- `src/components/Checkbox.tsx`
- `src/components/Donut.tsx`
- `src/components/EmptyState.tsx`
- `src/components/GuildChip.tsx`
- `src/components/Input.tsx`
- `src/components/ListItem.tsx`
- `src/components/MetricCard.tsx`
- `src/components/ProgressBar.tsx`
- `src/components/SegmentedControl.tsx`
- `src/components/TabBar.tsx`
- `src/components/Timeline.tsx`
- `src/fonts.ts`
- `src/index.ts`
- `src/types.ts`

### Only in Next (JSX) ZIP

- `components-next/README.md`
- `components-next/app/ejemplo-lista/ShoppingList.jsx`
- `components-next/app/ejemplo-lista/page.jsx`
- `components-next/app/globals.css`
- `components-next/app/layout.jsx`
- `components-next/jsconfig.json`
- `components-next/src/cn.js`
- `components-next/src/components/Avatar.jsx`
- `components-next/src/components/Badge.jsx`
- `components-next/src/components/Button.jsx`
- `components-next/src/components/Card.jsx`
- `components-next/src/components/Checkbox.jsx`
- `components-next/src/components/Donut.jsx`
- `components-next/src/components/GuildChip.jsx`
- `components-next/src/components/Input.jsx`
- `components-next/src/components/ListItem.jsx`
- `components-next/src/components/MetricCard.jsx`
- `components-next/src/components/ProgressBar.jsx`
- `components-next/src/components/SegmentedControl.jsx`
- `components-next/src/components/TabBar.jsx`
- `components-next/src/components/Timeline.jsx`
- `components-next/src/fonts.js`
- `components-next/src/index.js`
- `components-next/tailwind.config.js`

## Inspected excerpts (structure signals)

### TSX: `src/index.ts`

**Exports (lines starting with `export`)**

```ts
export { cn } from "./cn";
export type { ClassValue } from "./cn";
export { Button } from "./components/Button";
export type { ButtonProps } from "./components/Button";
export { Card } from "./components/Card";
export type { CardProps } from "./components/Card";
export { Badge } from "./components/Badge";
export type { BadgeProps } from "./components/Badge";
export { GuildChip } from "./components/GuildChip";
export type { GuildChipProps } from "./components/GuildChip";
export { Input } from "./components/Input";
export type { InputProps } from "./components/Input";
export { Checkbox } from "./components/Checkbox";
export type { CheckboxProps } from "./components/Checkbox";
export { ProgressBar } from "./components/ProgressBar";
export type { ProgressBarProps } from "./components/ProgressBar";
export { Donut } from "./components/Donut";
export type { DonutProps } from "./components/Donut";
export { Timeline } from "./components/Timeline";
export type { TimelineProps } from "./components/Timeline";
export { Avatar } from "./components/Avatar";
export type { AvatarProps } from "./components/Avatar";
export { SegmentedControl } from "./components/SegmentedControl";
export type { SegmentedControlProps } from "./components/SegmentedControl";
export { TabBar } from "./components/TabBar";
export type { TabBarProps } from "./components/TabBar";
export { ListItem, ListGroup } from "./components/ListItem";
export type { ListItemProps, ListGroupProps } from "./components/ListItem";
export { MetricCard, MetricCardGroup } from "./components/MetricCard";
export type { MetricCardProps, MetricCardGroupProps } from "./components/MetricCard";
export { EmptyState } from "./components/EmptyState";
export type { EmptyStateProps } from "./components/EmptyState";
export type {
```
**Detected CSS vars (`--*`)**

```txt
None
```
**Detected Tailwind-ish class strings (heuristic)**

```txt
None
```
### TSX: `src/types.ts`

**Exports (lines starting with `export`)**

```ts
export type SemanticStatus = "info" | "success" | "warning" | "danger" | "neutral";
export type ButtonVariant = "primary" | "confirm" | "secondary" | "text" | "destructive";
export type CardVariant = "surface" | "raised" | "active" | "dashed";
export type MilestoneStatus = "done" | "current" | "pending";
export type Size = "sm" | "md" | "lg";
export interface TimelineItem {
export type SegmentOption = string | { value: string; label: string };
export interface DonutSegment {
export interface TabItem {
```
**Detected CSS vars (`--*`)**

```txt
None
```
**Detected Tailwind-ish class strings (heuristic)**

```txt
None
```
### TSX: `src/cn.ts`

**Exports (lines starting with `export`)**

```ts
export type ClassValue = string | false | null | undefined;
export function cn(...classes: ClassValue[]): string {
```
**Detected CSS vars (`--*`)**

```txt
None
```
**Detected Tailwind-ish class strings (heuristic)**

```txt
None
```
### TSX: `src/components/Card.tsx`

**Exports (lines starting with `export`)**

```ts
export interface CardProps extends HTMLAttributes<HTMLElement> {
export function Card({
```
**Detected CSS vars (`--*`)**

```txt
None
```
**Detected Tailwind-ish class strings (heuristic)**

```txt
rounded-lg
```
### TSX: `src/components/Badge.tsx`

**Exports (lines starting with `export`)**

```ts
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
export function Badge({
```
**Detected CSS vars (`--*`)**

```txt
None
```
**Detected Tailwind-ish class strings (heuristic)**

```txt
inline-flex items-center gap-1.5 text-overline font-semibold uppercase tracking-wide px-3 py-1
rounded-full
rounded-sm
w-2 h-2 rounded-full
```
### TSX: `src/components/Button.tsx`

**Exports (lines starting with `export`)**

```ts
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
export function Button({
```
**Detected CSS vars (`--*`)**

```txt
None
```
**Detected Tailwind-ish class strings (heuristic)**

```txt
shadow-fab
w-full
```
### TSX: `src/components/MetricCard.tsx`

**Exports (lines starting with `export`)**

```ts
export interface MetricCardProps {
export function MetricCard({ label, value, footer = null, active = false, className = "" }: MetricCardProps) {
export interface MetricCardGroupProps {
export function MetricCardGroup({ className = "", children }: MetricCardGroupProps) {
```
**Detected CSS vars (`--*`)**

```txt
None
```
**Detected Tailwind-ish class strings (heuristic)**

```txt
bg-bg-surface border border-subtle text-content-primary
bg-primary-500 text-white
flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x
font-num text-[34px] font-bold leading-none mb-3
rounded-lg p-5 min-w-0
snap-start shrink-0 w-[44%] min-w-[150px]
text-content-secondary
text-overline font-semibold uppercase tracking-wide mb-2
text-white/80
```
### TSX: `src/components/ListItem.tsx`

**Exports (lines starting with `export`)**

```ts
export interface ListItemProps {
export function ListItem({
export interface ListGroupProps {
export function ListGroup({ className = "", children }: ListGroupProps) {
```
**Detected CSS vars (`--*`)**

```txt
None
```
**Detected Tailwind-ish class strings (heuristic)**

```txt
bg-bg-surface border border-subtle rounded-[14px] overflow-hidden divide-y divide-white/[0.06]
flex items-center gap-3.5 px-4 py-3.5
flex-1 min-w-0
shrink-0
text-[15px] font-semibold mb-0.5 truncate
text-caption truncate
text-content-disabled
text-content-primary
text-content-tertiary
text-content-tertiary line-through
```
### TSX: `src/components/ProgressBar.tsx`

**Exports (lines starting with `export`)**

```ts
export interface ProgressBarProps {
export function ProgressBar({ value = 0, tone = "primary", height = "md", className = "" }: ProgressBarProps) {
```
**Detected CSS vars (`--*`)**

```txt
None
```
**Detected Tailwind-ish class strings (heuristic)**

```txt
h-full rounded-full transition-[width] duration-500
w-full rounded-full overflow-hidden bg-white/[0.07]
```
### Next: `components-next/src/index.js`

**Exports (lines starting with `export`)**

```js
export { cn } from "./cn";
export { Button } from "./components/Button";
export { Card } from "./components/Card";
export { Badge } from "./components/Badge";
export { GuildChip } from "./components/GuildChip";
export { Input } from "./components/Input";
export { Checkbox } from "./components/Checkbox";
export { ProgressBar } from "./components/ProgressBar";
export { Donut } from "./components/Donut";
export { Timeline } from "./components/Timeline";
export { Avatar } from "./components/Avatar";
export { SegmentedControl } from "./components/SegmentedControl";
export { TabBar } from "./components/TabBar";
export { ListItem, ListGroup } from "./components/ListItem";
export { MetricCard, MetricCardGroup } from "./components/MetricCard";
```
**Detected CSS vars (`--*`)**

```txt
None
```
**Detected Tailwind-ish class strings (heuristic)**

```txt
None
```
### Next: `components-next/src/cn.js`

**Exports (lines starting with `export`)**

```js
export function cn(...classes) {
```
**Detected CSS vars (`--*`)**

```txt
None
```
**Detected Tailwind-ish class strings (heuristic)**

```txt
None
```
### Next: `components-next/src/components/Card.jsx`

**Exports (lines starting with `export`)**

```js
export function Card({
```
**Detected CSS vars (`--*`)**

```txt
None
```
**Detected Tailwind-ish class strings (heuristic)**

```txt
rounded-lg
```
### Next: `components-next/src/components/Badge.jsx`

**Exports (lines starting with `export`)**

```js
export function Badge({
```
**Detected CSS vars (`--*`)**

```txt
None
```
**Detected Tailwind-ish class strings (heuristic)**

```txt
inline-flex items-center gap-1.5 text-overline font-semibold uppercase tracking-wide px-3 py-1
rounded-full
rounded-sm
w-2 h-2 rounded-full
```
### Next: `components-next/src/components/Button.jsx`

**Exports (lines starting with `export`)**

```js
export function Button({
```
**Detected CSS vars (`--*`)**

```txt
None
```
**Detected Tailwind-ish class strings (heuristic)**

```txt
shadow-fab
w-full
```
### Next: `components-next/src/components/MetricCard.jsx`

**Exports (lines starting with `export`)**

```js
export function MetricCard({ label, value, footer = null, active = false, className = "" }) {
export function MetricCardGroup({ className = "", children }) {
```
**Detected CSS vars (`--*`)**

```txt
None
```
**Detected Tailwind-ish class strings (heuristic)**

```txt
bg-bg-surface border border-subtle text-content-primary
bg-primary-500 text-white
flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x
font-num text-[34px] font-bold leading-none mb-3
rounded-lg p-5 min-w-0
snap-start shrink-0 w-[44%] min-w-[150px]
text-content-secondary
text-overline font-semibold uppercase tracking-wide mb-2
text-white/80
```
### Next: `components-next/src/components/ListItem.jsx`

**Exports (lines starting with `export`)**

```js
export function ListItem({
export function ListGroup({ className = "", children }) {
```
**Detected CSS vars (`--*`)**

```txt
None
```
**Detected Tailwind-ish class strings (heuristic)**

```txt
bg-bg-surface border border-subtle rounded-[14px] overflow-hidden
divide-y divide-white/[0.06]
flex items-center gap-3.5 px-4 py-3.5
flex-1 min-w-0
shrink-0
text-[15px] font-semibold mb-0.5 truncate
text-caption truncate
text-content-disabled
text-content-primary
text-content-tertiary
text-content-tertiary line-through
```
### Next: `components-next/src/components/ProgressBar.jsx`

**Exports (lines starting with `export`)**

```js
export function ProgressBar({ value = 0, tone = "primary", height = "md", className = "", ...props }) {
```
**Detected CSS vars (`--*`)**

```txt
None
```
**Detected Tailwind-ish class strings (heuristic)**

```txt
h-full rounded-full transition-[width] duration-500
w-full rounded-full overflow-hidden bg-white/[0.07]
```
