# Life Dashboard

A calm project-first dashboard for when you feel overwhelmed. Track projects, tasks, and due dates — synced across your devices via Convex.

## Features

- **Projects list home** — each card shows open task count and the next thing to do
- **Tasks inside projects** — priority, status, due dates
- **Calendar view** — see what's due and jump to the project
- **Installable PWA** — add to Mac, Windows, or phone from the browser
- **Real-time sync** — changes appear instantly on every device

## Stack

- Next.js 16 + React 19 + Tailwind CSS 4
- [Convex](https://convex.dev) (database + backend)
- [Convex Auth](https://labs.convex.dev/auth) (email + password)

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start Convex (creates your cloud backend)

In one terminal:

```bash
npx convex dev
```

This will prompt you to log in and create a Convex project. It writes `NEXT_PUBLIC_CONVEX_URL` to `.env.local`.

### 3. Start Next.js

In another terminal:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and start adding projects.

## Deploy

### Convex

```bash
npx convex deploy
```

### Vercel (frontend)

1. Push this repo to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add environment variable `NEXT_PUBLIC_CONVEX_URL` from your Convex dashboard
4. Deploy

Install the app from your Vercel URL on any device (Chrome: Install app, Safari: Add to Home Screen).

## Cost

For personal use, Convex free tier + Vercel hobby tier = **$0/month**.
