# Sunroom CRM — Angular Frontend

A full-featured customer relationship management application built with Angular 21, Angular Material, and Chart.js. This is the Angular frontend for [Sunroom CRM](https://sunroomcrm.net), backed by a .NET 8 REST API with SQL Server.

## About Sunroom CRM

Sunroom CRM is a multi-frontend CRM platform designed to demonstrate the same business requirements implemented across multiple modern frameworks — all sharing a single .NET 8 REST API and SQL Server database. The project showcases how different frontend ecosystems approach the same real-world problems: authentication, CRUD operations, real-time data visualization, drag-and-drop workflows, role-based access control, and AI-powered features.

### The Full Stack

| Repository | Technology | Description |
|------------|------------|-------------|
| [sunroom-crm-dotnet](https://github.com/rvnminers-A-and-N/sunroom-crm-dotnet) | .NET 8, EF Core, SQL Server | Shared REST API with JWT auth, AI endpoints, and Docker support |
| **sunroom-crm-angular** (this repo) | Angular 21, Material, Vitest | Angular frontend with 100% test coverage |
| [sunroom-crm-react](https://github.com/rvnminers-A-and-N/sunroom-crm-react) | React, TypeScript | React frontend |
| [sunroom-crm-vue](https://github.com/rvnminers-A-and-N/sunroom-crm-vue) | Vue 3, TypeScript | Vue frontend |
| [sunroom-crm-blazor](https://github.com/rvnminers-A-and-N/sunroom-crm-blazor) | Blazor, .NET 8 | Blazor WebAssembly frontend |
| [sunroom-crm-laravel](https://github.com/rvnminers-A-and-N/sunroom-crm-laravel) | Laravel, PHP | Laravel full-stack implementation |

## Tech Stack

| Layer         | Technology                                    |
|---------------|-----------------------------------------------|
| Framework     | Angular 21 with standalone components         |
| UI            | Angular Material 21 + Angular CDK             |
| Charts        | Chart.js 4 via ng2-charts                     |
| State         | RxJS signals and observables                  |
| Unit Tests    | Vitest 4 + Testing Library + coverage-v8      |
| E2E Tests     | Playwright 1.59 (Chromium, Firefox, WebKit)   |
| CI/CD         | GitHub Actions                                |
| Language      | TypeScript 5.9                                |

## Features

- **Authentication** — JWT-based login and registration with route guards and token interceptor
- **Contacts** — Full CRUD with search, tag filtering, pagination, and sorting
- **Companies** — Company management with associated contacts and deals
- **Deals** — List view and Kanban-style pipeline board with CDK drag-and-drop between stages
- **Activities** — Activity log with timeline view linked to contacts and deals
- **Dashboard** — Overview with Chart.js visualizations for pipeline value, deals by stage, and recent activity
- **AI Features** — AI-powered natural language search, activity summarization, and deal insights
- **Admin Panel** — User management restricted to admin roles
- **Settings** — User profile editing and preferences
- **Responsive Layout** — Collapsible sidebar with mobile hamburger menu and adaptive navigation

## Getting Started

### Prerequisites

- Node.js 24+ (LTS)
- npm 11+
- The [.NET API](https://github.com/rvnminers-A-and-N/sunroom-crm-dotnet) running on `http://localhost:5236`

### Setup

```bash
git clone https://github.com/rvnminers-A-and-N/sunroom-crm-angular.git
cd sunroom-crm-angular
npm install
npm start
```

The dev server runs at `http://localhost:4200` and proxies API calls to the .NET backend.

### Running the API

The .NET API can be started via Docker Compose from the `sunroom-crm-dotnet` repo:

```bash
cd ../sunroom-crm-dotnet
cp .env.example .env   # Set SA_PASSWORD
docker compose up -d
```

## Available Scripts

| Command                  | Description                              |
|--------------------------|------------------------------------------|
| `npm start`              | Start the dev server on port 4200        |
| `npm run build`          | Production build to `dist/`              |
| `npm test`               | Run unit tests once                      |
| `npm run test:watch`     | Run unit tests in watch mode             |
| `npm run test:coverage`  | Run unit tests with coverage report      |
| `npm run test:e2e`       | Run Playwright end-to-end tests          |

## Testing

### Unit Tests

443 tests across 61 test suites at **100% code coverage** (statements, branches, functions, and lines). Coverage thresholds are enforced in `angular.json` — the build fails if any metric drops below 100%.

Tests use [Vitest](https://vitest.dev/) with Angular's native `@angular/build:unit-test` builder, [Testing Library](https://testing-library.com/docs/angular-testing-library/intro/) for component rendering, and `HttpTestingController` for service-level HTTP assertions.

```bash
npm run test:coverage
```

### End-to-End Tests

24 Playwright tests across 8 feature areas, run against Chromium, Firefox, and WebKit:

- **Authentication** — register, login, logout, invalid credentials, password mismatch validation, and unauthenticated redirect
- **Dashboard** — stat cards, pipeline chart, and recent activity list
- **Contacts** — create, edit, delete, and search filtering
- **Companies** — list display, create dialog, and detail page navigation
- **Deals Pipeline** — deal creation and CDK drag-and-drop between pipeline stages with persistence
- **Activities** — list page and create dialog with form fields
- **Navigation & Layout** — sidebar links, section routing, settings profile, AI panel, and unknown route redirect
- **Admin & Responsive** — admin route guard and sidebar collapse on narrow viewports

```bash
npm run test:e2e:install   # Install Chromium, Firefox, and WebKit (first time)
npm run test:e2e           # Run tests across all browsers
```

## CI/CD Pipeline

GitHub Actions runs two jobs on every push and pull request to `main`:

**Build, Lint, and Test** — Installs dependencies, runs the production build, and executes the full unit test suite with 100% coverage enforcement.

**Playwright E2E** — Clones the .NET API repo, spins up SQL Server and the API via Docker Compose, then runs the full Playwright suite against the live stack. Gated behind the `RUN_E2E` repository variable.

## Architecture

```
src/
  app/
    core/               # Singleton services, guards, interceptors, models
      guards/            # AuthGuard, RoleGuard (canActivate)
      interceptors/      # AuthInterceptor (JWT token injection)
      models/            # TypeScript interfaces for all domain entities
      services/          # ApiService, AuthService, and domain services
    features/            # Lazy-loaded standalone feature components
      activities/        # Activity log and timeline
      admin/             # User management (admin-only)
      ai/                # AI search, summaries, and deal insights
      auth/              # Login and registration forms
      companies/         # Company CRUD and detail views
      contacts/          # Contact CRUD, search, tag sync, and detail views
      dashboard/         # Charts and recent activity overview
      deals/             # Deal CRUD, list view, and pipeline Kanban board
      settings/          # User profile and preferences
    layout/              # App shell with responsive sidebar and toolbar
    shared/              # Reusable components, pipes, and directives
  testing/               # Test fixtures and MSW server setup
  environments/          # Environment configuration
e2e/                     # Playwright end-to-end test specs
.github/workflows/       # CI pipeline configuration
```

### Key Patterns

- **Standalone Components** — All components use Angular's standalone API with no NgModules
- **Lazy Loading** — Every feature route is lazy-loaded for optimized bundle size
- **Centralized HTTP** — All API calls flow through `ApiService`, which prepends the configured base URL and returns typed observables
- **JWT Interceptor** — `AuthInterceptor` reads the token from `localStorage` and attaches it to every outgoing request
- **Route Guards** — `AuthGuard` redirects unauthenticated users to login; `RoleGuard` restricts admin routes
- **Reactive State** — Components use Angular signals for local state and RxJS observables for async data streams
- **CDK Drag-and-Drop** — The deals pipeline uses `@angular/cdk/drag-drop` for Kanban-style stage transitions with API persistence
- **Testing Library** — Component tests render through Testing Library for user-centric assertions rather than implementation-detail testing

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
