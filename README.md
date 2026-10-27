# Devly

A system design problem a day, in bite-sized steps you can do between sets at the gym.

Each problem has four parts, and each one pauses and resumes wherever you leave it:

- **Quiz**: 6–8 multiple-choice questions that follow the interview flow, with an explanation after every answer.
- **Diagram**: the reference architecture, built up one component per tap.
- **Your design**: type or dictate your own design, then compare it with a model answer and tick off the key points you covered.
- **Cards**: concept flashcards with spaced review.

It works offline once installed. Progress stays on your phone (IndexedDB); export a backup from Progress now and then.

## Run it locally

```powershell
npm.cmd install
npm.cmd run dev      # http://localhost:4340
npm.cmd test
npm.cmd run build
```

## Put it on devly.zachhersick.com (one-time)

This uses the same setup as Lift, minus the server: there's no database, sign-in or environment variables.

1. Push this folder to a new GitHub repo, `zachhersick/devly`.
2. In Vercel, choose **Add New → Project**, import the repo and keep the framework preset at **Other**. `vercel.json` provides the build command (`npm run build`) and the output directory (`dist`).
3. Deploy, then add `devly.zachhersick.com` under **Settings → Domains**. Vercel shows the DNS record to add if the domain needs one.
4. On your iPhone, open the site in Safari and choose **Share → Add to Home Screen**.

Every push to `main` redeploys.

## Adding problems

Add `src/content/problems/NN-<id>.js` (copy `01-url-shortener.js` for the shape), plus any new cards in `src/content/cards/`. Then run `node --test tests/content.test.js`. See `AGENTS.md` for the content rules.
