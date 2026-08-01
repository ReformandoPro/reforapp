# ACP GitHub Binding — Draft 0.1

Status: non-normative binding draft. ACP is not active. This document does not authorize automation, merges, deployments, migrations, remote writes, or changes to protected repository state.

## 1. Purpose

This binding maps ACP Core concepts to GitHub primitives without changing their meaning.

The binding must preserve these principles:

- ACP events form an append-only coordination log.
- GitHub UI state is a projection, not the source of protocol truth.
- mutable fields such as labels, assignees, Issue bodies, Project fields, and PR state must never replace the event log.
- actor identity declared in an event is distinct from the GitHub identity observed when the event is posted.
- a branch name is not an evidence basis; exact commit SHAs are.
- a failed or unavailable GitHub read must be recorded as unverified rather than inferred.

## 2. Binding model

```text
ACP Core event
      ↓
GitHub-authored event comment
      ↓
Observed GitHub record
      ↓
Derived projections
      ├── Issue body
      ├── labels
      ├── assignees
      ├── Project fields
      ├── PR checks
      └── summary dashboards
```

The comment event plus GitHub's immutable metadata form the binding record.

## 3. Work-item representation

One ACP work item maps to one GitHub Issue.

The Issue number is a binding identifier, not necessarily the Core `item` value.

Recommended Reformando mapping:

```text
ACP item RF-142 ↔ GitHub Issue #142
```

The binding must record the relation explicitly. It must not assume all ACP identifiers are derived from Issue numbers.

### 3.1 Issue body

The Issue body is the current human-readable projection. It may contain:

- objective;
- scope;
- prohibited actions;
- acceptance criteria;
- current phase/freshness/modifiers;
- active lease summary;
- current basis;
- open risks;
- gate status;
- next action;
- latest checkpoint reference.

The body is replaceable and must be reproducible from the log. Editing it is not an ACP event unless accompanied by a corresponding ACP comment.

## 4. Event representation

Each ACP event maps to one top-level Issue comment.

Recommended comment structure:

```markdown
<!-- acp:event -->
```yaml
v: "1.1"
type: review
actor: hermes
item: RF-142
after: github-comment:2480173311
basis:
  repo:
    system: git
    id: https://github.com/ReformandoPro/reforapp
  ref: refs/heads/feature/example
  sha: 0123456789abcdef0123456789abcdef01234567
verdict: approve
unverified: []
extensions:
  x-github-pr: 151
```

Human-readable summary follows the envelope.
```

The exact envelope representation must follow the accepted ACP schema version. This example is illustrative until Schema V3 is adopted.

### 4.1 Event marker

The hidden marker `<!-- acp:event -->` allows tools and agents to distinguish ACP events from ordinary discussion comments.

A comment without the marker is conversation, not a protocol event.

A marked comment with an invalid envelope is a binding violation and must not update projections.

## 5. Platform-supplied event record

GitHub supplies metadata not authored by the agent:

```yaml
binding_record:
  system: github
  repository: ReformandoPro/reforapp
  issue_number: 142
  comment_id: 2480173312
  comment_node_id: IC_kw...
  observed_actor: hermes-reviewer
  created_at: 2026-08-02T15:21:33Z
  updated_at: 2026-08-02T15:21:33Z
  html_url: https://github.com/...
```

This record must remain separate from the authored envelope.

The binding compares:

- authored logical `actor`;
- observed GitHub actor;
- profile identity mapping;
- declared trust level.

A mismatch produces a violation event or stops projection, according to profile policy.

## 6. Causal pointers

GitHub Issue comment IDs are stable binding-level event pointers.

Recommended syntax:

```text
github-comment:2480173312
```

Rules:

- the binding generates the pointer after GitHub accepts the comment;
- agents obtain the current predecessor from GitHub, never from memory;
- root events use `root: true` according to ACP-1.1;
- non-root events reference the exact predecessor comment ID;
- missing comments, deleted comments, inaccessible comments, and cross-Issue pointers are semantic errors;
- two valid events referencing the same predecessor create a causal fork that requires reconciliation.

### 6.1 Posting problem

An authored comment cannot know its own GitHub comment ID before creation. Therefore:

