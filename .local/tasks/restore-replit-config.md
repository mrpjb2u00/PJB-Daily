# Restore .replit Workflow Config

  ## What & Why
  A duplicate "Start Frontend" task was added to the Project workflow by a previous configureWorkflow call. This causes two Metro instances to launch simultaneously on every project run. The second instance finds port 8081 busy and gets stuck on an interactive prompt ("Use port 8082 instead?"), which prevents Replit from reading the correct exp:// URL and generating a working QR code for Expo Go.

  ## Done looks like
  - The Project workflow contains only one task: "Start App"
  - The Start Frontend workflow uses `npm run expo:dev` with `waitForPort = 8081` and `ensurePreviewReachable = "/status"`
  - Only one Metro process starts when the project runs
  - The Start Frontend workflow log shows the exp:// URL and Metro QR code
  - No "Port 8081 is being used by another process" message appears
  - Replit's QR flow works and phones can connect via Expo Go

  ## Out of scope
  - Any app source file changes
  - Supabase, navigation, notes, todos, or calendar features
  - Any workflow changes other than restoring .replit

  ## Tasks
  1. **Restore .replit from working commit** — Run `git checkout 294191f -- .replit` to restore the file to the last verified-working state. This removes the duplicate Start Frontend task from Project and restores ensurePreviewReachable to the Start Frontend workflow.
  2. **Restart Metro and verify** — Restart the Start Frontend workflow and confirm only one Metro process starts, the exp:// URL appears in the log, and no port conflict error appears.

  ## Relevant files
  - `.replit`
  