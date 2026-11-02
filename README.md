# StudyPlanner v5 


## Requirements

- Node.js 20.19+ or 22.12+ (or newer supported versions)
- npm, VS Code, and Git
- AWS account + GitHub repository for hosting

## Run locally

```bash
npm install
npm run dev
```

Open the localhost URL from the terminal. Automated tests and production build:

```bash
npm test
npm run build
```

`npm install` will create `package-lock.json` on your computer. Commit both `package.json` and the generated `package-lock.json` to Git. With a lockfile present, you may change `amplify.yml` from `npm install` to `npm ci` for reproducible CI builds, provided it matches `package.json`.

## Features

- **Dashboard:** Month, Week, Day calendar views with previous/next and Today navigation. Click a date to pre-fill Add Event. Click an event for details. For days with more than two events in Month view, `+N more` switches to Day view. Show/Hide Upcoming Events toggles the side panel.
- **Courses:** Add and edit courses (name, department, code, section, professor). Each course displays live counts **by event type**, showing only types with at least one event. On the Courses page, select **Edit** next to an existing course; the form opens with its saved values. Editing keeps the course ID and therefore preserves its linked events. Choose your own course color, or let the app assign a color that is not currently taken. Older saved courses that have no color will receive one. All events connected to the course use the course color. General events use gray.
- **Events:** The separate Calendar section was renamed to Events. Lists all events, even past ones. Select **Edit** or **Delete** directly on a list row (Delete prompts for confirmation), or open an event's details and choose **Edit Event**; edit title, date, time, type, and linked course. Editing updates the same event, not a duplicate. Sort by oldest/newest, group by event type, or group by course. Within type/course groups, events always appear oldest to newest.
- **Sign Up:** Live password feedback, minimum 10 characters and a confirmation field. There are no additional character-composition or common-password checks in this classroom demo. Passwords are intentionally **not stored or checked on login**. This is NOT authentication; use a throwaway password only.
- **Storage:** `localStorage`, per browser and origin, **not a cloud database**.

Course removal also removes its linked events after a browser confirmation, as before. Editing never deletes linked events. Changing a course's color immediately updates its events in the Dashboard and Events list; switching from a custom course color back to Auto assigns an unused color. Automatic colors stay unchanged when other course fields are edited. Existing saved course and event structures are retained.

## Important file structure

```
src/
  App.jsx                     # demo session and screen switching
  main.jsx                    # React bootstrap
  styles.css                  # styling for all pages
  components/
    AuthScreen.jsx             # demo signup/login and password policy feedback
    Dashboard.jsx              # page selection, state, data and dialogs
    CourseForm.jsx             # add/edit courses with optional custom course color
    EventForm.jsx              # add/edit event with course association
    CalendarView.jsx           # month/week/day and course-based event colors
    EventsSection.jsx          # all-event list and sorting controls
  lib/
    courseColors.js            # assign/migrate colors, event color mapping
    eventSorting.js           # chronological or grouped sorting
    plannerUpdates.js         # immutable add/edit updates preserving record IDs
    password.js               # demo-only 10-character minimum on signup
    dates.js                  # date keys and display helpers
    storage.js                # browser-only data persistence
amplify.yml                   # AWS Amplify Hosting build specification
tests/helpers.test.mjs        # date, storage, sorting, colors, passwords and edit tests
AWS-FULLSTACK-GUIDE.md        # hosting and genuine cloud backend migration guidance
```

## Deploy the frontend through AWS Amplify Hosting

1. Push this app to your **existing GitHub repo**, on the branch you want Amplify to deploy (e.g., `main`). Keep this project at the Git repo root, or configure Amplify's monorepo/app-root settings for a subfolder. Do not commit `node_modules/`, `dist/`, or `.env` secrets.
2. Open AWS Console → **AWS Amplify** → Create app/Deploy an app → **GitHub**. Authorize your repo, choose repository and branch.
3. Confirm the build commands in `amplify.yml`: `npm install --no-audit --no-fund`, `npm run build`, publish folder `dist`.
4. Deploy. Amplify provides a public HTTPS URL under `amplifyapp.com`; you can connect a custom domain later.
5. Commit and push updates to your connected branch to trigger deployments.
6. If refreshing nested SPA routes later gives 404s, configure a 200 rewrite to `/index.html`. This demo switches screens internally and doesn't currently need nested routes.
7. Avoid real passwords or sensitive information until you've added real Cognito authentication and a secure backend.

**Costs:** AWS services can incur charges. Set billing budgets/alerts, check Amplify usage and AWS Free Tier eligibility for your account, and delete unused resources.

## Build a real multi-user cloud service

See [AWS-FULLSTACK-GUIDE.md](AWS-FULLSTACK-GUIDE.md) for a concrete AWS Amplify Gen 2 path: Cognito authentication and AppSync + DynamoDB owner-protected models. The currently downloadable app is not yet connected to those services.

## Troubleshooting

- `npm` not found → install Node.js and restart your terminal.
- Amplify fails with dependency lock mismatch → run `npm install` locally, verify build, commit updated `package-lock.json`, and then use `npm ci` with a matched lock file.
- Website appears blank → check browser console and Amplify build logs; verify `dist` is the artifact directory.
- Data doesn't carry between devices → expected; `localStorage` only stores data on one browser and website origin.
- Existing local courses don't have color → the app automatically migrates them in browser storage on load.
- Sign-in accepts any password for a previously registered demo email → expected but insecure by design; replace demo login with Cognito before using real accounts.

## Editing existing courses and events

- **Course:** Choose Courses → Edit. The form is prefilled. Change any details or course color and select Save Changes. All events linked to this course remain linked because its ID is unchanged.
- **Event:** Choose Events → Edit (or click the event in a calendar, Events list, or Upcoming list → Edit Event). Change details and Save Changes. The updated event immediately appears in the correct calendar day, sorting group, and Upcoming list.
- **Cancel:** Close or cancel either edit form without saving changes.
- **Storage:** As before, changes persist in localStorage in that browser and under that demo email only. When using a new AWS domain or a different device, browser data does not transfer automatically.

## v4 refinements

- **Events:** A separate **Delete** action sits beside **Edit** for every event in the Events tab. You can delete directly from the list without opening event details. The same confirmation dialog is used as elsewhere.
- **Courses:** Each course displays a calculated **N events** label. The count updates immediately when an event is added, deleted, or reassigned to another course, without storing a separate count field.
- **Sign-up:** The minimum password length is **10 characters**. Confirmation must still match. This demo does not store or verify credentials, so it is not suitable for real user accounts.

## v5: Per-event-type course counts

On **Courses**, each course shows a separate chip per event type with at least one linked event. For example: **2 Assignments · 2 Exams · 1 Study Session**. Types with no events are hidden (including courses with zero events, which have no count chips). Adding, editing, deleting, or moving an event between courses updates the displayed chips immediately. No event counts are saved separately; they are computed from the current events array.
