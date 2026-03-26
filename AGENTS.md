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
