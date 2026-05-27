# Code Architecture Graph

## Runtime Architecture

```mermaid
flowchart TD
    Browser[Mobile/Desktop Browser]
    NextApp[Next.js App Router]
    ServerActions[Server Actions and Route Handlers]
    SupabaseAuth[Supabase Auth]
    Postgres[Supabase Postgres with RLS]
    R2[Cloudflare R2 Originals]
    Images[Cloudflare Images/Variants]

    Browser --> NextApp
    NextApp --> ServerActions
    ServerActions --> SupabaseAuth
    ServerActions --> Postgres
    ServerActions --> R2
    R2 --> Images
    Images --> Browser
    Postgres --> NextApp
```

## Code Module Graph

```mermaid
flowchart LR
    Routes[app routes]
    Components[components]
    Auth[lib/auth]
    DB[lib/db]
    Media[lib/media]
    Nicknames[lib/nicknames]
    Tags[lib/tags]
    Validation[lib/validation]
    Tests[tests]

    Routes --> Components
    Routes --> Auth
    Routes --> DB
    Routes --> Media
    Routes --> Nicknames
    Routes --> Tags
    Routes --> Validation

    Components --> Validation
    Components --> Media
    Components --> Tags

    Nicknames --> DB
    Tags --> DB
    Media --> DB
    Media --> R2Client[R2 client]
    Auth --> SupabaseClient[Supabase client]
    DB --> SupabaseClient

    Tests --> Routes
    Tests --> Auth
    Tests --> Nicknames
    Tests --> Tags
    Tests --> Media
```

## First Implementation Slice

```mermaid
flowchart TD
    EventForm[components/event-form.tsx]
    CreateEventRoute[app/api/events/route.ts]
    EventValidation[lib/validation/event.ts]
    EventQueries[lib/db/queries/events.ts]
    ShareQueries[lib/db/queries/share-access.ts]
    QRPanel[components/qr-share-panel.tsx]
    EventPage[app/(organizer)/events/[eventId]/page.tsx]

    EventForm --> CreateEventRoute
    CreateEventRoute --> EventValidation
    CreateEventRoute --> EventQueries
    CreateEventRoute --> ShareQueries
    EventQueries --> EventPage
    ShareQueries --> QRPanel
    EventPage --> QRPanel
```
