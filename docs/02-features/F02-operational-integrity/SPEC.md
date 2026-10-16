# Operational integrity and audit remediation

Scope: the 31 findings in `docs/reviews/2026-10-15-project-audit.md`.

Preserve existing visual classes, colors and layouts. Replace local-only business commands with authenticated APIs. PostgreSQL is authoritative for sessions, orders, tickets, bills and payments. Local storage is a tenant-scoped cache or an explicitly unsynchronized draft, never proof of payment or external delivery.

## Contracts

- Staff JWT identifies a currently active account; backend derives role and tenant from the account on every request. Customer JWT is restricted to one active table session.
- Only server-persisted events reach authenticated tenant or session rooms. Reconnect rejoins authorized rooms and reloads a snapshot.
- Order prices, options, availability, stock, discounts and tax are validated on the server. Every state-changing financial/order command uses a durable idempotency key scoped to actor, tenant and operation.
- Opening a table, approving orders, changing items and settling a bill are transactional. An active table has at most one active session. Paid bills and historical items are retained.
- Public API DTOs never contain PIN hashes, QR secrets, account credentials or unrelated table data.
- Auxiliary editing documents are tenant-scoped, versioned and protected by role; external actions remain unavailable until a real provider is configured.
- POS, KDS and menu views start empty and render only authenticated server snapshots. An empty response clears the prior view; a failed refresh retains the last confirmed snapshot and reports the connection problem once instead of showing demo tables, tickets or prices as live data.

## Verification

Automated regression coverage must include anonymous access, cross-tenant access, customer session expiration, forged socket messages, invalid prices/quantities, retry/concurrent idempotency, table-open races, cancellation totals, payment retries, persisted snapshots, publishing versions, menu round trips and report/date/export consistency. Build shared before consumers. Run clean build, lint and tests; inspect UI class changes separately.

Database changes use additive migrations and an isolated test schema before applying to the application schema. Preserve local environment files while removing them from version control. Credential rotation outside this repository remains an operational action and must not be claimed as completed without verification.
