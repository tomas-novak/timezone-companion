# OFTI offices time

Multi-timezone clock and schedule planner. The `/concept` page ("Feature concept" in the header) shows how times in chat messages would be converted for each reader's city. The spec is [docs/PRD.md](docs/PRD.md).

## Local development

Requires Node.js 22 or later and npm.

```sh
npm i
npm run dev
```

The app runs on http://localhost:8080. In an Orca worktree, `orca.yaml` runs `npm ci` and creates `.env.local` from `.env.example`; its Dev server tab (`node scripts/orca-dev.mjs`) picks a port in 8100–8899 from the worktree name, so worktrees don't collide.

The examples on `/concept` work offline. Typed messages ("Try your own message") need an OpenAI key in `.env.local` (git ignores it):

```sh
OPENAI_API_KEY=sk-...
# Optional
OPENAI_MODEL=              # default gpt-6-luna
OPENAI_BASE_URL=           # Azure OpenAI or Vercel AI Gateway
OPENAI_REASONING_EFFORT=   # default none
```

`npm run dev` serves `/api/parse-time` from `.env.local` without the Vercel CLI. Restart it after changing the file.

## Tests

```sh
npm test
npm run lint
```

The live eval calls the model with 30 messages. It is not part of `npm test`; run it on its own (it reads the key from `.env.local`):

```
npm run eval
```

It passes with at least 27 of 30 rows right and no critical errors (an unclear time shown as exact).

## Deploy on Vercel

1. Import the repo with the Vite preset (`npm run build`, output `dist`), Node.js 22 or 24. `vercel.json` rewrites everything except `/api/` to the SPA.
2. Set `OPENAI_API_KEY` (Sensitive) and the optional variables above for Production and Preview, then redeploy.
3. Use a dedicated OpenAI project with a hard monthly spend limit.
4. Add a Firewall rate-limit rule: path `/api/parse-time`, 20 requests per IP per minute, action 429.

## Technologies

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- luxon, zod
- OpenAI Responses API (`gpt-6-luna`) in a Vercel function