- `after` references the prior event, which is already known;
- the current event's pointer is derived after posting;
- the binding record, not the authored envelope, stores the current event ID.

## 7. Actor identities

### 7.1 Preferred model

Each agent has a distinct GitHub identity or GitHub App installation identity.

Example profile mapping:

```yaml
identities:
  openclaw:
    github_login: reformando-openclaw
    assurance: distinct-account
  hermes:
    github_login: reformando-hermes
    assurance: distinct-account
```

### 7.2 Shared-account fallback

When several agents share one GitHub account:

- the authored `actor` remains auditable but not authenticated independently;
- `observed_actor` identifies only the shared account;
- independent review must be marked not cryptographically guaranteed;
- the profile must declare the lower assurance level;
- no system may claim separation of powers solely from authored actor names.

### 7.3 On behalf of

A human or coordinator may emit an event on behalf of an agent only when the envelope declares `on_behalf_of` and the profile permits it.

The observed actor remains the real GitHub account posting the event.

## 8. Delivery and evidence mapping

### 8.1 Branches and commits

- branch names are mutable delivery locators;
- full commit SHAs are immutable evidence basis identifiers;
- every submit, review, validation, revalidation, and authorization concerning code must include the exact SHA required by ACP-1.1.

### 8.2 Pull requests

A PR is a GitHub binding object for change discussion and merge state. It is not the ACP work item itself unless the profile explicitly chooses that mode.

Recommended mapping:

- Issue: coordination record;
- PR: delivery record;
- PR conversation: implementation-specific discussion;
- Issue ACP log: authoritative coordination events.

ACP comments may include:

```yaml
extensions:
  x-github-pr: 151
```

The binding validates that the PR exists and that its head SHA matches the event basis. That validation is semantic, not JSON Schema validation.

### 8.3 Checks and workflow runs

A validation event may reference:

- check run ID;
- workflow run ID;
- job ID;
- conclusion;
- artifact ID;
- artifact digest;
- environment.

These references belong in generic evidence objects plus binding extensions.

The binding must verify existence, repository, and SHA association before counting them toward a gate.

### 8.4 Artifacts

Artifacts are mutable in availability but immutable in claimed content only when their digest is recorded.

Required evidence for high-risk artifacts:

- artifact name;
- artifact ID;
- workflow run ID;
- size;
- digest;
- retention period;
- basis SHA.

An expired artifact may remain historical evidence, but it becomes non-retrievable and must be marked accordingly.

## 9. Leases on GitHub

A claim event opens a lease. GitHub has no native transactional lease primitive, so the binding must model leases in the event log.

### 9.1 Claim

A claim includes:

- intent;
- touches;
- duration;
- actor;
- predecessor;
- optional preemption metadata.

### 9.2 Heartbeat

A heartbeat references the claim event pointer and extends liveness according to profile rules.

It does not silently change scope.

### 9.3 Release

A release references the claim and explicitly ends it.

Closing a browser session, removing an assignee, closing a PR, or changing a label does not release a lease.

### 9.4 Race handling

Two actors may post competing claims before seeing each other's comments.

The binding detects this by:

- shared predecessor;
- overlapping `touches`;
- overlapping active intervals;
- incompatible intents.

The binding cannot prevent the race with ordinary Issue comments; it can only detect and reconcile it unless an automated transactional service is introduced later.

## 10. Touches and conflict detection

GitHub binding interpretations may include:

- repository paths;
- Issue/PR identifiers;
- workflow names;
- environments;
- databases or logical resources;
- external services.

A touch entry must identify its namespace.

Recommended binding extension:

```yaml
extensions:
  x-github-touches:
    - kind: path
      value: acp/schema/**
    - kind: pull-request
      value: "151"
```

Core `touches` remains platform-neutral. The binding normalizes GitHub-specific details for overlap detection.

## 11. Projection model

### 11.1 Authoritative source

Authoritative:

- valid ACP comments;
- GitHub immutable comment metadata;
- verified external evidence.

Derived:

- Issue body;
- labels;
- assignees;
- milestones;
- Project fields;
- summary Issues;
- dashboards.

### 11.2 Projection rules

