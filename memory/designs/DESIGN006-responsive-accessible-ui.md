# DESIGN006 — Responsive & Accessible UI (Mobile-Friendly, Performance-First)

**Status**: Draft (PENDING)
**Author**: AI assistant (pair programmer)
**Date**: 2025-12-02

## Summary

Make the overlay UI responsive, accessible, and mobile-friendly while preserving desktop UX and minimizing performance impact on low-end devices.

This design covers: mobile viewport layout changes (compact HUD/bottom drawer), accessibility improvements (ARIA, focus trap), performance defaults and device detection (graphics quality), and CSS progressive-enhancements (safe areas, tap targets).

## Background & Motivation

- Current UI is composed of fixed, absolute-positioned panels overlaying a 3D Canvas. The design works on desktop, but it can overflow and overlap elements on mobile.
- Touch targets are sometimes smaller than recommended 44x44px which makes mobile interactions frustrating.
- Visual effects (bloom, shadows, particles) and large backdrops (`backdrop-filter`) are visually impressive but expensive; they should be tuned or disabled on lower-powered devices.
- Accessibility: currently some ARIA roles and labels are missing and modals don't trap focus; keyboard navigation is limited.
- Observations were made during a live dev server session and a screenshot capture.

## Goals & Scope

- Deliver a mobile-friendly HUD that does not overlap or hide the canvas.
- Provide a compact, accessible UX for small screens with touch-friendly controls.
- Introduce device-aware graphics defaults and a `Graphics Quality` setting that's user-changeable.
- Ensure keyboard-only and screen reader accessibility by adding ARIA semantics and focus management.
- Keep desktop UX intact; introduce features progressively and non-destructively.

## Non-Goals

- Replace the entire UI; only modify layouts and behaviors to be responsive and accessible.
- Implement a different rendering engine — performance changes are limited to configurable defaults and heuristics.

## Requirements (EARS style)

1. WHEN the page loads on a device where `window.innerWidth <= 768` OR `navigator.deviceMemory <= 2` OR `navigator.hardwareConcurrency <= 2`, THE SYSTEM SHALL disable or reduce expensive visual effects by default (bloom, shadows, particle density, complex post-processing).

**Acceptance:** UI settings show defaults reflecting detected device class; Canvas renders with reduced settings; unit tests assert settings on mocked low-power devices.

1. WHEN the screen width is <= 768px, THE SYSTEM SHALL render the Upgrades panel as a bottom-sheet drawer that can be toggled open/closed and show a compact "Quick Upgrades" row while closed.

**Acceptance:** Visual screenshot shows closed compact row; on open, the upgrade drawer does not overlap UI or Canvas critical areas.

1. WHEN a modal (Settings or Prestige) is shown, THE SYSTEM SHALL trap focus inside the modal and restore focus on close.

**Acceptance:** Keyboard users can tab only inside the modal; ESC closes it; focus is restored to the element that opened it.

1. WHEN a user performs an upgrade action (button press or keyboard shortcut), THE SYSTEM SHALL guarantee the tap/click area is >= 44x44 pixels by visual audit and tests.

**Acceptance:** Unit/Integration tests verify the bounding box area of upgrade buttons.

1. WHEN a user opens settings, THE SYSTEM SHALL present a "Graphics Quality" control (Auto / Low / Medium / High) that persists and updates rendering defaults.

**Acceptance:** Changing setting persists to store and changes bloom/shadows/particles.

1. WHEN the UI uses `backdrop-filter`, THE SYSTEM SHALL provide a graceful fallback for browsers that don't support it (e.g., Safari mobile) either a semi-opaque overlay or a lighter background color.

**Acceptance:** No blank overlay; tests verify background for Safari fallback.

1. WHEN the UI has dynamic live events (achievements), THE SYSTEM SHALL provide an aria-live region for screen-readers with brief messages.

**Acceptance:** Screen reader test shows messages being spoken (unit mock or integration verification).

## UX / Layout Specification

- Desktop (>= 1024px): unchanged—side panels remain on the left & right; score and stats at top; controls at the bottom-left; achievements bottom-right.
- Tablet (768px–1023px): move upgrades into a collapsible right panel (vertical) with a "compact row" for quick actions. Increase padding and make the upgrades scrollable.
- Mobile (<= 768px): upgrades become a bottom drawer with a 44px-high compact-row bar visible by default showing three quick-upgrades (damage, speed, ball). Pressing a quick upgrade opens the full drawer.
- The drawer will be a `position: fixed; bottom: 0; left: 0; right: 0;` sheet with `max-height: 60vh; overflow-y: auto;` and a handle (drag) to open/close on mobile. Add `aria-hidden` when closed.

