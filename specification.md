# MTGit software specification

Version 0.1.0

Author: Tomáš Jaroň

## Summary

Web application deck editor for the collectable card game Magic, the Gathering. The project is inspired by git branching
principles. Tracks multiple variants of the same deck and allows for their quick comparison and history tracking.

Contents

1. Basic information
   ....................................................................................................................1  
   1.1 Description and scope
   ...............................................................................................................1  
   1.2 Technologies used
   ...................................................................................................................1  
   1.3 References
   ...............................................................................................................................1  
   1.4 Document conventions
   ..............................................................................................................1
2. Short description of the software
   ............................................................................................2  
   2.1 Motivation, components and goals
   ..........................................................................................2  
   2.2 Main features
   ..........................................................................................................................3  
   2.3 Motivating usage example
   ......................................................................................................3  
   2.4 Target environment
   ..................................................................................................................3  
   2.5 Constraints
   ..............................................................................................................................3  
   2.6 Documentation deliverables
   ....................................................................................................3
3. External interfaces
   ..................................................................................................................4  
   3.1 User interface, inputs and outputs
   ..........................................................................................4  
   3.2 Hardware interfaces
   .................................................................................................................4  
   3.3 Software interfaces
   ..................................................................................................................4  
   3.4 Communication interfaces
   ......................................................................................................4
4. Detailed functionality description
   ..........................................................................................5  
   4.1 Authentication & user management
   .........................................................................................5  
   4.2 API (tRPC) endpoints
   ..............................................................................................................5  
   4.3 Frontend views and state sync
   ...............................................................................................6  
   4.n Additional features
   .................................................................................................................6
5. Screens / Views
   .....................................................................................................................7  
   5.1 Frontend — Home
   ....................................................................................................................7  
   5.2 Frontend — Auth (Login / Register)
   ........................................................................................7  
   5.3 Frontend — Dashboard / App main view
   ..................................................................................7
6. Non‑functional requirements
   ...................................................................................................8  
   6.1 Performance requirements
   .....................................................................................................8  
   6.2 Safety and usage risks
   ............................................................................................................8  
   6.3 Data security requirements
   ....................................................................................................8  
   6.4 Extensibility and integrability requirements
   ...........................................................................9
7. Other requirements
   .................................................................................................................9
8. Out‑of‑scope (negative specification)
   .....................................................................................9
9. Time‑line & Milestones
   ..........................................................................................................10
10. Notes
    ....................................................................................................................................11

## Basic Information

### Description

<Popište krátce specifikovaný software. Krátce zdůvodněte, proč jste se rozhodli ho implementovat, uveďte, co přinese
nového, na jakou cílovou skupinu je zaměřen. Pokud existují alternativy, uveďte je a zdůvodněte, v čem se vaše řešení
bude odlišovat>

### Technologies used

#### Shared