Projection applies valid events in causal order.

A projector must:

1. read all marked comments;
2. validate envelope syntax;
3. attach observed metadata;
4. verify causal references;
5. flag forks and missing predecessors;
6. evaluate profile rules;
7. compute current composite state;
8. preserve violations and uncertainty;
9. update derived views only when reconciliation is valid.

A projector must not erase evidence that conflicts with the latest projection.

### 11.3 Projection drift

If the Issue body or labels differ from recomputed state:

- the event log wins;
- the projection is marked stale;
- automated correction may occur only in a later authorized implementation profile;
- manual mode requires a reconcile event before relying on the projection for sensitive gates.

## 12. State mapping

ACP state is composite. GitHub representations are projections.

Recommended labels:

```text
acp:phase/specification
acp:phase/implementation
acp:phase/review
acp:phase/validation
acp:phase/approval
acp:phase/done

acp:freshness/fresh
acp:freshness/stale
acp:freshness/invalid

acp:blocked
acp:at-risk
acp:needs-human
```

Labels must not be parsed as the event log.

A profile may choose fewer labels and store detailed state in Project fields.

## 13. Checkpoints and cold-start recovery

A checkpoint is an ACP event stored as an Issue comment.

Recommended GitHub behavior:

- mark the latest valid checkpoint in the Issue body with a stable comment link;
- optionally minimize older routine comments, never delete them;
- preserve the full log;
- include `covers` pointers to the summarized range;
- include current basis, open risks, gates, active lease, and resume instructions.

### 13.1 Cold-start read path

An agent recovering without context reads:

1. repository root instructions;
2. active ACP profile;
3. assigned/eligible Issues;
4. Issue projection;
5. latest valid checkpoint;
6. later ACP event comments;
7. current branch/PR/check evidence.

If the read budget is exceeded, the agent must stop and request or emit reconciliation according to role permissions.

## 14. Questions, silence, and authorization

### 14.1 Questions

A question event appears in the Issue log. Human replies that are not ACP answer events are discussion only until converted into a valid ACP event by an authorized actor.

### 14.2 Silence

GitHub notification delivery is not a trusted clock or receipt mechanism.

Expiry uses GitHub's observed comment timestamp plus profile duration.

The binding must not infer that a human saw the question.

Sensitive or irreversible actions never become authorized by silence.

### 14.3 Authorization

An authorization event must be posted by an observed identity mapped to an authorized profile actor.

The binding verifies:

- observed identity;
- declared actor;
- action;
- target;
- scope;
- basis SHA;
- limits;
- expiry;
- revocation history.

A PR approval, reaction, label, or merge button availability is not an ACP authorization unless the profile explicitly maps it and the binding records a corresponding event.

## 15. Reviews and validations

### 15.1 PR review versus ACP review

A GitHub PR review is evidence. An ACP review event is the protocol decision.

A binding may generate or accept an ACP review event from a PR review only if:

- the reviewer identity maps to the declared actor;
- the reviewed commit SHA is exact;
- the scope is explicit;
- the review verdict maps unambiguously;
- uncertainty declarations are present;
- independence requirements are satisfied.

### 15.2 Stale review

A new PR head SHA makes prior SHA-bound review stale unless a valid revalidate event covers the change.

GitHub's “changes requested” or “approved” UI state must not be treated as fresh without checking the reviewed commit SHA.

### 15.3 Validation

Checks associated with an older SHA are stale. Re-runs on the same SHA may be new evidence. Re-runs on another SHA require a new basis.

## 16. Handoffs

A handoff event must contain enough information for another agent to resume from GitHub alone:

- completed work;
- remaining work;
- traps and risks;
- exact next action;
- basis;
- branch/PR locators;
- active or released lease status;
- unverified facts.

A prose comment saying “done” is not a handoff.

## 17. Reconciliation

A reconcile event repairs protocol state after:

- causal forks;
- projection drift;
- missing or inaccessible evidence;
- abandoned leases;
- identity mismatch;
- protocol-version transition;
- imported legacy work.

Reconcile cannot rewrite GitHub history. It records the accepted interpretation and explicitly supersedes or invalidates claims.

