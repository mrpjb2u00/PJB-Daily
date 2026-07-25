# PJB Daily Visual Design System

## Source and status

This document defines the first durable visual-design foundation for PJB Daily. It was created from values already used successfully across the current application and should guide later cleanup work without changing behavior in Phase 5.1A.

## Purpose

The design tokens in `constants/design.ts` give the app shared names for common visual decisions. They are intended to make future UI polish safer, reduce hard-coded values, and keep screens visually consistent while preserving the current PJB Daily identity.

Phase 5.1A introduces tokens only. Existing screens should continue to render from their current styles until later adoption phases intentionally replace duplicated values.

## Naming conventions

Tokens use semantic names when a value has a clear product role, such as `screenHorizontal`, `cardPadding`, `primaryButtonHeight`, or `minTouchTarget`.

Numeric spacing values remain available for layout details where a semantic name would be too specific. Prefer semantic aliases for common screen, card, modal, and form layout.

## Colors

`constants/colors.ts` remains the source of truth for theme colors. The design-token module does not redefine the light or dark palette.

Use theme colors for all light/dark decisions:

- Backgrounds, surfaces, borders, text, destructive states, success states, shadows, completed states, and inputs should come from the active theme.
- To-Dos should continue to use the warm orange accent family.
- Notes should continue to use the teal accent family.
- New tokens should not replace or rename package identifiers, brand identifiers, or app configuration values.

## Typography

PJB Daily uses Inter as its app typeface. The typography tokens preserve the font families loaded in `app/_layout.tsx`:

- `regular`: `Inter_400Regular`
- `medium`: `Inter_500Medium`
- `semiBold`: `Inter_600SemiBold`
- `bold`: `Inter_700Bold`

Use large title roles for brand and screen identity, body roles for readable content, caption roles for supporting text, and overline roles for compact uppercase section labels.

## Spacing and layout

The spacing scale captures values already used throughout the app, including compact gaps, screen padding, card padding, modal padding, form gaps, bottom-tab spacing, and larger hero spacing.

Recommended defaults:

- Standard phone screen horizontal padding: `screenHorizontal`
- Wider or more editorial layouts: `screenHorizontalWide`
- Cards and grouped surfaces: `cardPadding`
- Modal interiors: `modalPadding`
- Form stacks: `formGap`
- Major vertical groups: `sectionGap`

Responsive layout should use the shared breakpoints for compact phones, large phones, tablets, and desktop-width web. Maximum content widths should keep forms, modals, and profile-style layouts readable on tablets and web.

## Surfaces and shape

The radii tokens preserve the current rounded, calm app style:

- Small controls use compact radii.
- Cards use `card` or `largeCard`.
- Larger panels use `panel`.
- Modals and sheets use `modal` or `sheet`.
- Pills and circular controls use `pill`.

Card, floating, and modal shadows should remain subtle. Elevation should support hierarchy without making the app feel heavy or three-dimensional.

## Controls and touch targets

Interactive controls should preserve existing behavior while moving toward consistent sizing in later phases.

Guidance:

- Use at least a 44px touch target for tappable controls.
- Primary actions should remain approximately 48px tall.
- Icon-only buttons should use shared icon-button dimensions or explicit `hitSlop`.
- Inputs should keep a comfortable minimum height and should not shrink below current readable sizing.
- The centered Add action and bottom tab dimensions should remain recognizable.

## Icons

The current icon libraries and native tab icon approach should remain in place. The design system standardizes icon sizes rather than changing icon identity.

Use smaller icon sizes for metadata, previews, and compact badges; medium and large sizes for row actions and headers; and larger sizes for empty states or brand moments.

## Accessibility

Later adoption work should use these tokens to improve accessibility without changing workflows:

- Maintain a minimum 44px touch target.
- Add labels and roles to icon-only controls.
- Keep text contrast readable in light and dark mode.
- Do not rely on color alone to communicate To-Do, Note, completed, selected, or disabled states.
- Check text scaling so labels, buttons, and compact cards do not clip.

## Responsive guidance

Use the breakpoints as practical layout thresholds:

- Compact phone: tighten gaps before reducing text clarity.
- Large phone: use standard spacing and comfortable controls.
- Tablet: cap content width for forms, modals, and list-heavy screens.
- Web: preserve native app proportions and avoid stretching controls across the full viewport.

Known web safe-area offsets are captured as layout tokens so later cleanup can remove repeated magic numbers without changing behavior.

## Patterns to preserve

The following visual patterns should remain unchanged unless a later phase explicitly approves a targeted adjustment:

- The Phase 4 Calendar month redesign and measured grid sizing.
- The PJB Daily header identity and greeting pattern.
- The centered Add action in the bottom navigation.
- Orange To-Do previews and teal Note previews.
- The warm neutral light theme and calm dark theme.
- The Daily Briefing modal style and animation behavior.
- The Create Modal flow and existing bottom-sheet behavior.
- Auth and Welcome brand presentation, including the current logo and tagline.

## Adoption rule

Do not broadly adopt tokens in Phase 5.1A. Future phases should migrate screens gradually in small commits, with TypeScript, ESLint, Metro startup, and light/dark manual checks after each step.
