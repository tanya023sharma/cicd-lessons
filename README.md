# CA Buddy

CA Buddy is a one-screen browser chatbot for everyday Indian questions about GST, TDS, ITR deadlines, and audit basics. It provides general information only and is not a substitute for advice from a Chartered Accountant.

## Local setup

Use Node.js 22 or newer, then install dependencies:

```bash
npm install
```

For a live Gemini development session, create `.env` in the repository root and set the variable without committing the file:

```dotenv
VITE_GOOGLE_API_KEY=your-key-here
```

Start the app:

```bash
npm run dev
```

## Validation

The automated suites do not call Gemini. Unit tests use a deterministic fake service, and Playwright intercepts provider requests:

```bash
npm run test:unit
npx playwright install --with-deps chromium
npm run test:e2e
npm run build
```

## Deployment

The GitHub Pages workflow runs unit tests, intercepted E2E tests, and the production build before deployment. It builds with `/test-day-7/` as the repository base path. Configure `VITE_GOOGLE_API_KEY` only as a deployment secret if a live browser session is intentionally enabled; never commit or log its value.
