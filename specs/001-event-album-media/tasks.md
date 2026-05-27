# Tasks: Event Album Media Sharing

**Input**: Design documents from `specs/001-event-album-media/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Tests**: Automated tests are required by the constitution for event creation, QR/link access, nickname assignment, upload, tagging, permissions, and moderation.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other tasks in the same phase
- **[Story]**: User story label for story phases only

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Next.js TypeScript application and shared tooling.

- [X] T001 Create Next.js App Router project files in `package.json`, `app/layout.tsx`, and `app/page.tsx`
- [X] T002 Configure TypeScript, linting, and formatting in `tsconfig.json`, `eslint.config.mjs`, and `prettier.config.mjs`
- [X] T003 [P] Configure Tailwind CSS and shadcn/ui base styles in `tailwind.config.ts`, `app/globals.css`, and `components.json`
- [X] T004 [P] Configure test runners in `vitest.config.ts`, `playwright.config.ts`, and `tests/setup.ts`
- [X] T005 [P] Add environment variable schema and sample values in `lib/config/env.ts` and `.env.example`
- [X] T006 Create base app navigation shells in `app/(organizer)/layout.tsx` and `app/a/[shareSlug]/layout.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared database, auth, storage, validation, and observability foundations required by all stories.

- [X] T007 Create initial Supabase migration for events, albums, share access, participants, nicknames, media, tags, and activity in `supabase/migrations/001_event_album_schema.sql`
- [X] T008 Add Row Level Security policies for organizer and QR/link guest access in `supabase/migrations/002_event_album_rls.sql`
- [X] T009 [P] Generate database type bindings in `lib/db/schema-types.ts`
- [X] T010 [P] Implement Supabase server/client helpers in `lib/db/supabase-server.ts` and `lib/db/supabase-browser.ts`
- [X] T011 [P] Implement organizer auth helpers in `lib/auth/organizer.ts`
- [X] T012 [P] Implement guest session helpers in `lib/auth/guest-session.ts`
- [X] T013 [P] Implement event, share, participant, media, tag, and activity query modules in `lib/db/queries/events.ts`, `lib/db/queries/share-access.ts`, `lib/db/queries/participants.ts`, `lib/db/queries/media.ts`, `lib/db/queries/tags.ts`, and `lib/db/queries/album-activity.ts`
- [X] T014 [P] Implement shared Zod validators in `lib/validation/event.ts`, `lib/validation/media.ts`, and `lib/validation/tag.ts`
- [X] T015 [P] Implement Cloudflare R2 client and signed upload utilities in `lib/media/r2.ts` and `lib/media/upload-intents.ts`
- [X] T016 [P] Implement activity logging helper in `lib/db/queries/album-activity.ts`
- [X] T017 Create route handler error and permission response helpers in `lib/http/errors.ts`
- [X] T018 Add seed data for local event types and test organizer in `supabase/seed.sql`

**Checkpoint**: Shared infrastructure exists; user story work can begin.

---

## Phase 3: User Story 1 - Create Event Album (Priority: P1) MVP

**Goal**: Organizers create typed events with event details, receive an event album, and get a QR/link that guests can open with an assigned nickname.

**Independent Test**: Create an event, confirm details and type are saved, confirm an album and QR/link exist, and open the share link to receive a nickname.

### Tests for User Story 1

- [X] T019 [P] [US1] Add contract tests for `POST /api/events`, `POST /api/events/{eventId}/share`, and `POST /api/share/{shareSlug}/join` in `tests/contract/event-share.contract.test.ts`
- [X] T020 [P] [US1] Add integration tests for event, album, share access, and nickname persistence in `tests/integration/event-creation.integration.test.ts`
- [X] T021 [P] [US1] Add Playwright test for organizer event creation and guest QR/link join in `tests/e2e/event-creation.spec.ts`
- [X] T022 [P] [US1] Add unit tests for event validation and nickname assignment in `tests/unit/event-validation.test.ts` and `tests/unit/nickname-assignment.test.ts`

### Implementation for User Story 1

