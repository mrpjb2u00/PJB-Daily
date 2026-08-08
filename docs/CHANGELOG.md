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
- Added the owner-only aggregate `public.owner_analytics_summary()` RPC migration.
- Documented that the owner analytics summary RPC is deployed and integrated into the mobile app.
- Added the aggregate owner analytics service.
- Replaced the owner analytics placeholder with users, to-dos, notes, and completion summary cards.
- Added manual owner analytics refresh with safe loading and error states.
- No individual user content is exposed in owner analytics.
- Added the `public.owner_analytics_trends(start_date date, end_date date, bucket text)` RPC for aggregate owner analytics trend buckets.
- Integrated the deployed owner analytics trends RPC into the owner dashboard with 7-day, 30-day, and 90-day range presets.
- Added dashboard trend views for New Users, New To-Dos, and Completed To-Dos.
- Added a local `delete-account` Supabase Edge Function for Phase 8.2 server-side account deletion.
- Added the client account deletion service and local account cleanup helper for Phase 8.2.
- Added the Profile Delete Account flow with warning copy, password re-entry, final confirmation, and confirmed-deletion local cleanup.
- Added production-safe Supabase public environment validation and a controlled startup configuration error screen.
- Added a names-only `.env.example` for required public Supabase configuration.

### Documented

- Phase 7.1 live database audit findings.
- Verified Supabase tables: `profiles`, `todos`, and `notes`.
- RLS ownership model for profiles, todos, and notes.
- Future hardening recommendations for grants, function execution, policy checks, profile constraints, and possible indexes.
- Phase 7 owner analytics principles.
- Phase 7.3 aggregate-only owner analytics RPC design and unsupported activity-telemetry metrics.
- Phase 7.4 owner analytics trends design: deployed RPC, `day`/`week`/`month` buckets, 366-day maximum inclusive range, zero-filled buckets, `last_completed_at` completion limitation, and no telemetry added.
- Phase 7.4B owner analytics trends client integration, including displayed v1 trend metrics and continued full RPC response normalization for future metrics.
- Phase 8.2 account deletion status: the Edge Function is deployed, disposable-user deletion and cascades were verified, client service, Profile UI, password confirmation, final confirmation, and local cleanup exist, owner self-deletion remains blocked, and final device/store-policy QA is still pending.
- Phase 8.3.1 production configuration status: placeholder Supabase config is blocked at startup, real values remain external/untracked, and EAS environment setup remains pending.

### Changed

- No application runtime behavior changed as part of this documentation sprint.