- [Typescript](https://www.typescriptlang.org/)
- [Zod](https://zod.dev/) schema validation
- [Trpc](https://trpc.io/) frontend-backend communication
- [EsLint](https://eslint.org/)

#### Frontend

- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [Mantine](https://mantine.dev) UI framework
- [Tanstack Query](https://tanstack.com)

#### Backend

- [Express](https://expressjs.com/) backend base
- [Mongo](https://www.mongodb.com/) database

## Short description of the software

### Motivation

Industry standard Magic the Gathering (MTG from now on) deck editors make it hard to track multiple versions of the same
deck concurrently.

### Motivational use-cases

I am working on a deck and am trying to make experimental updates while rollbacking changes which prove to be
detrimental.

I also want to keep a separate pile of cards which have proven themselves to work well, but are not in the current
version of the deck. They might come in handy later in the deck creation process.

I would like to keep a separate version which contains cards which have been teased, but are not released yet.

I would like to track the version of the deck I am aspiring to compared to the version I currently own in real life, as
I don't own all the needed cards yet.

### Main Features

- deck repository and branch CRUD
- comparison between branches
- deck history viewing
- standard mtg deck info display
    - card count in the deck
    - mana curve analysis
    - colors analysis
    - grouping cards by tags
    - estimated deck cost
- deck import & export

[//]: # (TODO zmínit reliance na scryfallu včetně jejich dumpu karet)

### Runtime

The frontend & backend will be deployed at render.com and the database will be deployed using mongo atlas. The app
should work on any reasonably sized device with a reasonably up-to-date browser.

## Functionalities

### Login & register screens

### Listing out all of user's repositories & creating new

### Deck Displaying
The grouping and the ordering inside the group can be toggled using the UI.

#### Grouping
The following grouping modes will be offered:

- mana value
- color
- tags
- main card type (Artifact, Creature etc.)
- no grouping

#### Ordering
Supports sorting by name, price (in USD) and mana value.

#### Text mode & Image mode
Allows viewing the cards either by text names or by their card image. 

### Basic deck data analysis

- mana curve plot
- deck card counts checking
- pie chart for color production & consumption

### Card tagging

Each card in a repository may possess any amount of user-defined tags. User may

## Scryfall card search

Cards can be searched in the app through the standard scryfall syntax. Searched cards can be added to the deck. This
will be done by querying [scryfall API](https://scryfall.com/docs/api).

### Default search query

User may choose a suffix they add at the end of each query. Can be used for commander color identity enforcement, for
budget restrictions, default ordering etc. Mostly there to save a lot of typing of the same query parts over and over
again.

### Card filtering

A user may choose to filter the cards in their deck by a scryfall search query. This will be done on the frontend
without using the scryfall API and thus may not support all the scryfall query features.

### Basic branch management

Branch CRUD.

### Branch switching

### Comparing two branches

A user may choose to compare the contents of two of their branches. They may either choose to show only the differences
or show the whole deck lists. Either way, they will be displayed side by side while allowing for grouping similar to the
standard deck viewing screen.

There is always one branch selected for editing and the other selected for comparison.

In the comparison screen, a user may tweak the amount of each card displayed on the screen. This edits the amounts saved
in the edited branch.

### Branch History

A user may view the edits history of the currently selected branch.

Any point in time of the history branch may be used to enter comparison screen with the current version of the deck.


### Deck Import
Will support mtgo and mtga deck formats as well as moxfield bulk edit format, which includes tags as well.

[//]: # (TODO add MTGO and MTGA into terms appendix)

### Deck Export
Deck may be exported in MTGO or MTGA format. In both cases, it is copied into clipboard.

3.1 User interface, inputs and outputs Frontend exposes web UI (served by Vite in dev, static build in production).
Primary inputs:

- User interactions (forms, navigation).
- Authentication credentials (login/register).  
  Primary outputs:
- Rendered pages and JSON from API endpoints.
- API responses for tRPC endpoints consumed by frontend.

3.2 Hardware interfaces No dedicated hardware interfaces. Standard web hosting and database connectivity are required.

3.3 Software interfaces

- MongoDB: data persistence via connection string (MONGODB_URI).
- Shared package (s) (@mtgit/shared): types and utilities imported by frontend and API.
- tRPC: type-safe RPC between frontend and backend.
- Express: HTTP layer exposing health and API endpoints.  
  Describe data passed: typical JSON payloads for API, including authentication tokens/cookies for session management.

3.4 Communication interfaces

- HTTP (S) for frontend <-> API communication.
- tRPC protocol over HTTP endpoints for RPC-style calls.
- Authentication likely via secure cookies (cookie-parser) or tokens (details TBD).
- Recommended: enforce HTTPS in production, secure cookie flags, and standard CORS policies.

4. Detailed functionality description This section enumerates the important functions and expected behavior, including
   error handling.

4.1 Authentication & user management Purpose: register, login, authenticate users, and manage sessions.  
Inputs: registration payload (email, password), login payload (email, password).  
Processing: password hashing (argon2), session cookie creation/validation, user document storage in MongoDB.  
Outputs: success/failure responses, auth cookie or token.  
Error states: invalid credentials (401), duplicate user (409), database unavailable (503). Provide clear messages and
safe logging practices (no plaintext passwords).

4.2 API (tRPC) endpoints

- Health check: GET /health -> 200 OK when server and DB reachable.
- tRPC endpoint: POST /trpc/* -> handles RPC calls described in shared router types.  
  Expected behavior: type-safe request validation via shared types; consistent error shape for client.  
  Error handling: validation errors (400), auth required (401), unexpected server error (500).

4.3 Frontend views and state sync Frontend interacts with tRPC endpoints for data and uses shared types for compile-time
safety. Synchronization: optimistic UI updates where appropriate, and fallback to server truth on conflicts. Error
displays for user-facing failures (network, validation).

4.n Additional features

- Shared utilities: logging adapter, environment config loader, tests scaffolding (TBD).
- Static asset handling and build outputs for production deployment.

5. Screens / Views Sketches and brief descriptions for key screens.

5.1 Frontend — Home Description: Landing page showing project name, quick links (login/register), and status indicator
for API health (reads /health).

5.2 Frontend — Auth (Login / Register)
Description: Forms for user registration and login. Basic client-side validation; calls to tRPC or REST endpoints;
displays success/failure messages.

5.3 Frontend — Dashboard / App main view Description: Primary application view after login, shows user data, navigation
to app features, and a sign-out action.

6. Non‑functional requirements

6.1 Performance requirements

- Dev mode should provide fast hot reloads (sub-2s edits for small components expected).
- API latency targets: p95 under network overhead should remain acceptable for interactive usage (<200ms on local
  network) — adjustable based on hosting.

6.2 Safety and usage risks

- No industrial/physical control interactions — low physical risk.
- Data loss risk if database credentials are mishandled; backups and environment safety measures recommended.

6.3 Data security requirements

- Use secure storage for credentials (e.g., environment variables, secrets manager).
- Passwords must be hashed with argon2; no plaintext storage.
- Use secure cookie flags (HttpOnly, Secure, SameSite) for session cookies.
- Enforce TLS for production traffic.
- Limit sensitive logs; avoid logging credentials.

6.4 Extensibility and integrability requirements

- Shared package pattern must allow adding new packages with minimal friction.
- API should expose clear extension points (additional routers in tRPC).
- CI/CD pipelines should support workspace-aware builds and selective publishing for packages.

7. Other requirements

- Code style and linting: ESLint + shared configs, enforce with pre-commit or CI.
- Type checking: enable and run TypeScript checks as part of CI (npm run typecheck).
- Dependency updates: periodic dependency review to avoid vulnerabilities.

8. Out‑of‑scope (negative specification)

- Production deployment automation (CI/CD scripts are not included by default).
- Full production-ready monitoring, logging, or autoscaling setups.
- Advanced payment/subscription features or integrations not indicated in repository.

9. Time‑line & Milestones Suggested milestone plan (examples; adjust to team availability). Typical cadence ~1 month per
   milestone with buffer.

| Date       | Milestone                                                                                           | Presentation                                                      |
|------------|-----------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| 2026-08-29 | Dev environment & workspace stabilization: npm install, env examples, run dev for frontend/api      | Demo: local dev run + commit with README improvements             |
| 2026-09-29 | Authentication: register/login, hashed passwords, session cookie support, basic user model          | Demo: login/register flows + commit with tests for auth endpoints |
| 2026-10-29 | Core API features & frontend integration: implement essential tRPC routes and sample frontend calls | Demo: integrated feature demo + PR with code and docs             |
| 2026-11-29 | Tests & CI: unit tests, basic integration tests, typecheck in CI                                    | Presentation: CI build status + test report                       |
| 2026-12-15 | Production readiness: build scripts, environment hardening, deployment checklist                    | Demo: production build and deployment notes in README             |

10. Notes This specification is inspired by standard SRS templates (e.g., Karl E. Wiegers) and SAFE™ Development System
    Requirements. Specific implementation details and missing decisions are listed below.

Addendum A: Definitions

- tRPC: type-safe remote procedure call layer for TypeScript.
- Workspace: npm workspaces enabling multiple packages within a repo.
- Shared package: package used by multiple apps (e.g., @mtgit/shared).

Addendum B: To Be Determined List

- Exact authentication token/session strategy (JWT vs server/session cookie) — decide before full auth implementation.
- Node engine version to pin in package.json.
- Complete list of tRPC RPC methods and payload shapes — add after API design session.
- Tests scope and test frameworks (Jest, Vitest, etc.).

End of document.