High-risk reconciliation should require independent review or Product Owner authorization according to profile policy.

## 18. Deletion and editing policy

GitHub permits editing and deleting comments. ACP assumes an append-only logical log, so the binding must detect mutation.

Recommended policy:

- ACP comments must not be edited after posting;
- corrections use a new supersede or violation event;
- deletion is a protocol violation;
- projectors store or compare comment update timestamps and content digests;
- an edited event becomes invalid unless an explicit binding policy safely preserves prior versions.

GitHub alone does not expose a complete public edit history for all comment workflows. Strong append-only guarantees require external archival or a GitHub App in later phases.

## 19. GitHub limitations

Manual GitHub binding cannot guarantee:

- transactional claims;
- strict append-only comments;
- immediate notification delivery;
- immutable Issue bodies or labels;
- independent identity when accounts are shared;
- automatic lease expiry;
- automatic causal-fork detection;
- complete edit history;
- enforcement of profile permissions;
- consistency across repositories.

The binding must report these limitations rather than presenting GitHub as a distributed transaction system.

## 20. Manual pilot profile

The first pilot should use no automation.

Manual rules:

- one Issue per work item;
- ACP events posted as marked comments;
- humans/agents update projections manually after valid events;
- exact SHAs copied from GitHub tools, never memory;
- comment IDs copied from GitHub tools, never fabricated;
- no silent authorization of sensitive actions;
- Hermes review independent at the currently available identity-assurance level;
- Openclaw persists Git changes when Hermes lacks verified write access;
- Jorge explicitly authorizes merges and sensitive operations.

## 21. Pilot work-item mapping

Recommended pilot candidates after Core and Schema approval:

1. A low-risk documentation-only ACP work item.
2. A contained engineering work item with implementation, review, validation, and explicit merge authorization.

Do not retroactively convert R1/R2 history into ACP events. Legacy work may be referenced as evidence but not rewritten as if ACP governed it at the time.

## 22. Future automation layers

Only after successful manual pilots:

### Layer 1 — validation

- validate event envelopes;
- check catalogue/profile compatibility;
- flag invalid comments.

### Layer 2 — projection

- rebuild Issue body and labels;
- identify latest checkpoint;
- mark stale basis.

### Layer 3 — coordination warnings

- detect competing claims;
- detect expired leases;
- detect causal forks;
- detect stale reviews/checks.

### Layer 4 — controlled actions

- create draft PRs;
- request reviewers;
- post reminders;
- never automatically merge, deploy, migrate, or authorize sensitive actions by default.

## 23. Conformance requirements

A GitHub binding implementation is conforming only if it:

- preserves authored envelopes and observed metadata separately;
- uses stable GitHub comment IDs as event pointers;
- treats comments as append-only logically;
- validates exact SHA bases;
- distinguishes log from projection;
- detects or reports edits and deletions;
- records identity assurance;
- does not infer authorization from mutable UI state;
- does not count stale reviews or checks toward gates;
- documents all manual and automated limitations.

## 24. Open decisions

- exact envelope serialization inside Markdown comments;
- whether Issue Discussions can coexist with the ACP log without confusing parsers;
- whether to use one Issue or a Discussion category for program-level events;
- whether checkpoints should be pinned through Issue body links or bot-managed markers;
- how to archive comment content for append-only guarantees;
- how to represent cross-repository causal pointers;
- identity model for ChatGPT, Claude, Hermes, and Openclaw;
- whether GitHub App identities are required before automated enforcement;
- exact Project fields and labels for the Reformando profile;
- how to reconcile events posted while GitHub is partially unavailable.

## 25. Acceptance criteria for binding review

The draft is ready for implementability review when reviewers can answer:

- Can an agent reconstruct a work item from GitHub alone?
- Can a stale review be distinguished from a fresh review?
- Can simultaneous claims be detected?
- Can declared actor and observed identity be compared?
- Can a checkpoint reduce cold-start reading without hiding history?
- Can authorization be distinguished from ordinary GitHub approval UI?
- Can projection drift be detected?
- Are GitHub's append-only and transactional limitations stated honestly?
- Can the manual pilot operate without bots or Actions?
