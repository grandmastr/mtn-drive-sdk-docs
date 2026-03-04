---
title: RN SDK Docs Writing Style (Internal)
---

This guide defines the required structure for RN SDK docs pages, including the beginner-first onboarding rules.

## Page pattern

All RN docs pages must include:

1. H1 title from frontmatter
2. One-sentence outcome-oriented subtitle
3. A setup-context section near the top:
   either `## Prerequisites` or `## Before You Start`

Setup and onboarding pages must use a numbered flow:

1. `## 1) Install`
2. `## 2) Configure`
3. `## 3) Initialize`
4. `## 4) Verify`
5. A first-success action before the final next steps

Every onboarding page must include at least one “How to verify this worked” checkpoint.

Dense technical pages must include either:

- `## Do I need this page?`, or
- `## Advanced page` plus a “Use this page when…” explanation

## Method page template (mandatory)

Each method section must include all blocks in this exact order:

1. `### \`module.method(args)\``
2. `#### What this method does`
3. `#### When to call it`
4. `#### Signature`
5. `#### Request fields`
6. `#### Response fields`
7. `#### Errors and handling`
8. `#### Minimal example`

## Field table rules

Request fields table columns:

- `Field`
- `Type`
- `Required`
- `Default`
- `Format/Constraints`
- `Meaning`

Response fields table columns:

- `Field`
- `Type`
- `Required/Conditional`
- `Format/Constraints`
- `Meaning`

## Language guardrails

- Write for external app developers.
- Focus on SDK behavior and SDK contracts.
- Do not describe backend endpoint contracts.
- Do not use backend ownership language.
- Prefer named request/response types over generic object signatures.
- Explain concepts before signatures on beginner-facing pages.
- Label low-level pages as advanced when they are not the default path.
- Verify release metadata before hardcoding version numbers.

## Error guidance rules

Each method must list likely SDK errors and direct app behavior.

## Example rules

- Keep one minimal runnable example per method.
- Include `try/catch` in every method example.
- Use signatures and argument shapes that match public exports.
