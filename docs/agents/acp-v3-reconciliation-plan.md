# ACP-1.1 ↔ Schema V3 reconciliation plan

Status: preparatory review artifact. This document does not activate ACP, modify the normative candidate, authorize automation, or approve any schema.

## 1. Objective

Define the exact reconciliation work required after publication of ACP Envelope Schema V3.

Inputs:

- ACP-1.1 normative amendment candidate:
  - branch: `feat/acp-1-1-normative-amendments`
  - known SHA: `1bda3e997291e337cc1a3956462e643219d71547`
- ACP Envelope Schema V2:
  - branch: `feat/acp-envelope-schema`
  - known SHA: `9d073e3c9d63a7d1e4b9f2e237a65c8da9c508a6`
- Hermes independent review verdict:
  - `SCHEMA STRUCTURALLY VALID — FIXTURE CORPUS INSUFFICIENT`

The V3 review must prove bidirectional consistency:

1. Every normative ACP-1.1 requirement has a schema rule, a fixture, or an explicit external semantic check.
2. Every schema rule has a normative basis in ACP-1.1 or is clearly marked implementation-only.
3. Every fixture proves one intended rule and does not fail or pass for an unrelated reason.

## 2. Required V3 deltas

### 2.1 Envelope metadata

ACP-1.1 requires:

- `v` with major.minor semantics;
- `type` from the closed 27-event catalogue;
- declared logical `actor`;
- exactly one subject selector:
  - `item`; or
  - `program`;
- explicit causal mode:
  - `root: true`; or
  - `after`.

Review checks:

- no event may omit both subject selectors;
- no event may include both subject selectors;
- no non-root event may omit `after`;
- no event may include both `root: true` and `after`;
- `root: false` must not be used as a silent substitute for absence;
- causal pointers must be namespaced and platform-generated.

### 2.2 Root eligibility

ACP-1.1 root eligibility:

- `spec` with item subject;
- `reconcile` with item or program subject, as normatively defined;
- `decide` only when the subject is program.

Explicitly invalid:

- root `risk`;
- root `debt`;
- root `violation`;
- item-level root `decide`;
- root `authorize`;
- root `question`;
- root `review`;
- root `submit`.

### 2.3 Identity model

Normative distinctions:

- `actor`: authored logical identity;
- `observed_actor`: binding-supplied identity outside the authored envelope;
- `identity_assurance`: profile/binding trust level;
- `identity_mismatch`: semantic violation result;
- `on_behalf_of`: explicit delegation statement.

Schema boundary:

- require declared `actor`;
- validate `on_behalf_of` shape if present;
- do not claim authenticity;
- do not embed observed platform identity in the authored event.

### 2.4 Flat envelope

ACP-1.1 normatively adopts the flat envelope.

V3 must:

- preserve event-specific field isolation;
- reject fields belonging to another event type;
- document future collision policy;
- use a single `extensions` container;
- prohibit top-level `x-*` fields;
- validate extension keys with:
  - `^x-[a-z0-9][a-z0-9-]*$`.

### 2.5 Uncertainty

ACP-1.1 allows explicit empty uncertainty:

- `unverified: []` is valid;
- omission remains invalid where the event requires the declaration;
- `falsified` and `would_change_my_mind` remain event-conditional.

Review must distinguish:

- absence;
- explicit empty array;
- non-empty declaration;
- irrelevant declaration on the wrong event.

### 2.6 Claim references

ACP-1.1 requires:

- `heartbeat` references the claim it extends;
- `release` references the claim it releases;
- handoff lease-release behavior is explicit;
- claim reference existence and ownership remain semantic checks.

### 2.7 Work-item and repository identifiers

Core:

- portable stable work-item token;
- no `RF-*` requirement;
- no reserved historical product IDs;
- portable repository reference.

Profile:

- work-item pattern;
- reserved IDs;
- Reformando historical names `R1`, `R2`, `R2.1`;
- binding-specific repository naming.

### 2.8 Catalogue and capabilities

Closed event catalogue:

- answer
- approve
- assume
- authorize
- block
- checkpoint
- claim
- close
- debt
- decide
- handoff
- heartbeat
- progress
- question
- reconcile
- release
- revalidate
- review
- revoke
- risk
- spec
- submit
- supersede
- triage
- unblock
- validate
- violation

V3 must prove:

- envelope and profile catalogues are identical;
- catalogue digest is recomputed for both schemas;
- capabilities use the same names as event types;
- prohibited aliases fail.

## 3. Hermes findings closure matrix

### M1 — Format assertion

Required closure:

- conformance documentation explicitly requires format assertion; or
- schema no longer depends on optional format behavior.

Evidence:

- invalid regex fixture rejected under the declared validator configuration;
- README names validator version and format settings.

### M2 — Question option IDs

Required closure:

- option identifiers cannot be ambiguous; or
- ambiguity is explicitly delegated to semantic validation with a documented limitation.

Preferred normative representation:

- object/map keyed by option ID, if ACP-1.1 permits it.

Required fixture coverage:

- duplicate/ambiguous IDs invalid or explicitly accepted as semantic-only with a boundary fixture.

### M3 — Revalidate scope difference

Required closure:

- non-empty changed path/scope declaration;
- invalid empty `scope_diff.paths` fixture;
- invalid missing `new_basis` fixture;
- old and new basis equality classified as schema or semantic rule.

### M4 — Profile referential integrity

README must list external profile-linter checks:

