# TOKEN MIGRATION — exact values

Paste-ready. Target end-state = the source-of-truth token set in
`docs/design/modern-source/tokens.css`. Three operations: **(A) add missing tokens**,
**(B) add temporary `--ds-*` aliases**, **(C) migrate code then delete aliases**.

---

## A. Tokens to ADD to `:root` in `globals.css`

These exist in the design system but are absent from the current app.

```css
:root {
  /* ---- Primary ramp (missing steps) ---- */
  --primary-50:   #E8F1FE;
  --primary-600:  #1E66D6;
  --primary-700:  #1850AB;

  /* ---- Success / warning / danger (missing mid + 700 steps) ---- */
  --success-300:  #5DCAA5;
  --success-700:  #0F6E56;
  --warning-700:  #854F0B;
  --danger-700:   #A32D2D;

  /* ---- Borders (missing dashed; note these are SHORTHANDS, see §C) ---- */
  --border-dashed:  1px dashed rgba(255, 255, 255, 0.18);

  /* ---- Radius (missing) ---- */
  --radius-full:  9999px;

  /* ---- Spacing scale (entirely missing) ---- */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;

  /* ---- Elevation (missing) ---- */
  --shadow-sheet:  0 -8px 32px rgba(0, 0, 0, 0.45);

  /* ---- Typography family (missing — see layout.tsx wiring) ---- */
  --font-ui:   "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-num:  "Space Grotesk", "Inter", system-ui, sans-serif;

  /* ---- Type scale (missing) ---- */
  --fs-display:  34px;  --lh-display:  40px;
  --fs-h1:       28px;  --lh-h1:       34px;
  --fs-h2:       22px;  --lh-h2:       28px;
  --fs-h3:       18px;  --lh-h3:       24px;
  --fs-body:     16px;  --lh-body:     24px;
  --fs-label:    14px;  --lh-label:    20px;
  --fs-caption:  13px;  --lh-caption:  18px;
  --fs-overline: 12px;  --lh-overline: 16px;

  --fw-regular:   400;
  --fw-medium:    500;
  --fw-semibold:  600;
  --fw-bold:      700;
}
```

Confirm these already-present values match the source of truth exactly (they should):

```
--bg-base #0A0F1A   --bg-surface #0E1626   --bg-surface-raised #162132   --bg-overlay #1C2940
--text-primary #F4F7FC   --text-secondary #A8B2C4   --text-tertiary #6B7689   --text-disabled #4A5366
--primary-100 #C7DEFD   --primary-300 #6FA8F6   --primary-500 #2D7FF9   --primary-900 #0C2F6B
--success-100 #9FE1CB   --success-500 #1D9E75   --success-900 #04342C
--warning-100 #FAC775   --warning-500 #EF9F27   --warning-900 #412402
--danger-100  #F09595   --danger-500  #E24B4A   --danger-900  #501313
--guild-chip-bg rgba(136,135,128,0.18)  --guild-chip-text #C9CDD6  --guild-chip-border rgba(136,135,128,0.28)
```

---

## B. Temporary compatibility shim (delete after migration)

So code referencing `--ds-*` keeps working while you migrate. Every `--ds-*` token
becomes a one-line alias to its canonical (unprefixed) name.

```css
:root {
  /* === TEMPORARY: remove once all --ds-* references are migrated === */
  --ds-bg-base:            var(--bg-base);
  --ds-bg-surface:         var(--bg-surface);
  --ds-bg-surface-raised:  var(--bg-surface-raised);
  --ds-bg-overlay:         var(--bg-overlay);

  --ds-content-primary:    var(--text-primary);
  --ds-content-secondary:  var(--text-secondary);
  --ds-content-tertiary:   var(--text-tertiary);
  --ds-content-disabled:   var(--text-disabled);

  --ds-primary-100:  var(--primary-100);
  --ds-primary-300:  var(--primary-300);
  --ds-primary-500:  var(--primary-500);
  --ds-primary-900:  var(--primary-900);

  --ds-success-100:  var(--success-100);
  --ds-success-500:  var(--success-500);
  --ds-success-900:  var(--success-900);

  --ds-warning-100:  var(--warning-100);
  --ds-warning-500:  var(--warning-500);
  --ds-warning-900:  var(--warning-900);

  --ds-danger-100:   var(--danger-100);
  --ds-danger-500:   var(--danger-500);
  --ds-danger-900:   var(--danger-900);

  --ds-guild-chip-bg:      var(--guild-chip-bg);
  --ds-guild-chip-text:    var(--guild-chip-text);
  --ds-guild-chip-border:  var(--guild-chip-border);

  --ds-shadow-fab:    var(--shadow-fab);
  --ds-shadow-sheet:  var(--shadow-sheet);

  /* border + focus shims: see §C — these change TYPE, handle with care */
}
```

---

## C. The two type-mismatch fixes (the careful ones)

### Borders — shorthand vs color

The design tokens `--border-subtle / -default / -strong / -dashed` are **shorthands**
(`1px solid rgba(…)`). The app used them as **colors** inside
`border-[var(--border-subtle)]`, which is invalid.

**Target (semantic model):** use Tailwind border utilities; the color values live in
`tailwind.config.js > theme.extend.borderColor` (`subtle`, `DEFAULT`, `strong`).

| Old (app) | New |
|---|---|
| `border border-[var(--border-subtle)]` | `border border-subtle` |
| `border border-[var(--border-default)]` | `border` |
| `border border-[var(--border-strong)]` | `border-strong` |
| `border border-dashed border-[var(--border-default)]` | `border border-dashed` |

If a raw-CSS context genuinely needs the shorthand, expose a **separate** token so the
name isn't overloaded — do **not** redefine `--border-subtle` as a color:

```css
--border-subtle-rule:  1px solid rgba(255,255,255,0.06);  /* for `border: var(--border-subtle-rule)` */
```

### Focus ring — box-shadow vs color

Design `--focus-ring` is a **box-shadow**. App treated it as a color and added
`--ds-focus-ring-shadow` for the shadow. Collapse to one treatment using the config's
ring utilities (`ringColor.focus`, already defined):

| Old (app) | New |
|---|---|
| `focus-visible:ring-[var(--focus-ring)]` (as color) | `focus-visible:ring-2 focus-visible:ring-focus` |
| `--ds-focus-ring-shadow` (box-shadow form) | delete; use `ring-focus` |

Already-correct example to copy from (`projects/page.tsx`, `budgets/page.tsx`):

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-300)]
  focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]
```
→ standardize the ring color to `ring-focus` (the system's focus rgba) rather than
`--primary-300`, unless design explicitly wants the lighter ring.

---

## D. Off-system raw Tailwind to retoken

Two screens bypass the system entirely with stock Tailwind palette classes. These
must move onto tokens:

| Off-system class | Replace with |
|---|---|
| `text-slate-900` | `text-content-primary` |
| `text-slate-600` / `text-slate-500` | `text-content-secondary` / `text-content-tertiary` |
| `text-rose-600` | `text-danger-500` |
| `hover:text-slate-900` | `hover:text-content-primary` |

Files: `src/app/projects/[id]/tasks/page.tsx`,
`src/app/projects/[id]/tasks/ProjectTasksClient.tsx` (and check siblings).
