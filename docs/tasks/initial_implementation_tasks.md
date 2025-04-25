# AstroTracker - Initial Implementation Tasks

This document breaks down the implementation tasks for the AstroTracker project based on the Product Review Document (`docs/planning/product_review.md`). Tasks are sequenced logically, starting with foundational setup and progressing through core features.

**Note:** This is an initial breakdown. Tasks may be further refined, parallelized, or re-ordered as development progresses.

## Phase 1: Foundation & Setup (Backend)

1.  **Project Structure & Poetry Setup:**
    *   Initialize backend project directory (`/api` or similar).
    *   Set up `pyproject.toml` using Poetry.
    *   Add initial dependencies (`fastapi`, `uvicorn`, `python-dotenv`).
    *   Configure basic linting/formatting (e.g., `ruff`, `black`).
2.  **Basic FastAPI Application:**
    *   Create main application instance (`main.py`).
    *   Set up basic configuration loading (e.g., using Pydantic settings).
    *   Implement a health check endpoint (`/health`).
3.  **Database Setup (PostgreSQL & SQLModel):**
    *   Set up local PostgreSQL database using Docker (`docker-compose.yml`).
    *   Add DB dependencies (`sqlmodel`, `psycopg2-binary` / `asyncpg`).
    *   Configure database connection URL (via environment variables).
    *   Implement basic database connection logic within FastAPI (e.g., startup/shutdown events).
    *   Set up Alembic for database migrations.
4.  **Authentication Setup (FastAPI Users & Google OAuth):**
    *   Add `fastapi-users[oauth]` dependency.
    *   Define User database model (`UserRead`, `UserCreate`, `UserUpdate`, DB model).
    *   Integrate `FastAPIUsers` router into the main application.
    *   Configure basic email/password authentication.
    *   Set up initial Alembic migration for user tables.
    *   Configure Google OAuth provider (requires obtaining credentials from Google Cloud).
    *   Test basic registration, login (email/password), and Google OAuth flow.
5.  **Dockerization:**
    *   Create `Dockerfile` for the FastAPI application.
    *   Refine `docker-compose.yml` for local development (app + db).

## Phase 2: Foundation & Setup (Frontend)

1.  **Project Structure & PNPM Setup:**
    *   Initialize frontend project directory (`/web` or similar) using Astro CLI.
    *   Select React and Tailwind CSS during Astro setup.
    *   Add initial dependencies via PNPM.
    *   Configure basic linting/formatting (e.g., ESLint, Prettier).
2.  **Basic Astro Layout & Pages:**
    *   Create a main layout component (`Layout.astro`).
    *   Set up basic routing for placeholder pages (Home, Dashboard, Login).
    *   Integrate Tailwind CSS configuration.
3.  **API Client Setup:**
    *   Set up a basic utility/service for making requests to the FastAPI backend.
    *   Configure base URL via environment variables.
4.  **Basic Authentication UI:**
    *   Create React components (within Astro islands) for Login and Registration forms.
    *   Integrate components into relevant Astro pages.
    *   Implement logic to call backend authentication endpoints (email/password & Google OAuth).
    *   Set up basic client-side state management (e.g., Zustand) for user authentication status.
    *   Implement protected routing (redirect unauthenticated users from dashboard).

## Phase 3: Core Feature - Natal Chart

1.  **Backend - Astrology Engine Integration:**
    *   Choose and add core Astrology Engine dependency (e.g., `kerykeion`).
    *   Develop utility functions/classes to wrap engine calculations for natal charts (planets, houses, aspects).
    *   Test engine accuracy and performance with sample data.
2.  **Backend - Natal Chart API Endpoint:**
    *   Define Pydantic models for birth data input and natal chart data output.
    *   Create FastAPI endpoint (`/charts/natal`) that accepts birth data, performs calculations using the engine, and returns structured chart data.
    *   Add database models for storing saved natal charts linked to users.
    *   Implement CRUD endpoints for users to save/retrieve/delete their charts.
