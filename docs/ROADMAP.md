# PJB Daily Roadmap

This roadmap tracks high-level project phases. It intentionally avoids invented dates.

## Completed

### Phase 6 - Daily Briefing And UX Polish

Status: Complete

Completed work includes the Daily Briefing experience, Daily Briefing refinements, responsive UI polish, tablet landing screen refinement, calendar improvements, and broad UX/accessibility polish.

### Phase 7.1 - Database Audit

Status: Complete

The live Supabase database was inspected through read-only Phase 7.1 audit findings. The database foundation is ready for owner analytics work beginning with owner authorization.

## Next

### Phase 7.2 - Owner Authorization

Status: In Progress

Goal: add secure, database-driven owner authorization before any owner analytics dashboard or aggregate reporting is exposed.

Key principles:

- no hard-coded owner logic in the mobile app
- no service-role keys in the mobile app
- ordinary users must have no analytics access
- owner access must be verified server-side or database-side

Progress:

- Database authorization foundation: complete.
- Owner account assignment: complete.
- Client authorization integration: complete.
- Owner route gate and placeholder: complete.
- Aggregate analytics implementation: pending.

## Upcoming

### Phase 7.3 - Analytics Foundation

Status: In Progress

Goal: add aggregate-only analytics support while avoiding user-generated content exposure.

Progress:

- Owner analytics summary RPC: deployed.
- Client analytics service: complete.
- First owner analytics dashboard: complete.
- Active-user, platform, app-version, login, and Daily Briefing engagement analytics: pending future activity telemetry design.

### Phase 7.4 - Owner Dashboard

Status: Planned

Goal: build the owner-only analytics dashboard after owner authorization and aggregate analytics queries are in place.

Phase 7.4 progress:

- Owner analytics trends RPC: deployed.
- Client trend integration: complete.
- Supported trend buckets: `day`, `week`, and `month`.
- Maximum inclusive trend range: 366 days.
- Trend buckets are zero-filled.
- First dashboard trend metrics: New Users, New To-Dos, and Completed To-Dos.
- `completed_todos` uses `last_completed_at` and cannot represent historical repeated completion events.
- No telemetry was added.

### Phase 8 - Production Release

Status: Planned

Goal: complete app-store readiness, final release QA, privacy disclosures, production builds, and post-release monitoring.

Phase 8.2 account and data lifecycle progress:

- Server-side `delete-account` Edge Function exists locally.
- The function is deployed.
- A disposable non-owner deletion test verified auth deletion and cascades for profile, to-do, note, and app-role rows.
- The function deletes only the authenticated caller and blocks owner self-deletion.
- Existing database cascades handle profile, to-do, note, and app-role cleanup after auth user deletion.
- Client deletion service and local cleanup helper exist.
- Profile Delete Account UI, password re-entry, final confirmation, and route-to-auth cleanup are implemented.
- Store-policy validation and final real-device account deletion QA remain pending.

## Long-Term Candidates

- Account deletion and full data deletion flow
- Privacy-conscious crash reporting
- Additional owner analytics metrics
- Offline readiness planning
- Performance indexing when real query volume justifies it
