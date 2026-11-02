# Taking StudyPlanner from hosted demo to a real AWS service

## Choose the correct milestone

**Milestone A: Live URL, frontend-only demo.** Use the provided `amplify.yml` and AWS Amplify Hosting. This publishes the React app but retains the browser-local demo storage and non-authenticating demo sign-in. It is suitable for a class presentation with fake data, *not* real students.

**Milestone B: Real service.** Add Amazon Cognito for user authentication, an AppSync-backed API and DynamoDB via AWS Amplify Gen 2 for persistent, user-owned course/event data. A hosted frontend alone does not create that backend.

## Stage A: Host your existing repo

1. Run `npm install`, `npm test`, `npm run build` locally. Commit the generated package lockfile alongside your source.
2. Commit `amplify.yml` in the repository root. The included config runs npm install, `npm run build` and publishes `dist/`.
3. In AWS Console, choose **AWS Amplify** → Create/Deploy app → GitHub. Select repo and branch (`main` or your actual default branch).
4. Confirm the build settings and deploy. Your site receives an HTTPS `amplifyapp.com` URL.
5. Whenever you push to the connected branch, Amplify rebuilds automatically.
6. For a future React Router setup, add the SPA rewrite from non-asset paths to `/index.html` with HTTP 200 under Hosting → Rewrites and redirects.
7. Configure AWS Budgets / alerts before deploying billable resources.

When using lockfile-based deployment, change preBuild command in `amplify.yml` to `npm ci` **after** `npm install` has created a valid `package-lock.json` and both package files are committed. If a lock mismatch occurs, update the lockfile locally; don't paper over mismatched dependency trees with `--legacy-peer-deps` unless you understand why it is needed.

## Stage B: Add actual authentication and a database (not yet wired into this demo)

AWS Amplify Gen 2's supported route for a Vite/React app is:

- Auth: **Amazon Cognito User Pool** managed by Amplify Auth.
- Data: **AWS AppSync GraphQL API + DynamoDB**, managed by Amplify Data.
- Authorization: owner-based rules on **both** Course and Event models so one signed-in student cannot access another student's records.
- Frontend: `aws-amplify` client plus `@aws-amplify/ui-react` Authenticator, or your own frontend that calls the actual Cognito sign-in/sign-up APIs.

### Recommended setup

Read the official **Amplify Gen 2 manual installation** guide before scaffolding an existing Vite project:
https://docs.amplify.aws/react/start/manual-installation/

Use `npm create amplify@latest` (or the documented manual steps) to initialize backend configuration. Define these backend files, based on the documented `defineAuth` / `defineData` / owner authorization patterns:

`amplify/auth/resource.ts`

```ts
import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: { email: true },
});
```

`amplify/data/resource.ts`

```ts
import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  Course: a.model({
    name: a.string().required(),
    department: a.string().required(),
    code: a.string().required(),
    section: a.string().required(),
    professor: a.string().required(),
    color: a.string().required(),
    colorSource: a.string(),
  }).authorization(allow => [allow.owner()]),

  Event: a.model({
    title: a.string().required(),
    type: a.string().required(),
    date: a.date().required(),
    time: a.time().required(),
    courseId: a.id(),
  }).authorization(allow => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: 'userPool' },
});
```

`amplify/backend.ts`

```ts
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

defineBackend({ auth, data });
```

Note: the above schema is a starting point; enforce **ownership of linked Course records** when an Event is created or changed. An Event's courseId must point to a Course owned by the same authenticated student, not simply any valid ID. You can validate references via a server-side custom mutation if needed. Each Course and Event has a generated database ID, so update local component ID handling accordingly. The existing form stores time as `HH:mm`; Amplify Data `a.time()` uses an AWSTime format such as `HH:mm:ss`, so append `:00` when saving and format consistently when reading. Validate time zones and daylight-saving behavior for a real multi-time-zone service. Cognito ownership and authorization rules need to be tested with two real test accounts.

**Deploy development backend:** Follow the current Amplify documentation for AWS permissions and run `npx ampx sandbox` from the repository. This creates the cloud resources and a local `amplify_outputs.json` file. The sandbox must be running for local development updates and should be removed when no longer used.

**Wire the frontend:** Install `aws-amplify` and `@aws-amplify/ui-react`. In the frontend entrypoint configure Amplify using `amplify_outputs.json`. Replace the demo `AuthScreen` with the Authenticator component (which handles sign-up, email confirmation, real login and logout). Replace `loadPlannerData` / `savePlannerData` with calls to authenticated `client.models.Course.list/create/delete` and `client.models.Event.list/create/delete`. Fetch both models for the signed-in Cognito user; await backend responses, show loading/errors, and update UI after successful saves. Do not copy the `user.email` localStorage namespace into the cloud as an authorization method. Protect all records with owner rules.

**Passwords:** Password policy must be configured and enforced in the Cognito user pool; browser-side password checks are only feedback. The current demo validates passphrases 15+ characters but never authenticates them. The Authenticator's password requirements may differ from those currently shown; align its UI with the Cognito server-side policy. Consider MFA and email verification.

**Keep the existing UI:** CalendarView, EventsSection, course colors, and sorting can stay mostly unchanged because they accept arrays of courses and events. The main migration is replacing how Dashboard **loads, saves and deletes** records and replacing App's demo session logic.

**Production checklist:** Verify least-privilege owner rules, account confirmation/reset, error handling, input limits, multiuser isolation, quotas/rate limits, backups/retention, billing alerts, and monitoring; don't call the system production-ready until those are tested.

## Official documentation

- Hosting: https://docs.amplify.aws/react/deploy-and-host/amplify-hosting/
- Gen 2 manual setup: https://docs.amplify.aws/react/start/manual-installation/
- Auth: https://docs.amplify.aws/react/build-a-backend/auth/set-up-auth/
- Data: https://docs.amplify.aws/react/build-a-backend/data/set-up-data/
- Owner authorization: https://docs.amplify.aws/react/build-a-backend/data/customize-authz/per-user-per-owner-data-access/
- Login pages: https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-managed-login.html
