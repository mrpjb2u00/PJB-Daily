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

Status: Next

Goal: add secure, database-driven owner authorization before any owner analytics dashboard or aggregate reporting is exposed.

Key principles:

- no hard-coded owner logic in the mobile app
- no service-role keys in the mobile app
- ordinary users must have no analytics access
- owner access must be verified server-side or database-side

## Upcoming

### Phase 7.3 - Analytics Foundation

Status: Planned

Goal: add aggregate-only analytics support while avoiding user-generated content exposure.

### Phase 7.4 - Owner Dashboard

Status: Planned

Goal: build the owner-only analytics dashboard after owner authorization and aggregate analytics queries are in place.

### Phase 8 - Production Release

Status: Planned

Goal: complete app-store readiness, final release QA, privacy disclosures, production builds, and post-release monitoring.

## Long-Term Candidates

- Account deletion and full data deletion flow
- Privacy-conscious crash reporting
- Additional owner analytics metrics
- Offline readiness planning
- Performance indexing when real query volume justifies it

