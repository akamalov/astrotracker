# AstroTracker - Initial Feature Set

This document outlines the core features for the AstroTracker web application, emphasizing a visually appealing, dynamic, fast, and secure user experience.

## Core Astrological Features

1.  **Natal Chart Generation:**
    *   Input: Accurate birth date, time, and location (with timezone auto-detection/selection).
    *   Output: Dynamically rendered, interactive natal chart (SVG or Canvas).
    *   Details: Planets, signs, houses (multiple systems: Placidus, Whole Sign, etc.), aspects (major & minor) with configurable orbs.
    *   Interpretations: Concise, AI-enhanced summaries for key placements and aspects.
    *   Visuals: Customizable themes, smooth zooming/panning.

2.  **Transit & Progression Tracking:**
    *   Real-time overlay of current planetary positions (transits) onto the natal chart.
    *   Calculation and display of secondary progressions and solar arc directions.
    *   Dynamic Updates: Chart updates reflect real-time or user-selected dates/times without full page reloads.
    *   Timeline View: Visualize upcoming significant transits/progressions.
    *   Insights: Contextual interpretations of current/upcoming energies.

3.  **Synastry & Compatibility Analysis:**
    *   Compare two natal charts side-by-side (Bi-wheel).
    *   Generate a composite chart representing the relationship's energy.
    *   Aspect Analysis: Detailed breakdown of inter-chart aspects with scoring/weighting.
    *   Relationship Insights: AI-driven summaries of potential strengths and challenges.

4.  **Personalized Horoscopes:**
    *   Daily, weekly, and monthly forecasts generated based *specifically* on the user's natal chart and current transits (not just Sun sign).
    *   Focus areas: Career, relationships, finance, personal growth.
    *   Delivery: In-app notifications, optional email digests.

## User Experience & Interface

5.  **Modern & Visually Appealing UI:**
    *   Theme Options: Light, dark, and potentially celestial-themed modes.
    *   Interactive Charts: Smooth, touch-friendly zoom, pan, and hover-info features.
    *   Responsive Design: Seamless experience across desktop, tablet, and mobile devices.
    *   Accessibility: Adherence to WCAG guidelines for color contrast, keyboard navigation, and screen reader compatibility.
    *   Fast Performance: Optimized front-end code, efficient data loading, and smooth animations.

6.  **User Accounts & Personalization:**
    *   Secure registration and login.
    *   **Google OAuth Integration:** Allow users to sign up/log in securely using their Google account.
    *   Profile Management: Store and manage multiple birth charts (self, family, friends).
    *   Personal Notes: Ability to add annotations and notes to specific charts or dates.
    *   Customization: User preferences for chart settings, orbs, house systems, etc.

7.  **Astrology Learning Hub:**
    *   Interactive Glossary: Definitions of astrological terms linked directly from charts.
    *   Beginner Tutorials: Guided introductions to core concepts (planets, signs, houses, aspects).
    *   Contextual Learning: Snippets of relevant information displayed within chart views.
    *   (Future) Quizzes & Articles.

8.  **Sharing & Export:**
    *   Generate shareable links to chart snapshots (with privacy options).
    *   Export charts as high-resolution images (PNG/SVG) or PDF reports.
    *   Social Media Integration: Quick sharing options.

## Technical & Security Features

9.  **Security & Privacy:**
    *   Secure Authentication: Robust password handling and session management.
    *   Google OAuth: Leverages Google's secure authentication protocols.
    *   Data Encryption: Encryption of sensitive birth data both in transit (HTTPS) and at rest (database encryption).
    *   Privacy Controls: User control over data sharing and visibility.
    *   Secure Development Practices: Protection against common web vulnerabilities (XSS, CSRF, SQL injection).

10. **Performance & Speed:**
    *   Optimized Calculations: Efficient ephemeris data handling and astrological calculations on the backend/serverless functions.
    *   Caching: Utilize caching strategies (CDN, server-side, client-side) to speed up data delivery and rendering.
    *   Modern Tech Stack: Leverage performant frameworks and libraries (as proposed in `initial_request.md`).
    *   Asynchronous Operations: Non-blocking operations for a smooth user experience.

---
*This feature list serves as a foundation and will be refined during the detailed planning and design phases.* 