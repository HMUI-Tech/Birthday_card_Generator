<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Local Dev Guardrails

If any Prisma schema, Prisma select, or Prisma model field changes are made, do not stop at `npm run build`.

Always do all of the following before handing the app back:

1. Run `npm run db:push`
2. Run `npx prisma generate`
3. Stop every running `next dev` process for `digital-card-app`
4. Delete `.next`
5. Start one fresh `npm run dev`
6. Verify the live dev server with a real auth flow:
   - sign up or sign in
   - confirm `GET /api/auth/session` works
   - if public card fields changed, open a `/card/[slug]` page too

Reason:
- A stale `next dev` process can keep an outdated Prisma runtime in memory and cause recurring `Unknown field ... for select statement on model Card` errors even when the schema, generated client, and production build are correct.

# Card Copy Guardrails

Do not describe fallback or placeholder card text as AI-generated.

If a card has no saved `title` or no saved `insideMessage`:

1. Label the current text as starter or placeholder copy from the brief
2. Tell the user generation has not completed for that section yet
3. Make sure the workspace lets the user correct the card brief on an existing draft
4. If the recipient, occasion, or relationship changes, clear stale generated copy rather than leaving mismatched text on the card

# Product Direction

This app is a private AI card studio with a public recipient-facing card.

Keep these roles separate:

1. The workspace is private and editable:
   - auth
   - card brief editing
   - AI generation controls
   - media upload, delete, placement, filter, and motion controls
   - source upload, save, and delete controls
2. The public `/card/[slug]` page is the final recipient-facing card:
   - front cover
   - inside message
   - back note
   - chosen media only

Do not let the public card drift back into a dashboard, preview inspector, or debug page.

# Current Build Snapshot

The current app supports:

1. Email/password auth with session lookup and logout
2. Card briefs with:
   - recipient name
   - occasion
   - relationship
   - theme
   - private back note
3. AI generation of:
   - front cover line
   - inside message
4. Memory sources:
   - note
   - link
   - instagram
   - facebook
   - pdf
5. Media uploads backed by Cloudinary
6. Per-media settings:
   - placement
   - filterStyle
   - motionStyle
7. Delete actions for:
   - saved sources
   - uploaded media
8. Public share pages by slug

# Public Card Guardrails

The recipient should not see editor-only language or metadata.

Do not show these on the public page:

1. Draft state labels such as `AI copy ready` or `starter copy`
2. Workspace/debug descriptions about generation status
3. Placement, filter, or motion labels
4. Filenames, upload metadata, or source metadata
5. “Shareable card”, “attached media”, or other workspace framing
6. Empty-state operational text that reads like tooling instead of card content

The public page should read like the card itself, not like an admin view.

# Workspace Guardrails

The workspace is where operational details belong.

Keep these in the workspace, not on the public page:

1. Generate/regenerate actions
2. Share-link controls
3. Source management
4. Media management
5. Feature-status warnings for OpenAI or Cloudinary
6. Placeholder-vs-generated explanations

# Media Guardrails

Media is now a first-class design element, not a loose attachment.

Rules:

1. Use the server-side upload path at `POST /api/cards/[cardId]/media`
   - do not move back to fragile browser-direct Cloudinary upload as the primary flow
2. Media records currently carry:
   - `placement`
   - `filterStyle`
   - `motionStyle`
3. The workspace must allow delete for uploaded media
4. The apply button for media controls should only be active when something changed
5. Public card rendering should honor saved placement, filter, and motion
6. Motion styles currently supported are:
   - `none`
   - `gentle-zoom`
   - `drift`
   - `float`
7. Motion should respect reduced-motion preferences

# Cloudinary Guardrails

Cloudinary setup is strict.

1. `CLOUDINARY_CLOUD_NAME` must be the exact cloud name from the Cloudinary dashboard or API environment string
2. Do not use a project label, app name, or folder name as the cloud name
3. If upload fails, surface the real Cloudinary error message when possible
4. If env vars change and uploads still act stale, restart `npm run dev`

# Source Guardrails

Memory sources are references for AI generation, not proof that the app can scrape the linked site.

Rules:

1. Treat Instagram and Facebook links as user-provided references
2. Do not imply the app can read the live contents of those URLs unless that integration is explicitly implemented
3. Support deleting unwanted saved sources
4. Keep source success/error messages specific enough that the user knows what was saved

# Brief and Generation Guardrails

The brief drives generation.

Rules:

1. If the recipient, occasion, or relationship changes, clear stale generated cover/inside copy
2. The personal note belongs on the back and should not be rewritten by AI
3. If OpenAI is not configured, say so directly in the workspace instead of pretending generation is available
4. Starter copy can appear in the workspace, but it must be clearly treated as starter text rather than final AI output
