# Chunked: frontend

HTML5 + CSS3 + ES6 modules + Bootstrap 5.3 (CDN). No build step.

## Run it
ES modules need a web server (opening the file by double-click will not work).
- VS Code: right-click `app.html` → **Open with Live Server**
- or in this folder: `python -m http.server 5500` then open `http://localhost:5500/app.html`

## Try it
- Sign up with any valid email: you land in the onboarding wizard (5 steps, skippable), then the dashboard.
- **Demo admin:** `admin@chunked.test` / `admin12345` -> goes to the admin area. Demo only; the real admin is created by a Laravel seeder.
- Any other valid email on the login page logs in as a normal user. All of this is fake auth in `js/api.js`.

## How the pieces fit
- `js/router.js` has the guard: logged out -> login; new user -> onboarding; admin -> `#/admin` only; non-admin can't open `#/admin`.
- `js/api.js` is the only place that "talks to the server". Replace its functions with `fetch("/api/...")` when Laravel is ready.
- `js/utils/prayerTimes.js` gets times from the Aladhan API (cached per day, with approximate fallback times offline).
- `js/state.js` `settings` has the same keys as the `user_settings` table.

## Rules that keep the project small
1. **Colors only from `css/tokens.css`.** Never write a hex color in a component.
2. **Strings only via `t("key")`** (JS) or `data-i18n="key"` (HTML); add both EN and AR in `data/translations.js`.
3. **Logical CSS properties** (`margin-inline-start`, `padding-inline`, `inset-inline-end`) instead of left/right so RTL just works.
4. **One state object** (`js/state.js`). Pages read it; settings changes go through `update({ settings: {...} })` and the app redraws.
5. **Add a file only on the day it is needed.**

## Adding a page
1. Add the route in `js/router.js` (first URL segment → file name).
2. Create `js/pages/<name>.js` exporting `render(view, { parts })`.
3. Add a nav entry in `js/components/sidebar.js` (set `module:` if a module toggles it).

## Adding a theme
Copy a block in `css/tokens.css`, rename it, change the 9 color tokens, add it to `THEMES` in `js/utils/theme.js` and `theme.<id>` in `data/translations.js`.

## Planned (see the day plan)
Day 2 auth + onboarding · Day 3 dashboard widgets · Day 4 Day module · Day 5 Grow + Focus · Day 6 Settings, Templates (printable PDFs), Admin (mock), polish.