- For small screens, move `Instructions` to a tooltip or a dedicated `Help` modal to reduce clutter.

- Add `min-width` / `min-height` checks to prevent UI from overlapping critical game content (e.g., ensure the active canvas view can be interacted with clearly).

## Accessibility (A11y)

- Add or validate ARIA attributes for all interactive elements: `aria-label`, `aria-controls`, `aria-pressed`, `role=region`, `aria-labelledby`, `aria-hidden` for panels not visible.
- Trap focus in modal dialogs—use a small, well-tested library `focus-trap` or `focus-trap-react` for reliability.
- Ensure keyboard access to the Quick Upgrades row, with ARIA commands and ability to use arrow keys to switch focus (optional: support ENTER/SPACE to activate).
- Add visible focus outline and ensure contrast meets WCAG 2.1 AA: buttons should use high contrast colors (e.g., ensure glow/shadow doesn't affect color accessibility).
- `aria-live` regions already exist for achievements - enhance usage to announce Prestige reward and other critical events.

## Performance / Device Detection

- Add heuristics to detect low-power: `deviceMemory` lower than or equal 2 or `hardwareConcurrency <= 2`, or `prefers-reduced-motion`, or small viewport width.
- Add `graphicsQuality` property to `GameSettings` enum with values: `auto | low | medium | high`. Default: `auto`.
- Based on `graphicsQuality` and the device measurement, set runtime flags in `buildInitialState` (e.g., `enableBloom`, `enableShadows`, `enableParticles` default to false for `low`). Use `LocalStorage` to persist user selection so it overrides auto defaults.
- Implement toggling in settings panel and persist via existing store's `toggleSetting` or add `setGraphicsQuality` action to the store.

## Data/Type Changes

- Extend `GameSettings` type in [src/store/types.ts] to include a `graphicsQuality` key:

```ts
export interface GameSettings {
  enableBloom: boolean;
  enableShadows: boolean;
  enableSound: boolean;
  enableParticles: boolean;
  enableFullRigidPhysics?: boolean;
  graphicsQuality?: 'auto' | 'low' | 'medium' | 'high';
}
```

- Add `setGraphicsQuality` to `GameActions` and implement state logic in `gameStore.ts`.
- Add `compactHudEnabled?: boolean` optional setting for users who want smaller HUD. Implement `toggleSetting('compactHudEnabled')` with a default based on screen size.

## Detailed Implementation Plan (Incremental)

Small steps with minimal risk: implement in 3-5 incremental PRs.

1. Step 1 — Branding & small CSS improvements (safe area, scroll, touch targets, focus outlines)
   - Files: `src/components/ui/UI.css`.
   - Outcome: panels are scrollable, safe-area only increases padding, min-height/touch targets for interactive elements.
   - Tests: visual check in mobile & tablet viewports.

1. Step 2 — Add settings & store defaults for `graphicsQuality` and device detection in `buildInitialState` (store)
   - Files: `src/store/gameStore.ts`, `src/store/types.ts`.
   - Outcome: settings default to low graphics on low-power devices; user can persist choices.

1. Step 3 — Add `Quick Upgrades` row & bottom drawer UI for mobile
   - Files: `src/components/ui/UpgradesPanel.tsx` + new `BottomDrawer.tsx` (or `MobileUpgrades.tsx`), style additions to `UI.css`.
   - Outcome: on narrow width, upgrades panel appears as a compact row and the full drawer is accessible.
   - Tests: screenshot tests for mobile breakpoints; ensure controls are complete and touch friendly.

1. Step 4 — Add focus management for `SettingsPanel` and `PrestigeModal`
   - Files: `src/components/ui/SettingsPanel.tsx`, `src/components/ui/PrestigeModal.tsx`.
   - Outcome: focus trap, restore focus on close, ESC to close; ensure accessibility audits pass.

1. Step 5 — E2E and unit tests for viewport behavior and ARIA
   - Files: `test/*` or `tests/e2e/*`, adjust existing tests or add new ones.
   - Outcome: All tests for the acceptance criteria pass.

1. Step 6 — Add a `Graphics Quality` drop-down in settings and tune Canvas defaults
   - Files: `SettingsPanel.tsx`, `GameScene.tsx`, `gameStore.ts`, optionally `FrameManager` for runtime toggles.
   - Outcome: Users can change Graphics Quality from Settings and it persists.

1. Step 7 — Performance improvements and telemetry (optional)
   - Examples: reduce `Bloom` intensity on `low`, reduce `shadow-map` size, disable `particles` or reduce count dynamically.

## Acceptance Checklist

- [ ] EARS requirements satisfied (items 1–7 above).
- [ ] Design doc added to `memory/designs` and linked from `DESIGN` index.
- [ ] `GameSettings` updated and defaults are device-aware (unit test).
- [ ] Key interactive elements have minimum 44x44 touch target (visual testing).
- [ ] Mobile Quick Upgrades row + Bottom drawer UI implemented and functional (visual & integration tests).
- [ ] Focus trap on modal dialogs (keyboard navigation tests & screen-reader test).
- [ ] Graphics Quality setting in Settings persists and toggles canvas features (unit/integration tests).

## Open Questions & Trade-offs

- Should the bottom drawer slide with a physics-based animation or a CSS transform? CSS transform is usually more performant and should avoid reflow.
- Which library (if any) for focus trapping? A small library like `focus-trap-react` is stable and widely used; an internal minimal implementation may be possible but more fragile.
- Should we allow "auto" to detect device performance dynamically at runtime? That means the runtime will need to adjust graphics without reload (some features like shadow map sizes may require reload or re-initialization). We propose `auto` sets defaults on load and users can change in settings.

## Security & Privacy Considerations

- Device detection uses browser-provided features (`navigator.deviceMemory`, `navigator.hardwareConcurrency`); we should not send this telemetry without explicit user consent. No new telemetry is introduced by default.

## Tests (suggested)

- Unit tests for `buildInitialState` defaults under mocked mobile and desktop environments.
- Integration tests verifying `graphicsQuality` influences `GameScene` Canvas props (e.g., bloom, shadows, particles shown/hidden via store flags).
- E2E tests in `e2e` for viewport widths: 320x800 (mobile), 768x1024 (tablet), 1366x768 (desktop): assert UI layout classes and drawer behavior.
- Accessibility tests: keyboard navigation & focus trapping (vitest + testing-library) and `axe`-based audits.

## Rollback Plan

- Roll back design-based CSS and store changes if we introduce layout breaks; the changes are backwards-compatible and incremental; revert to `main` if critical issues are discovered.

## Migration / Incremental Deployment Plan

- Start with low-risk CSS & small store changes, then progressively add UI components (bottom drawer) and tests.
- Create one PR per step above; ensure `npm run lint` and `npm run test` pass on all PRs.

## Notes & Links

- Related files modified during initial review:
  - `src/components/ui/UI.css` (safe area, scroll, touch targets, reduced motion)
  - `src/components/ui/ScorePanel.tsx` (aria-labels, attributes)
  - `src/components/ui/StatsPanel.tsx`
  - `src/components/ui/UpgradesPanel.tsx` (aria-labels for upgrade buttons)
  - `src/components/ui/AchievementsPanel.tsx`
  - `src/components/ui/Controls.tsx`
  - `src/components/ui/SettingsPanel.tsx`, `src/components/ui/PrestigeModal.tsx` (aria-modal)

  - Proposed new components: `MobileUpgradesDrawer.tsx` or `BottomDrawer.tsx`, `QuickUpgradesRow.tsx`

## Next Steps (recommended)

1. Implement Step 1 (safe area, scroll, accessibility hotfixes) — this is already partially implemented in the CSS changes from the initial PR.
2. Create a store task and a small POC for `graphicsQuality` detection and default settings.
3. Create a mobile bottom drawer POC with a small separate PR.
4. Add focus trap library and write integration tests for modals.
5. Add e2e tests for different viewports.

## Implementation Notes (update)

- Added `MobileUpgrades` bottom-sheet drawer with pointer-based drag-to-close behavior, a visible handle, and CSS variable-driven transform to avoid inline styles.
- Added keyboard activation (Enter/Space) and Escape key support to close the drawer for accessibility.
- Added E2E-style tests and unit tests: `src/test/mobileUpgrades.drag.test.tsx`, `tests/e2e/mobile-drawer.spec.tsx`.
- Added CSS rules to `UI.css` to support safe-area insets, touch targets, and motion-reduced transitions.

-- End Design
