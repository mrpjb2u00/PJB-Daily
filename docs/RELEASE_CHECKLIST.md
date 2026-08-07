# PJB Daily Release Checklist

Initial checklist for preparing PJB Daily for Apple App Store and Google Play release.

## Code Quality

- [ ] TypeScript passes with zero errors.
- [ ] ESLint passes with no unexpected warnings.
- [ ] No unintended file changes are present.
- [ ] Error boundary behavior is verified in production-like mode.
- [ ] Build scripts are documented.
- [ ] Known Expo package compatibility advisories are reviewed.

## Environment Configuration

- [ ] Production Supabase URL is configured through approved environment management.
- [ ] Production Supabase anon key is configured through approved environment management.
- [ ] No service-role key exists in the mobile app.
- [ ] `.env` files are ignored by Git.
- [ ] EAS project identifiers are verified.
- [ ] Android package and iOS bundle identifiers are verified.

## Authentication

- [ ] Sign up works.
- [ ] Sign in works.
- [ ] Sign out works.
- [ ] Password reset works.
- [ ] Email confirmation behavior is tested if enabled.
- [ ] Profile creation trigger is verified in production.
- [ ] Existing users can sign in after profile migration.

## Database Security

- [ ] RLS is enabled on application tables.
- [ ] Policies are reviewed for profiles, todos, and notes.
- [ ] Owner authorization is implemented before owner analytics.
- [ ] Owner analytics returns aggregate metrics only.
- [ ] Grants are reviewed for unnecessary privileges.
- [ ] Trigger function execute privileges are reviewed.
- [ ] Account deletion strategy is defined.
- [x] Account deletion Edge Function is deployed with server-side secrets only.
- [x] Disposable account deletion and database cascades are verified.
- [x] Account deletion Profile UI, password re-entry, final confirmation, and route-to-auth cleanup are implemented.
- [ ] Account deletion is verified on production-like phone and tablet builds.

## Privacy And Compliance

- [ ] Privacy Policy is current.
- [ ] Google Play Data Safety form is current.
- [ ] App Store Privacy labels are current.
- [ ] Account deletion and data deletion behavior are reflected in store privacy disclosures.
- [ ] Analytics collection is disclosed before release.
- [ ] Crash reporting collection is disclosed before release, if added.
- [ ] User-generated task/note content is not included in analytics.

## Accessibility

- [ ] Screen reader labels are verified on core controls.
- [ ] Touch targets are comfortable on phone devices.
- [ ] Light and dark mode contrast is reviewed.
- [ ] Loading and feedback states are understandable.
- [ ] Keyboard behavior is verified on forms and editors.

## Device Testing

- [ ] Android phone portrait.
- [ ] Android phone landscape where supported.
- [ ] iPhone portrait.
- [ ] iPhone landscape where supported.
- [ ] iPad/tablet layout where supported.
- [ ] React Native Web smoke test, if web is part of the release target.
- [ ] Calendar month boundaries.
- [ ] Recurring task scenarios.
- [ ] Daily Briefing once-per-day behavior.

## Store Assets

- [ ] App icon is final.
- [ ] Adaptive Android icon is final.
- [ ] Splash screen is final.
- [ ] Screenshots are current.
- [ ] Store listing copy is current.
- [ ] Support contact is current.
- [ ] Privacy Policy URL is available.

## Builds

- [ ] Android internal test build succeeds.
- [ ] Android production build succeeds.
- [ ] iOS build succeeds if iOS release is planned.
- [ ] Version number is correct.
- [ ] Build numbers/version codes are correct.
- [ ] Signing credentials are verified.

## Post-Release Monitoring

- [ ] Crash reporting plan is defined.
- [ ] Support workflow is defined.
- [ ] Rollback plan is defined.
- [ ] Database backup plan is defined.
- [ ] Owner analytics access is restricted.
- [ ] Release notes are prepared.
