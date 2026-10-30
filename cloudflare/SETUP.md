# Secure 3D Gallery — Cloudflare setup

This backend uses a private Cloudflare R2 bucket and a Cloudflare Worker. The Render website remains the public gallery UI. Only the owner password can create or delete videos; visitors can view the public gallery stream.

## One-time Cloudflare setup

1. Sign in to Cloudflare and open Workers & Pages.
2. Enable the account's workers.dev subdomain if it has not already been enabled.
3. Open R2 Object Storage once to activate R2 on the account.
4. Create a Cloudflare API token with these account permissions:
   - Workers Scripts: Edit
   - Workers R2 Storage: Edit
   - Account Settings: Read
   The token is used only by GitHub Actions; never put it in website JavaScript or commit it.
5. Copy the Cloudflare Account ID from the dashboard.

## Add GitHub Actions secrets

In the Coder-Blocks/ravi-3d-portfolio repository, open Settings, Secrets and variables, Actions, New repository secret. Add:

| Secret name | Value |
|---|---|
| CLOUDFLARE_API_TOKEN | API token created above |
| CLOUDFLARE_ACCOUNT_ID | Your Cloudflare Account ID |
| GALLERY_ADMIN_PASSWORD | A new strong password, at least 14 characters |
| GALLERY_SESSION_SECRET | A random value of at least 40 characters |

Generate a session secret in PowerShell without sharing it in chat:

PowerShell commands:
$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$GALLERY_SESSION_SECRET = [Convert]::ToHexString($bytes)
$GALLERY_SESSION_SECRET

Choose a long, unique gallery password and save it in a password manager. Do not reuse your GitHub or email password.

## Deploy

After all four secrets are saved, open Actions, then Deploy 3D Gallery Secure Backend, then Run workflow. The workflow will create the private R2 bucket if it does not exist, deploy the Worker and secrets, publish the Worker API URL to the static gallery config, and trigger the existing Render static-site auto-deploy.

The Worker uses 10 MiB multipart chunks for uploads. Browser uploads are never written to GitHub.

## Important security notes

- R2 is private. The Worker is the configured delivery path.
- The owner password is stored in GitHub Actions secrets; only its SHA-256 digest is deployed as a Worker secret.
- Owner sessions are signed, short-lived (2 hours), and held in the current browser tab's session storage.
- Upload, multipart completion, and delete routes require the owner session and exact portfolio origin.
- Visitor playback is read-only; there are no public upload or delete routes.
- The player hides normal download controls, disables right-click on the video surface, uses inline streaming, and sends no-store cache headers.
- No browser video can be made completely impossible to copy. A visitor who can watch the video receives media bytes and may still use screen recording or technical network tools. This blocks ordinary download UI and keeps the R2 bucket private; it is not DRM.
- Existing videos in the old gallery's IndexedDB remain on the device where they were uploaded. After the Worker is deployed, sign in to the gallery on that same browser and choose Import old browser videos. The import copies files to R2 and does not erase the local copies.
- For large or valuable original files, keep your own backup too. Cloud storage does not replace an offline master copy.
