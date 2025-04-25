# ToDo Tasks

## Phase 1: Foundation & Setup (Backend)

9.  **Authentication - Alembic Migration & Testing:**
    *   `cd /mnt/d/ai/projects/astrotracker/api`
    *   Ensure `migrations/env.py` targets the SQLModel base metadata including the User model.
    *   Run `alembic revision --autogenerate -m "Create user table"`
    *   Inspect the generated migration script in `migrations/versions/`.
    *   Run `alembic upgrade head` to apply the migration.
    *   Manually test registration and login endpoints (e.g., using Swagger UI at `/docs`).
    *   `git add migrations/versions/* && git commit -m "chore: Create Alembic migration for user table"` (aider)
    *   `(Checkpoint)` Backend: Basic User Auth (Email/Password) working.
10. **Authentication - Google OAuth Setup:**
    *   Go to Google Cloud Console, create a project, enable relevant APIs, and create OAuth 2.0 Client ID credentials (Web application type). Note down Client ID and Client Secret.
    *   Configure Authorized JavaScript origins and Authorized redirect URIs.
    *   `cd /mnt/d/ai/projects/astrotracker/api`
    *   `poetry add "fastapi-users[oauth]"` (if not added previously). Ensure `httpx` is installed.
    *   Add `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` to `app/core/config.py`, `.env.example`, and `.env`.
    *   Configure the Google OAuth client in `app/main.py` or `app/api/v1/endpoints/users.py` using the client ID/secret.
    *   Ensure the Google OAuth routes provided by `fastapi-users` are included.
    *   Test the Google OAuth login flow locally.
    *   `git add . && git commit -m "feat: Configure Google OAuth provider"` (aider)
    *   `(Checkpoint)` Backend: Google OAuth Login working.
