# OFTI offices time

Multi-timezone clock and schedule planner. The `/concept` page ("Feature concept" in the header) shows how times in chat messages would be converted for each reader's city. The spec is [docs/PRD.md](docs/PRD.md).

## Local development

Requires Node.js 22 or later and npm.

```sh
npm i
npm run dev
```

The app runs on http://localhost:8080. The six presets on `/concept` work offline. Custom messages need an OpenAI key in `.env.local` (git ignores it):

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

The live eval calls the model with 27 messages and is skipped by default. It needs the key in the shell, not only in `.env.local`. In PowerShell:

```powershell
$env:OPENAI_API_KEY="sk-..."; $env:RUN_EVAL="1"; npx vitest run src/lib/parseTime.eval.test.ts
```

It passes with at least 24 of 27 rows right and no critical errors (an unclear time shown as exact).

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
