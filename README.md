# FashionScape Hub

A RuneScape fashionscape community showcase. Upload outfits, vote on the community's best drip, win weekly awards, unlock achievements, and climb the leaderboard.

## Features
- 📜 **Outfit gallery** with 10 categories (Tank, Mage, Melee, Ranged, Skiller, PvP, Boss, Pet, Cosplay, General)
- 🗳️ **Community voting** — upvote your favorites
- 🏆 **Weekly awards** — top outfit per category wins every Sunday
- 🎖 **20+ achievements** from Bronze to Dragon tier
- 💬 **Discord linking** — bonus points for linking your server
- 📜 **Leaderboard** — top 100 adventurers by points

## Stack
- Astro 5 (server-rendered)
- Supabase (auth, database, storage)
- Tailwind v4
- Vercel adapter

## Development
```bash
npm install --legacy-peer-deps
cp .env.example .env  # fill in Supabase url + anon key
npm run dev
```

## Weekly awards cron
Hit `GET /api/cron/weekly` with header `x-cron-secret: fashionscape-cron` weekly (e.g. Sunday midnight UTC) to assign the week's winners. Set this up in Vercel Cron Jobs or an external scheduler.

## Next steps
- Connect a custom domain (via Vercel → Project Settings → Domains)
- Set up Vercel Cron for `/api/cron/weekly`
- Harden the cron secret (use a random value + env var)
- Optional: wire up Resend for email notifications on achievement unlocks