11. **Backend Dockerization:**
    *   `cd /mnt/d/ai/projects/astrotracker/api`
    *   Create `Dockerfile`. Start from a Python base image (e.g., `python:3.11-slim`).
    *   Set up work directory, install Poetry, copy `pyproject.toml` and `poetry.lock`.
    *   Run `poetry install --no-root --no-dev` to install dependencies.
    *   Copy the application code (`app/`).
    *   Define `CMD` to run `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
    *   `cd /mnt/d/ai/projects/astrotracker`
    *   Update `docker-compose.yml` to include an `api` service building from `./api/Dockerfile`.
    *   Link `api` service to `db` service.
    *   Configure environment variables for the `api` service (e.g., from `.env` file).
    *   Expose the API port (e.g., `8000:8000`).
    *   Run `docker compose up --build` to test the build and local setup.
    *   `git add Dockerfile docker-compose.yml && git commit -m "build: Dockerize FastAPI application and update docker-compose"` (aider)
    *   `(Checkpoint)` Backend: Application runs successfully via Docker Compose.

## Phase 2: Foundation & Setup (Frontend)

12. **Frontend Project Init (Astro):**
    *   `cd /mnt/d/ai/projects/astrotracker`
    *   `pnpm create astro@latest web -- --template basics --install --git --typescript strict --tailwind` (Use `web` as the directory name, install dependencies, init git, use TypeScript, add Tailwind)
    *   `cd /mnt/d/ai/projects/astrotracker/web`
    *   Verify basic structure and config files (`astro.config.mjs`, `tailwind.config.mjs`, `tsconfig.json`, `package.json`).
    *   `(Checkpoint)` Frontend: Basic Astro project initialized with TS, Tailwind.
13. **React Integration:**
    *   `cd /mnt/d/ai/projects/astrotracker/web`
    *   `pnpm astro add react`
    *   Verify `@astrojs/react` is added to `astro.config.mjs`.
    *   `git add . && git commit -m "feat: Integrate React into Astro project"` (aider)
14. **Linter/Formatter Setup (Frontend):**
    *   `cd /mnt/d/ai/projects/astrotracker/web`
    *   Astro's setup likely includes basic ESLint/Prettier. Review configs (`.eslintrc.cjs`, `.prettierrc.cjs`).
    *   Install necessary plugins if needed (e.g., `eslint-plugin-react`, `eslint-plugin-tailwindcss`).
    *   Configure rules as desired.
    *   `git add . && git commit -m "build: Configure frontend linting/formatting"` (aider)
15. **Basic Layout & Routing:**
    *   `cd /mnt/d/ai/projects/astrotracker/web`
    *   Modify `src/layouts/Layout.astro` to define common page structure (header, footer, main content area).
    *   Create placeholder pages in `src/pages/`: `index.astro` (Home), `login.astro`, `register.astro`, `dashboard.astro`.
    *   Implement basic navigation links in the layout.
    *   Apply basic Tailwind styling to the layout.
    *   `git add src/layouts/* src/pages/* && git commit -m "feat: Implement basic Astro layout and placeholder pages"` (aider)
16. **API Client Utility:**
    *   `cd /mnt/d/ai/projects/astrotracker/web`
    *   Create `src/lib/` or `src/services/` directory.
    *   Create `src/lib/apiClient.ts` (or similar).
    *   Use `fetch` API or install `axios` (`pnpm add axios`).
    *   Configure base URL for the API (e.g., `http://localhost:8000/api/v1` locally) using environment variables (`import.meta.env.VITE_API_BASE_URL`).
    *   Create `.env` file in `/web` (add `VITE_API_BASE_URL=http://localhost:8000/api/v1`). Remember VITE prefix for client-side vars. Add `.env` to `/web/.gitignore`.
    *   Implement basic functions for GET, POST, etc., handling JSON and potential errors.
    *   `git add . && git commit -m "feat: Create basic API client utility"` (aider)
17. **Zustand Setup:**
    *   `cd /mnt/d/ai/projects/astrotracker/web`
    *   `pnpm add zustand`
    *   Create `src/stores/` directory.
    *   Create `src/stores/authStore.ts`. Define a basic store for user state (e.g., `isAuthenticated`, `user`, `token`) and actions (login, logout).
    *   `git add . && git commit -m "feat: Add Zustand and setup basic auth store"` (aider)
18. **Authentication UI Components (React):**
    *   `cd /mnt/d/ai/projects/astrotracker/web`
    *   Create `src/components/auth/` directory.
    *   Create `LoginForm.tsx` and `RegisterForm.tsx` React components.
    *   Use basic HTML form elements styled with Tailwind.
    *   Implement component state for form inputs.
    *   Implement `onSubmit` handlers that call the `apiClient` to interact with backend `/login` and `/register` endpoints.
    *   On successful login, update the `authStore`. Handle errors and display feedback.
    *   Implement a "Login with Google" button that redirects to the backend Google OAuth initiation endpoint.
    *   `git add . && git commit -m "feat: Create React components for Login and Registration forms"` (aider)
19. **Integrate Auth UI & Protected Routes:**
    *   `cd /mnt/d/ai/projects/astrotracker/web`
    *   Import and use `LoginForm` and `RegisterForm` components within `src/pages/login.astro` and `src/pages/register.astro` respectively (using `client:load` or other directive).
    *   Create a simple `LogoutButton.tsx` component that calls the logout action in `authStore` and potentially redirects. Add to layout conditionally.
    *   Implement protected routing logic, potentially in `src/layouts/Layout.astro` or using middleware (if Astro adds official middleware support, or via script tags): check `authStore.isAuthenticated`. If not authenticated and on `/dashboard`, redirect to `/login`.
    *   Handle the OAuth callback route (e.g., create `src/pages/auth/google/callback.astro`) which might need to capture tokens from URL/backend and update the store. (This part depends heavily on `fastapi-users` OAuth flow).
    *   Test login, registration, logout, Google OAuth flow, and protected route redirection.
    *   `git add . && git commit -m "feat: Integrate auth components, handle OAuth callback, implement protected routes"` (aider)
    *   `(Checkpoint)` Frontend: User can register, login (email/Google), logout. Dashboard is protected.

## Phase 3: Core Feature - Natal Chart

20. **Backend - Astrology Engine Integration & Testing:**
    *   `cd /mnt/d/ai/projects/astrotracker/api`
    *   `poetry add kerykeion` (or chosen alternative like `pyswisseph`, check licenses).
    *   Create `app/services/` directory.
    *   Create `app/services/astrology.py`.
    *   Implement `NatalChartCalculator` class or functions.
    *   Methods: `calculate_natal_chart(birth_dt, lat, lon)` returning structured data (planets positions/signs/houses, aspects).
    *   Define Pydantic models for detailed chart output structure in `app/models/chart.py`.
    *   Write unit tests (`tests/services/test_astrology.py`) using sample birth data to verify calculations against known results.
    *   `git add . && git commit -m "feat: Integrate astrology engine and implement natal chart calculation logic"` (aider)
    *   `(Checkpoint)` Backend: Natal chart calculations working and tested.
21. **Backend - Chart Database Model & Migration:**
    *   `cd /mnt/d/ai/projects/astrotracker/api`
    *   Define `Chart` SQLModel in `app/models/chart.py` (include user ID foreign key, birth data, name/label, etc.).
    *   `alembic revision --autogenerate -m "Create chart table"`
    *   Inspect and run `alembic upgrade head`.
    *   `git add . && git commit -m "feat: Define Chart DB model and create migration"` (aider)
22. **Backend - Natal Chart API Endpoints (CRUD):**
    *   `cd /mnt/d/ai/projects/astrotracker/api`
    *   Create `app/api/v1/endpoints/charts.py`.
    *   Implement POST `/charts/natal/calculate` endpoint: accepts birth data (Pydantic model), uses `astrology.py` service, returns calculated chart data (not saved). Requires authentication.
    *   Implement POST `/charts/` endpoint: accepts birth data + name, calculates chart, saves it to DB linked to the authenticated user. Returns saved chart data.
    *   Implement GET `/charts/` endpoint: returns list of saved charts for the authenticated user.
    *   Implement GET `/charts/{chart_id}` endpoint: returns specific saved chart details for the user.
    *   Implement DELETE `/charts/{chart_id}` endpoint: deletes a specific saved chart for the user.
    *   Add router to `app/main.py`.
    *   Write integration tests for these endpoints.
    *   `git add . && git commit -m "feat: Implement API endpoints for natal chart calculation and CRUD"` (aider)
    *   `(Checkpoint)` Backend: Natal chart API endpoints working and tested.
23. **Frontend - Birth Data Input Component:**
    *   `cd /mnt/d/ai/projects/astrotracker/web`
    *   Create `src/components/charts/BirthDataForm.tsx`.
    *   Include fields for Date, Time, Location (text input initially).
    *   Add date/time pickers (e.g., `react-datepicker` - `pnpm add react-datepicker @types/react-datepicker`).
    *   Implement validation (required fields, date/time formats).
    *   Handle form submission, sending data to POST `/charts/natal/calculate` or POST `/charts/` (if saving).
    *   `git add . && git commit -m "feat: Create React component for birth data input"` (aider)
24. **Frontend - Leaflet Map Integration:**
    *   `cd /mnt/d/ai/projects/astrotracker/web`
    *   `pnpm add leaflet react-leaflet @types/leaflet`
    *   Modify `BirthDataForm.tsx` to include a map component (`react-leaflet`).
    *   Implement logic: clicking map sets lat/lon state, reverse geocoding (using a service like Nominatim or Mapbox API via backend endpoint - *requires backend change*) updates location text input.
    *   Alternatively, use a location autocomplete input hitting a geocoding service.
    *   Ensure Leaflet CSS is imported correctly (might require global CSS or dynamic import).
    *   `git add . && git commit -m "feat: Integrate Leaflet map for location input"` (aider)
25. **Frontend - Basic Natal Chart Display (SVG/Canvas):**
    *   `cd /mnt/d/ai/projects/astrotracker/web`
    *   Create `src/components/charts/NatalChartDisplay.tsx`.
    *   Accept calculated chart data as props.
    *   Use SVG elements (`<svg>`, `<circle>`, `<line>`, `<text>`, `<g>`) or Canvas API within the React component to draw:
        *   Zodiac ring
        *   House cusps/lines
        *   Planet glyphs at correct degrees (requires mapping degrees to SVG coordinates). Use SVG symbols or text for glyphs.
        *   Aspect lines between planets (color/style based on aspect type).
    *   This is complex - start simply (e.g., just drawing planets on a circle).
    *   `git add . && git commit -m "feat: Implement basic SVG/Canvas rendering for natal chart wheel"` (aider)
26. **Frontend - Chart Integration & Interactivity:**
    *   `cd /mnt/d/ai/projects/astrotracker/web`
    *   Create a page `src/pages/chart/new.astro` (or similar).
    *   Integrate `BirthDataForm` and `NatalChartDisplay` components.
    *   Fetch calculated chart data from API on form submission and pass to `NatalChartDisplay`.
    *   Implement basic hover effects in `NatalChartDisplay` (e.g., show planet/degree info in a tooltip - `pnpm add @radix-ui/react-tooltip` if using Shadcn/UI approach).
    *   Implement UI for saving the calculated chart (button calling POST `/charts/`).
    *   Enhance `src/pages/dashboard.astro` to list saved charts (fetch from GET `/charts/`) and link to a view page (e.g., `src/pages/chart/[id].astro`).
    *   Create `src/pages/chart/[id].astro` to fetch and display a specific saved chart using `NatalChartDisplay`.
    *   Test the full flow: input -> calculate -> display -> save -> list -> view saved.
    *   `git add . && git commit -m "feat: Integrate chart components, add save/load UI, implement basic interactivity"` (aider)
    *   `(Checkpoint)` Full Stack: Can calculate, display, save, and view a basic Natal Chart.

## Phase 4: Core Feature - Transit Tracking

27. **Backend - Transit Calculation Logic:**
    *   `cd /mnt/d/ai/projects/astrotracker/api`
    *   Extend `app/services/astrology.py`.
    *   Add method `calculate_transits(natal_chart_data, transit_dt)` returning positions of transiting planets and aspects between transiting planets and natal planets.
    *   Update unit tests.
    *   `git add . && git commit -m "feat: Implement transit calculation logic in astrology service"` (aider)
28. **Backend - Transit API Endpoint:**
    *   `cd /mnt/d/ai/projects/astrotracker/api`
    *   Add GET `/charts/{chart_id}/transits` endpoint in `app/api/v1/endpoints/charts.py`.
    *   Accept `transit_datetime` as query parameter.
    *   Fetch the saved natal chart, call the transit calculation service.
    *   Return structured transit data (positions, aspects).
    *   Add integration tests.
    *   `git add . && git commit -m "feat: Implement API endpoint for fetching transits"` (aider)
    *   `(Checkpoint)` Backend: Transit API endpoint working.
29. **Frontend - Transit UI Controls:**
    *   `cd /mnt/d/ai/projects/astrotracker/web`
    *   Enhance the page displaying the chart (e.g., `src/pages/chart/[id].astro` or dashboard).
    *   Add UI controls:
        *   A date/time picker to select the transit date.
        *   (Optional) A slider or timeline component.
    *   Manage the selected transit date in component state (React/Zustand).
    *   `git add . && git commit -m "feat: Add UI controls for selecting transit date"` (aider)
30. **Frontend - Transit Visualization:**
    *   `cd /mnt/d/ai/projects/astrotracker/web`
    *   Modify `NatalChartDisplay.tsx` (or create a wrapper/new component).
    *   When transit date changes:
        *   Fetch data from the transit API endpoint (`GET /charts/{chart_id}/transits?transit_datetime=...`).
        *   Update the SVG/Canvas rendering to draw:
            *   Transiting planet glyphs (e.g., on an outer ring).
            *   Aspect lines between transiting and natal planets.
    *   Optimize fetching (debounce/throttle controls).
    *   (Optional) Implement separate timeline view using Recharts/Nivo based on transit data.
    *   Test dynamic updates.
    *   `git add . && git commit -m "feat: Implement transit visualization overlay and dynamic updates"` (aider)
    *   `(Checkpoint)` Full Stack: Can display natal chart with transit overlays updated dynamically.

## Phase 5: Additional Features & Refinements (Selected Examples - Prioritize based on MVP)

31. **Synastry (Backend):** Implement bi-wheel/composite calculations and API endpoints.
32. **Synastry (Frontend):** Implement UI for selecting two charts and displaying synastry view.
33. **UI Polish:** Refine Tailwind styles, add themes (dark/light toggle), improve animations.
34. **Testing (Backend):** Add more unit tests (services, models) and integration tests (API endpoints).
35. **Testing (Frontend):** Add component tests (e.g., with Vitest/React Testing Library) and E2E tests (e.g., with Playwright - `pnpm create playwright`).
    *   `(Checkpoint)` Core features stable, basic testing in place.

## Phase 6: Deployment & Monitoring

36. **Production Prep:** Configure secrets management (e.g., Doppler, cloud provider secrets), finalize migrations.
37. **Deploy Frontend:** Connect `/web` repo to Vercel, configure build/env vars.
38. **Deploy Backend:** Connect `/api` repo (or monorepo) to Render/Fly.io, configure `render.yaml`/`fly.toml`, set up managed DB, deploy Docker image.
39. **Monitoring:** Integrate Sentry (`pnpm add @sentry/astro @sentry/react`, `poetry add sentry-sdk[fastapi]`), set up basic logging/uptime checks.
    *   `(Checkpoint)` Application deployed to staging/production environment.

---
*This granular list provides a detailed path. Adapt and re-prioritize based on development velocity and evolving requirements. Remember to commit frequently after logical units of work.* 