- agent role exists;
- reviewer/veto/owner IDs exist;
- gate references exist;
- automation implementation owner exists;
- gate dependency graph references valid gates;
- logical IDs are unique;
- shorthand permission contradictions may be undetectable.

### M5 — Reformando profile

Canonical ACP-1.1 fixture must include:

- explicit identity trust level;
- `never_default_actions`;
- unresolved handles represented honestly;
- no claim of independent identity at trust level below the profile requirement.

### L1 — Profile extension grammar

Profile and envelope must use the same strict extension-key pattern.

### L2 — Delivery vocabulary

Resolve whether `pull-request` and `merge-request` are:

- Core delivery kinds; or
- binding-specific values.

The decision must be normative or explicitly informative.

### L3 — Risk/debt/decision IDs

Core must not impose profile prefixes for risk, debt, or decision records unless ACP-1.1 explicitly creates a Core namespace.

### L4 — Decide root

Schema must enforce:

- root decide only with program subject;
- item decide requires `after`.

### L5 — Short SHA audit

No normative example or fixture may use an abbreviated SHA where full SHA is required.

## 4. Mandatory fixture set

### Valid

- spec root with item;
- reconcile root with item;
- decide root with program;
- risk with after;
- debt with after;
- violation with after;
- heartbeat with claim reference;
- release with claim reference;
- `unverified: []`;
- lowercase custom item ID;
- UUID-like item ID;
- syntactically valid but semantically stale causal pointer;
- extensions object containing `x-github-pr`;
- ACP-1.1 Reformando profile.

### Invalid

- assume default-on-timeout without source question;
- revalidate without new basis;
- revalidate with empty scope diff;
- profile extension key `x-`;
- profile extension key `X-foo`;
- profile extension key `x_foo`;
- root risk;
- root debt;
- root violation;
- item-level root decide;
- event with both item and program;
- event with neither item nor program;
- heartbeat without claim reference;
- release without claim reference;
- top-level x-extension;
- missing actor;
- incompatible old version;
- prohibited event alias;
- root plus after;
- neither root nor after on a non-root event.

## 5. Traceability contract

V3 should include a traceability table with columns:

- Requirement ID;
- ACP-1.1 section;
- schema path;
- valid fixture;
- invalid fixture;
- external semantic check;
- status.

Minimum requirements:

- version;
- event catalogue;
- actor;
- subject item/program;
- root;
- after;
- basis;
- SHA;
- repository;
- touches;
- claim;
- heartbeat;
- release;
- review;
- validate;
- revalidate;
- authorize;
- revoke;
- question/silence;
- extensions;
- uncertainty;
- profile identity;
- permissions;
- gates;
- catalogue parity.

A requirement without a schema rule must explicitly name the semantic validator responsibility.

## 6. Mechanical reconciliation procedure

After V3 publication:

1. Confirm exact branch SHA.
2. Compare changed files with V2.
3. Parse ACP-1.1, envelope schema, profile schema, and fixtures.
4. Build the normative event catalogue from ACP-1.1.
5. Build both schema catalogues.
6. Compare sets, order, and digest.
7. Extract every normative `MUST`, `MUST NOT`, `REQUIRED`, and `FORBIDDEN` statement relevant to schema.
8. Match each statement to TRACEABILITY.
9. Confirm each syntactic rule has discriminating fixtures.
10. Confirm each semantic-only rule is named honestly.
11. Confirm no schema rule lacks normative basis.
12. Confirm no normative schema-relevant requirement lacks a rule or explicit deferral.
13. Run valid and invalid corpus with a named Draft 2020-12 validator.
14. Confirm invalid fixtures fail for the intended keyword or schema path.
15. Confirm `git diff --check` and scope.

## 7. Acceptance verdicts

Use one:

### `ACP-1.1 AND SCHEMA V3 RECONCILED — READY FOR INCREMENTAL ADVERSARIAL REVIEW`

No blocking divergence remains. All schema-relevant normative requirements are traced.

### `CHANGES REQUIRED — NORMATIVE/EXECUTABLE DIVERGENCE REMAINS`

At least one normative requirement and executable rule conflict or lack a declared boundary.

### `SCHEMA V3 STRUCTURALLY VALID — TRACEABILITY INCOMPLETE`

Schemas and fixtures pass, but the normative mapping cannot yet prove completeness.

## 8. Consolidated PR plan

No PR should open until reconciliation passes.

Recommended consolidation branch after approval:

`feat/acp-1-1-consolidated`

Expected content:

- ACP-1.1 normative files;
- Schema V3;
- valid/invalid fixture corpus;
- schema README;
- TRACEABILITY;
- CHANGELOG;
- amendment decisions.

Excluded from the first PR:

- GitHub Actions;
- bots;
- webhooks;
- labels;
- Projects;
- generated issue templates;
- automatic validators;
- active ACP adoption;
- changes to product code, migrations, or deploys.

The first PR is a specification and conformance-artifact PR only.

## 9. Review sequence after V3

1. ChatGPT mechanical reconciliation.
2. Hermes incremental adversarial review limited to V3 deltas and prior findings.
3. Claude fixes only confirmed defects.
4. Openclaw verifies repository scope and GitHub implementability assumptions.
5. Open consolidated PR.
6. Merge only after explicit approval.
7. Begin GitHub Binding design.

## 10. Non-goals

This plan does not:

- approve ACP-1.1;
- approve Schema V3;
- activate ACP;
- create automation;
- define the GitHub Binding;
- create templates;
- create agent identities;
- authorize any merge, deploy, migration, or remote write.