3.  **Frontend - Birth Data Input Form:**
    *   Create a React component for capturing birth date, time, and location.
    *   Integrate Leaflet map component for location selection/geocoding (or use a geocoding API).
    *   Add robust validation for input fields.
4.  **Frontend - Natal Chart Display Component:**
    *   Create a React component responsible for rendering the natal chart wheel (using SVG/Canvas).
    *   Develop logic to parse chart data from the API.
    *   Implement rendering for planets, signs, houses, and aspect lines based on data.
    *   Implement basic interactivity (e.g., hover effects on planets/aspects).
5.  **Integration & UI:**
    *   Integrate the input form and display component into a dedicated Astro page/dashboard section.
    *   Connect form submission to the backend API endpoint.
    *   Display calculated chart upon successful API response.
    *   Implement UI for saving/loading user charts.

## Phase 4: Core Feature - Transit Tracking

1.  **Backend - Transit Calculation Logic:**
    *   Extend Astrology Engine wrapper to calculate transit positions for a given date/time.
    *   Develop logic to calculate aspects between transiting planets and natal planets.
2.  **Backend - Transit API Endpoint:**
    *   Define Pydantic models for transit requests (natal chart ID/data + target date/time) and output.
    *   Create FastAPI endpoint (`/charts/transits`) to return transit positions and aspects relative to a natal chart.
3.  **Frontend - Transit Visualization:**
    *   Enhance the Natal Chart Display component (or create a new one) to overlay transit positions.
    *   Develop UI controls (e.g., date picker, timeline slider) to select the transit date/time.
    *   Implement dynamic updates: fetch and re-render transits when the date changes without full page reload.
    *   (Optional) Implement transit timeline view (using Recharts/Nivo).

## Phase 5: Additional Features & Refinements

1.  **Synastry & Compatibility:**
    *   Backend: Implement calculation logic and API endpoints for bi-wheels and composite charts.
    *   Frontend: Develop UI for selecting two charts and displaying synastry/composite views.
2.  **Personalized Horoscopes:**
    *   Backend: Define logic/prompts for AI-enhanced interpretation generation based on natal+transit data. Set up API endpoint.
    *   Frontend: Display personalized horoscope text.
3.  **Astrology Learning Hub:**
    *   Backend: (Optional) API endpoints if content is dynamic.
    *   Frontend: Create Astro pages/React components for glossary, tutorials.
4.  **User Profile & Settings:**
    *   Backend: API endpoints for managing user preferences (chart settings, etc.).
    *   Frontend: UI for profile management and settings customization.
5.  **Sharing & Export:**
    *   Backend: Logic to generate shareable links/data snapshots. PDF generation library integration.
    *   Frontend: UI for sharing options and initiating exports.
6.  **UI/UX Polish & Theming:**
    *   Refine styling (Tailwind CSS) to match visual goals.
    *   Implement light/dark themes.
    *   Improve animations and transitions.
    *   Enhance accessibility based on testing.
7.  **Performance Optimization:**
    *   Profile frontend chart rendering and optimize bottlenecks.
    *   Profile backend calculation endpoints and optimize.
    *   Implement caching strategies (API responses, frontend data).
8.  **Testing:**
    *   Backend: Unit tests for calculation logic, integration tests for API endpoints.
    *   Frontend: Unit tests for components, end-to-end tests for critical user flows.

## Phase 6: Deployment & Monitoring

1.  **Prepare for Production:**
    *   Configure production environment variables (secrets management).
    *   Finalize database migration scripts.
2.  **Deploy Frontend (Vercel):**
    *   Connect repository to Vercel.
    *   Configure build settings and environment variables.
3.  **Deploy Backend (Render/Fly.io):**
    *   Configure deployment service (e.g., `render.yaml` or `fly.toml`).
    *   Set up managed PostgreSQL instance.
    *   Deploy containerized application.
4.  **Setup Monitoring & Logging:**
    *   Integrate logging solution for backend.
    *   Set up basic uptime monitoring and error tracking (e.g., Sentry).

---
*This task list provides a roadmap. Prioritization within phases (especially Phase 5) and addressing risks (like chart performance) will require ongoing assessment.* 