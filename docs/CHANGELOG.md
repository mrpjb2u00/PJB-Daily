# Changelog

This changelog follows a Keep a Changelog-inspired structure. Dates and release versions should be added only when they are known.

## Unreleased

### Added

- Created the top-level documentation foundation under `docs/`.
- Added a master project reference.
- Added a database audit report for Phase 7.1.
- Added architecture, database schema, roadmap, changelog, and release checklist documents.
- Added a root README linking to project documentation.
- Added a private database role membership foundation for owner authorization.
- Added the authenticated `public.is_owner()` authorization RPC.
- Owner account assignment was completed manually outside the repository.
- Added authenticated owner-status loading through `public.is_owner()`.
- Added an owner-only navigation entry.
- Added an owner analytics placeholder route.
- No aggregate analytics or user-content access was added.
- Improved owner authorization refresh when the app returns to the foreground and when the owner route is opened.

### Documented

- Phase 7.1 live database audit findings.
- Verified Supabase tables: `profiles`, `todos`, and `notes`.
- RLS ownership model for profiles, todos, and notes.
- Future hardening recommendations for grants, function execution, policy checks, profile constraints, and possible indexes.
- Phase 7 owner analytics principles.

### Changed

- No application runtime behavior changed as part of this documentation sprint.
