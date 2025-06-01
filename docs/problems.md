# Summary of Google OAuth Login Troubleshooting for AstroTracker

This document outlines the steps taken to implement and debug Google OAuth login functionality for the AstroTracker application.

## Goal:
Implement "Sign in with Google" for the AstroTracker application, allowing users to authenticate via Google and be redirected to the frontend dashboard.

## System Components:
*   **Frontend:** Astro application running on `http://localhost:4321`.
*   **Backend:** FastAPI application running on `http://localhost:8000`, using `fastapi-users` (v14.0.1) for authentication.
*   **Database:** PostgreSQL.
*   **Google Cloud Platform:** OAuth 2.0 Client ID configured for web application.

## Initial Setup & Implemented Steps:

1.  **Backend Configuration (`fastapi-users`):**
    *   Added `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` to `app/core/config.py` and `.env` file.
    *   Instantiated `GoogleOAuth2` client in `app/core/security.py`.
    *   Included `fastapi_users.get_oauth_router()` in `app/main.py` under the `/api/v1/auth/google` prefix, using a cookie-based `auth_backend`.
    *   Initially, a `redirect_uri_mismatch` (Google Error 400) occurred. This was resolved by ensuring the `redirect_uri` parameter was *not* passed to `fastapi_users.get_oauth_router()` in `app/main.py`, as `fastapi-users` and `httpx-oauth` handle this internally by using the default callback URL (`/api/v1/auth/google/callback`).
    *   Handled a database schema issue (`reset_password_token` column missing) by generating and applying an Alembic migration. This involved troubleshooting the Alembic environment configuration (`alembic.ini`, `migrations/env.py`) to correctly connect to the Dockerized PostgreSQL database.
    *   Addressed an `OAUTH_USER_ALREADY_EXISTS` error by setting `associate_by_email=True` in `get_oauth_router()`.

2.  **Frontend Configuration (`LoginForm.tsx`):**
    *   Added a "Sign in with Google" button.
    *   Implemented `handleGoogleLogin` function:
        *   Fetches the Google authorization URL from the backend endpoint (`/api/v1/auth/google/authorize`).
        *   Attempts to redirect the user's browser to this Google authorization URL using `window.location.href`.

## Current Issue: Google Authorization Error & Frontend Redirect Failure

**UPDATE:** Testing in an incognito/private browser window shows significant progress. The initial redirect to Google's consent screen works in this clean environment, suggesting browser extensions or cache in the regular browser environment are causing the initial block.

However, after interacting with the Google consent screen in incognito, the callback to the backend (`/api/v1/auth/google/callback`) shows an `NS_BINDING_ABORTED` error in the browser's network tools, indicating a potential new issue at that stage.

**Symptoms (Regular Browser vs. Incognito):**

*   **Regular Browser:**
    1.  **Direct URL Test Failure:** When the `authorization_url` is pasted directly, Google displays: **"Access blocked: Authorization Error"**.
    2.  **Frontend Behavior:** `window.location.href` executes (alert appears), but the browser **does not navigate** to Google.
*   **Incognito/Private Browser:**
    1.  **Initial Redirect Success:** The frontend successfully redirects to the Google Sign-in/Consent page.
    2.  **Callback Issue:** After user consent, the redirect back to `http://localhost:8000/api/v1/auth/google/callback` results in an `NS_BINDING_ABORTED` error in the network log. The final outcome of the login (e.g., redirection to dashboard, cookie setting) is TBD pending further testing of this stage.

**Previously Confirmed:**
*   An `alert()` added after `window.location.href = authorization_url;` in `LoginForm.tsx` **is confirmed to appear** (in the regular browser, before the redirect fails to navigate).

## Troubleshooting Steps Taken for the Current Issue & What Hasn't Worked:

1.  **Verified Google Cloud Console OAuth Configuration:**
    *   **Client ID:** Confirmed `GOOGLE_OAUTH_CLIENT_ID` in `.env` matches the Client ID in Google Console. **This is correct.**
    *   **Authorized Redirect URIs:** Confirmed `http://localhost:8000/api/v1/auth/google/callback` (the `redirect_uri` in the generated Google URL) is listed **exactly** in the "Authorized redirect URIs" in Google Console. **This appears correct.**
    *   **Authorized JavaScript Origins:** Confirmed `http://localhost:4321` (frontend) is listed. **This appears correct.**
    *   **Publishing Status:** "In production", "User type: External". **This appears correct.**
    *   **Client Secret:** Assumed to be correct in `.env` (matches the one in Google Console).