- [X] T023 [P] [US1] Implement event creation form component in `components/event-form.tsx`
- [X] T024 [P] [US1] Implement QR/link share panel component in `components/qr-share-panel.tsx`
- [X] T025 [US1] Implement organizer new event page in `app/(organizer)/events/new/page.tsx`
- [X] T026 [US1] Implement organizer event detail page in `app/(organizer)/events/[eventId]/page.tsx`
- [X] T027 [US1] Implement `POST /api/events` route handler in `app/api/events/route.ts`
- [X] T028 [US1] Implement `POST /api/events/[eventId]/share` route handler in `app/api/events/[eventId]/share/route.ts`
- [X] T029 [US1] Implement QR/link guest landing page in `app/a/[shareSlug]/page.tsx`
- [X] T030 [US1] Implement `POST /api/share/[shareSlug]/join` route handler in `app/api/share/[shareSlug]/join/route.ts`
- [X] T031 [US1] Implement event-scoped nickname assignment in `lib/nicknames/assign.ts`
- [X] T032 [US1] Add event creation and nickname activity records in `lib/db/queries/album-activity.ts`

**Checkpoint**: P1 is demoable as an MVP.

---

## Phase 4: User Story 2 - Upload Media to Event Album (Priority: P2)

**Goal**: QR/link guests upload photos/videos to the event album, with progress, failure states, and nickname attribution.

**Independent Test**: Open a share link, upload supported media, confirm upload status, and view the media in the album attributed to the assigned nickname.

### Tests for User Story 2

- [ ] T033 [P] [US2] Add contract tests for `POST /api/upload-intents` and `POST /api/albums/{albumId}/media` in `tests/contract/media-upload.contract.test.ts`
- [ ] T034 [P] [US2] Add integration tests for upload intent, confirmation, media row, and activity logging in `tests/integration/media-upload.integration.test.ts`
- [ ] T035 [P] [US2] Add Playwright upload flow test with success and rejected file cases in `tests/e2e/media-upload.spec.ts`

### Implementation for User Story 2

- [ ] T036 [P] [US2] Implement upload dropzone component with per-file states in `components/upload-dropzone.tsx`
- [ ] T037 [P] [US2] Implement media grid component with nickname attribution in `components/media-grid.tsx`
- [ ] T038 [US2] Implement `POST /api/upload-intents` route handler in `app/api/upload-intents/route.ts`
- [ ] T039 [US2] Implement album media list and confirm-upload route handlers in `app/api/albums/[albumId]/media/route.ts`
- [ ] T040 [US2] Implement media variant URL helper in `lib/media/variants.ts`
- [ ] T041 [US2] Connect guest album page to upload and media grid in `app/a/[shareSlug]/page.tsx`
- [ ] T042 [US2] Add upload success/failure activity records in `lib/db/queries/album-activity.ts`

**Checkpoint**: Guests can contribute media independently after P1.

---

## Phase 5: User Story 3 - Tag Album Media (Priority: P3)

**Goal**: Participants add free-form and people tags, browse/filter by tag, and tag creators or organizers can remove tags.

**Independent Test**: Add text and people tags to a visible media item, filter album media by each tag, and remove a tag as its creator.

### Tests for User Story 3

- [ ] T043 [P] [US3] Add contract tests for `POST /api/media/{mediaId}/tags` and `DELETE /api/tags/{tagId}` in `tests/contract/tags.contract.test.ts`
- [ ] T044 [P] [US3] Add integration tests for tag normalization, duplicate prevention, and edit permissions in `tests/integration/tags.integration.test.ts`
- [ ] T045 [P] [US3] Add Playwright tag add/filter/remove flow in `tests/e2e/tags.spec.ts`

### Implementation for User Story 3

- [ ] T046 [P] [US3] Implement tag normalization utilities in `lib/tags/normalize.ts`
- [ ] T047 [P] [US3] Implement tag editor component in `components/tag-editor.tsx`
- [ ] T048 [US3] Implement `POST /api/media/[mediaId]/tags` route handler in `app/api/media/[mediaId]/tags/route.ts`
- [ ] T049 [US3] Implement `DELETE /api/tags/[tagId]` route handler in `app/api/tags/[tagId]/route.ts`
- [ ] T050 [US3] Add tag filter support to album media query in `lib/db/queries/media.ts`
- [ ] T051 [US3] Integrate tags into media grid and guest album page in `components/media-grid.tsx` and `app/a/[shareSlug]/page.tsx`
- [ ] T052 [US3] Add tag add/remove activity records in `lib/db/queries/album-activity.ts`

