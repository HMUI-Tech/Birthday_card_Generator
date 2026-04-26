# Digital Card App

Private AI card studio for building recipient-facing cards with:

- AI-written cover and inside message
- private back note
- placed photos, GIFs, and short videos
- optional uploaded soundtrack
- public share pages by slug
- static PDF export view

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Start PostgreSQL locally, for example with Docker:

```bash
docker compose up -d
```

3. Fill `.env` with:

```env
DATABASE_URL=...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
OPENAI_API_KEY=...
```

4. Sync Prisma:

```bash
npm run db:push
npx prisma generate
```

5. Start the app:

```bash
npm run dev
```

## How sharing works

- Live recipient card: `/card/<slug>`
- Static PDF view: `/card/<slug>/pdf`

The live card is the animated version. It can contain motion, playable videos, and an uploaded soundtrack.

The PDF route is intentionally static. It is meant for browser print / save-as-PDF. Music, animation, and live video playback stay on the web card.

## Music support

Each card can have one uploaded soundtrack.

- Upload route: `POST /api/cards/[cardId]/soundtrack`
- Remove route: `DELETE /api/cards/[cardId]/soundtrack`
- Public page tries to start playback, but browsers may block autoplay with sound until the recipient taps play.

Keep soundtrack files short and licensed.

## Public deployment

This repo contains the app inside `digital-card-app`, so when deploying from the repo root:

1. Import the GitHub repo into Vercel
2. Set the project Root Directory to `digital-card-app`
3. Provision a hosted PostgreSQL database
4. Add the environment variables listed above
5. Run Prisma against the hosted database
6. Deploy

Once deployed:

- creators use `https://your-domain/`
- recipients use `https://your-domain/card/<slug>`

Recipients do not need to sign up to open shared card links.

## PDF export

Open:

```text
/card/<slug>/pdf?autoprint=1
```

That view opens the static export page and triggers the browser print dialog so the card can be saved as a PDF.

## Verification commands

```bash
npm run lint
npm run build
```
