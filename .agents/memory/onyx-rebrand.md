---
name: ONYX Research Rebrand
description: Key facts about the OASIS→ONYX rebrand and dark chrome aesthetic
---

## Rules
- All text says ONYX, never OASIS
- Logo: `/onyx-logo-transparent.png` (transparent PNG, works directly as `<img src="...">`)
- Dark palette: bg-[#050505] main, bg-[#080808] sidebar/headers, border-white/6 cards, text-neutral-200 primary, text-neutral-500 secondary
- White CTA buttons with black text: `bg-white text-black font-bold hover:bg-neutral-100`
- Numbers use font-mono class for monospace feel

## Clerk in dev
- Clerk JS fails to load from `clerk.localhost` in the Replit dev preview - this is normal and expected
- The vite runtime error overlay shows this error but users can dismiss it; the UI renders underneath
- Do NOT add `localization` prop to `<SignIn>` or `<SignUp>` — that prop does not exist in this Clerk version

**Why:** The Clerk proxy URL works in production but not in screenshot captures or cold dev environments.

## Stack
- React 19 + Vite, Wouter routing, TanStack Query, Tailwind CSS v4, Clerk auth, Lucide icons
- `@workspace/api-client-react` types require `pnpm build` in `lib/api-client-react` - implicit any TS errors are expected in dev
