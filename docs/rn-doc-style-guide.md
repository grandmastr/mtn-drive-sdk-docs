---
title: RN SDK Docs Writing Style (Internal)
---

This guide defines the required Sentry-style structure for RN SDK docs pages.

## Sentry-style page pattern

All RN docs pages must include:

1. H1 title from frontmatter
2. One-sentence outcome-oriented subtitle
3. `## Prerequisites` section near top

Setup and onboarding pages must use numbered H2 flow:

1. `## 1) Install`
2. `## 2) Configure`
3. `## 3) Initialize`
4. `## 4) Verify`
5. `## 5) Next steps`

Optional sections must include `(Optional)` in the heading label.

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

## Error guidance rules

Each method must list likely SDK errors and direct app behavior.

## Example rules

- Keep one minimal runnable example per method.
- Include `try/catch` in every method example.
- Use signatures and argument shapes that match public exports.