2.  **Frontend Redirect Mechanism (`window.location.href`):**
    *   In the regular browser, this line executes, but navigation to Google is blocked (likely by extensions/cache, leading to the "Access blocked" if the URL were manually used).
    *   In incognito, this line successfully navigates to Google.

3.  **Backend Redirection Post-Callback (Previously Attempted & Reverted):**
    *   Tried adding `success_url=settings.FRONTEND_URL + "/dashboard"` to `get_oauth_router()` in `app/main.py`. This resulted in a `TypeError` because this parameter is not supported by `fastapi-users` v14.0.1 in this way. **This was removed.**
    *   The backend currently returns a `204 No Content` after a successful callback from Google (if the flow were to reach that point), which means the auth cookie is set, but no client-side redirect occurs from the backend's response alone.

4.  **Frontend Passing `redirect_url` to Backend `/authorize` Endpoint:**
    *   Modified `LoginForm.tsx` to call the backend's `/api/v1/auth/google/authorize` endpoint with a query parameter `?redirect_url=${encodeURIComponent(frontendSuccessRedirectUrl)}`, hoping `fastapi-users` would use this to orchestrate the final redirect after a successful callback.
    *   This successfully constructs the URL, but the overarching "Authorization Error" from Google (when the main Google URL is used) prevents testing the efficacy of this specific `redirect_url` parameter for post-callback redirection.

## Hypotheses for Current Failure:

1.  **Regular Browser: Extension/Cache Interference:** The primary blocker for the initial redirect in the regular browser is highly likely to be browser extensions or cached data. This causes the "Access blocked: Authorization Error" when the Google URL is processed by this environment.
2.  **Incognito Browser: Callback Handling Issue:** The `NS_BINDING_ABORTED` error on the `/api/v1/auth/google/callback` request in the incognito browser (after successful consent with Google) points to a problem either in how the backend FastAPI server handles this callback, how it responds, or how the browser/frontend JavaScript handles the response or subsequent navigation. This could be due to the server closing the connection prematurely, a client-side script navigating away too soon, or a misconfiguration in the expected response.

## Next Steps to Investigate:

1.  **Focus on Incognito End-to-End Flow:**
    *   In an incognito window, initiate the Google login from `http://localhost:4321/login`. After reaching the Google consent screen, click "Continue".
    *   **Browser Behavior Post-Consent:**
        *   Where does the browser URL finally land? (e.g., `http://localhost:4321/login`, `http://localhost:4321/dashboard`, an error page?)
        *   Check the browser's "Application" (or "Storage") tab for `http://localhost:4321` or `http://localhost:8000`. Is the `fastapiusersauth` cookie present and does it have a value?
    *   **Network Tab Analysis (for `/api/v1/auth/google/callback`):**
        *   Re-confirm the final status of this request. If `NS_BINDING_ABORTED` occurs, try to see if *any* part of the response headers (like `Set-Cookie`) were received before the abortion.
        *   Is there any body in the response, even if aborted?
    *   **Backend (FastAPI) Server Logs:**
        *   Crucially, what do the FastAPI server logs show when `GET /api/v1/auth/google/callback?...` is hit? Does it indicate successful token exchange with Google? Does it log any errors? Does it log setting the cookie?
        *   **Login Status:** Based on the above, is the user considered logged in by the frontend (e.g., can they now access `/dashboard` without being redirected)?

2.  **Diagnose `NS_BINDING_ABORTED` (if it consistently occurs and prevents login):**
    *   Review the backend code in `app/main.py` that handles the OAuth callback (implicitly handled by `fastapi_users.get_oauth_router()`). Ensure there are no obvious issues.
    *   Consider what the frontend is expected to do immediately after the callback. Is there any JavaScript that runs on the redirect URI page that might be causing an issue or navigating away prematurely?
    *   Address Regular Browser Issues (After Incognito Works):
        *   Systematically disable extensions in the regular browser.
        *   Clear cache and cookies for `localhost` and `google.com` / `accounts.google.com`.
    *   Simplify the Google URL: (Still a valid fallback if deeper Google-side issues are suspected, but less likely now).
    *   Examine `fastapi-users` OAuth flow for `state` and redirect: (May become relevant if callback issues persist).

---
*Last updated: (Date of this summary)* 