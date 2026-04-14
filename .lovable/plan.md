

# LampFarms Phase 1 -- Thorough Improvement Plan

After a deep audit of every file in the current codebase, here are all the issues found and the fixes needed.

---

## Issues Found

### 1. App.css contains Vite boilerplate that breaks layout
`src/App.css` has `#root { max-width: 1280px; margin: 0 auto; padding: 2rem; text-align: center; }` -- this constrains the entire app width, adds unwanted padding, and centers text globally. It is not imported currently but could cause issues if it gets imported.

**Fix**: Delete or empty `src/App.css` entirely.

### 2. Login redirects to /dashboard without checking farm setup
When a user signs in, `Login.tsx` navigates to `/dashboard` unconditionally. If the user's farm `setup_complete` is `false`, they should go to `/farm-setup` instead.

**Fix**: After successful `signIn`, query `farms` table for `setup_complete`. If `false`, navigate to `/farm-setup`; otherwise `/dashboard`.

### 3. Register navigates to /farm-setup but email confirmation may be required
Since auto-confirm is NOT enabled (per plan guidelines), after `signUp` the user gets an email confirmation. The code navigates to `/farm-setup` immediately, but the user won't have a session yet. The `ProtectedRoute` will bounce them to `/welcome`.

**Fix**: After successful signup, show a "Check your email to verify your account" message instead of navigating to `/farm-setup`. Add a confirmation notice page or toast.

### 4. signUp creates farm + preferences with `data.user.id` before email confirmation
When auto-confirm is off, `data.user` exists but is unconfirmed. The RLS policies use `auth.uid()` which will be null since there's no session. The `farms.insert` and `user_preferences.insert` calls will fail silently due to RLS.

**Fix**: Move farm + preferences creation to a database trigger or handle it on first sign-in. Create a `handle_post_confirmation` approach: either (a) enable auto-confirm for this app since it's a farm management tool (not a public platform), or (b) move farm/prefs creation to the first time the user hits `/farm-setup` after confirming email.

### 5. Cost privacy toggle in Zustand store is not synced with database
The `useAppStore` initializes `costPrivacyEnabled: true` hardcoded. It never reads from `user_preferences` table. Toggling only changes local state, never persists.

**Fix**: On dashboard load, fetch `user_preferences` and call `setCostPrivacy`. On toggle, also update `user_preferences` in the database.

### 6. Dashboard data loading has no error handling or loading state
The `useEffect` in Dashboard loads data but shows no loading spinner and silently swallows errors.

**Fix**: Add a `loading` state, show a skeleton/spinner while fetching, and toast on error.

### 7. Dexie.js (offline-first) is set up but never used
`db.ts` defines the Dexie database and sync outbox, but no code reads from or writes to it. The offline-first foundation is incomplete.

**Fix**: Create a `src/lib/sync.ts` service that:
- After fetching from Supabase, caches data into Dexie
- When offline, reads from Dexie cache
- Write operations go to Dexie first, then queue in outbox
- On reconnect, flush the outbox to Supabase

### 8. FarmSetup `handleFinish` does not check for Supabase errors
Each `await supabase.from(...)` call returns `{ error }` but the code doesn't check them. It's wrapped in try/catch, but Supabase client doesn't throw on errors -- it returns them.

**Fix**: Check `error` on each Supabase call and surface the first failure with a toast.

### 9. No Google authentication
The plan says to add Google auth for signups/logins.

**Fix**: Add Google OAuth sign-in button on Login and Register pages using `supabase.auth.signInWithOAuth({ provider: 'google' })`. Configure Google auth provider via Cloud auth settings.

### 10. FarmSetup step 2 does not validate unique house names
The plan requires unique house names but validation is missing.

**Fix**: In `canAdvance()` for step 2, also check that all house names are unique (case-insensitive).

### 11. Mobile header uses inline SVG instead of Lucide Sprout icon
The `AppLayout.tsx` mobile header has a hand-coded SVG instead of using the `Sprout` icon from lucide-react for consistency.

**Fix**: Import and use `Sprout` from lucide-react.

### 12. NotFound page uses basic styling, not the app design system
The 404 page uses `bg-muted` and basic anchor tags instead of the green-branded card style.

**Fix**: Restyle NotFound to match the app design with the Sprout icon and a Button link.

---

## Implementation Steps

### Step 1: Enable auto-confirm and Google auth
- Use `cloud--configure_auth` to enable auto-confirm (this is a farm management tool, not a public platform, so email verification adds friction without security benefit)
- Configure Google OAuth provider

### Step 2: Fix auth flow
- **AuthContext**: Remove farm + preferences creation from `signUp`. Instead, after the auth state changes to a signed-in user, check if a farm exists; if not, create one.
- **Login**: After sign-in, check `setup_complete` and route accordingly
- **Register**: After sign-up (with auto-confirm), navigate to `/farm-setup`

### Step 3: Fix FarmSetup error handling
- Check `{ error }` return on every Supabase call in `handleFinish`
- Add unique house name validation in step 2

### Step 4: Sync cost privacy with database
- Dashboard: fetch `user_preferences` on mount and hydrate `useAppStore`
- On toggle: persist to `user_preferences` table

### Step 5: Dashboard loading and error states
- Add loading skeleton while data fetches
- Handle and display errors

### Step 6: Implement offline-first sync service
- Create `src/lib/sync.ts` with cache-on-fetch and serve-from-cache-when-offline logic
- Wire Dashboard and FarmSetup to use the sync layer
- Flush outbox on reconnect

### Step 7: UI cleanup
- Delete `App.css`
- Replace inline SVG in AppLayout with `Sprout` icon
- Restyle NotFound page
- Add Google sign-in buttons to Login and Register

### Step 8: Add Google OAuth button
- Add "Sign in with Google" button to both Login and Register pages

---

## Technical Details

**Files to create**:
- `src/lib/sync.ts` -- offline sync service

**Files to modify**:
- `src/contexts/AuthContext.tsx` -- move farm creation to post-login check
- `src/pages/Login.tsx` -- check setup_complete on login, add Google auth button
- `src/pages/Register.tsx` -- add Google auth button
- `src/pages/FarmSetup.tsx` -- fix error handling, add unique name validation
- `src/pages/Dashboard.tsx` -- add loading state, sync cost privacy with DB
- `src/stores/useAppStore.ts` -- no changes needed (already correct)
- `src/components/AppLayout.tsx` -- use Sprout icon
- `src/pages/NotFound.tsx` -- restyle

**Files to delete**:
- `src/App.css`

**Auth configuration**:
- Enable auto-confirm email signups
- Enable Google OAuth provider