**Checkpoint**: Tags are usable independently after uploaded media exists.

---

## Phase 6: User Story 4 - Manage Album Participation and Visibility (Priority: P4)

**Goal**: Organizers manage QR/link access, participant visibility, media moderation, and tag moderation.

**Independent Test**: Regenerate or disable QR/link access, revoke participation, remove media or tags, and verify guests lose the correct actions.

### Tests for User Story 4

- [ ] T053 [P] [US4] Add integration tests for share access disable/regenerate and participant revocation in `tests/integration/organizer-controls.integration.test.ts`
- [ ] T054 [P] [US4] Add Playwright organizer moderation flow in `tests/e2e/organizer-controls.spec.ts`
- [ ] T055 [P] [US4] Add RLS regression tests for revoked guests and disabled share links in `tests/integration/rls-access.integration.test.ts`

### Implementation for User Story 4

- [ ] T056 [P] [US4] Implement organizer controls panel in `components/organizer-controls-panel.tsx`
- [ ] T057 [US4] Extend organizer event detail page with share, participant, media, and tag management in `app/(organizer)/events/[eventId]/page.tsx`
- [ ] T058 [US4] Implement share disable/regenerate actions in `app/api/events/[eventId]/share/route.ts`
- [ ] T059 [US4] Implement participant revocation query in `lib/db/queries/participants.ts`
- [ ] T060 [US4] Implement organizer media removal query and route behavior in `lib/db/queries/media.ts` and `app/api/albums/[albumId]/media/route.ts`
- [ ] T061 [US4] Add organizer tag removal behavior in `app/api/tags/[tagId]/route.ts`
- [ ] T062 [US4] Add permission-change and moderation activity records in `lib/db/queries/album-activity.ts`

**Checkpoint**: Organizers can control safety and visibility.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate the full product, harden privacy behavior, and prepare implementation handoff.

- [ ] T063 [P] Add accessibility checks for event form, share page, upload controls, and tag editor in `tests/e2e/accessibility.spec.ts`
- [ ] T064 [P] Add observability tests ensuring activity logs omit private media metadata in `tests/integration/activity-privacy.integration.test.ts`
- [ ] T065 [P] Document R2 bucket, Supabase RLS, and environment setup in `docs/deployment.md`
- [ ] T066 Run quickstart validation and record notes in `specs/001-event-album-media/quickstart.md`
- [ ] T067 Run full validation suite defined in `package.json` and record any unresolved failures in `specs/001-event-album-media/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories
- **US1 Create Event Album (Phase 3)**: Depends on Foundational
- **US2 Upload Media (Phase 4)**: Depends on US1
- **US3 Tag Album Media (Phase 5)**: Depends on US2
- **US4 Manage Participation and Visibility (Phase 6)**: Depends on US1; full moderation coverage depends on US2 and US3
- **Polish (Phase 7)**: Depends on selected stories being complete

### User Story Dependencies

- **US1**: Independent MVP
- **US2**: Requires event album and QR/link access from US1
- **US3**: Requires media items from US2
- **US4**: Can begin after US1 for QR/link controls; media/tag moderation portions require US2/US3

### Parallel Opportunities

- T003-T005 can run in parallel after T001-T002
- T009-T016 can run in parallel after T007-T008
- Test tasks within each user story can run in parallel
- Component tasks and route/query tasks within a user story can run in parallel when they touch different files

## Parallel Example: User Story 1

```bash
Task: "Add contract tests for event/share/join in tests/contract/event-share.contract.test.ts"
Task: "Add integration tests in tests/integration/event-creation.integration.test.ts"
Task: "Add Playwright test in tests/e2e/event-creation.spec.ts"
Task: "Implement event creation form in components/event-form.tsx"
Task: "Implement QR/link share panel in components/qr-share-panel.tsx"
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 for event creation, album creation, QR/link generation, and guest nickname assignment.
3. Validate P1 with unit, contract, integration, and Playwright tests.

### Incremental Delivery

1. Ship US1 as the organizer/guest entry flow.
2. Add US2 media uploads.
3. Add US3 tagging.
4. Add US4 organizer controls and moderation.
5. Run Phase 7 validation before production readiness.
