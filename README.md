# AI Resume Checker — Career Survival Intelligence Engine

Upload your resume and get a **brutally honest** AI analysis of your automation risk, career survival probability, and an actionable upgrade roadmap.

Powered by **Llama 3.1 70B** via Groq, with a Cloudflare Worker to keep the API key secure.

---

## Features

- **PDF / DOCX / TXT** resume parsing (all client-side, nothing uploaded to a server)
- **AI Displacement Index (AIDI)** scoring with transparent formula
- **Automation Verdict** — SAFE / AT RISK / HIGH RISK / URGENT PIVOT
- **Skill Gap Analysis** with actionable table
- **Layoff Probability** prediction (2026–2028)
- **Resume ATS Fixes** — keyword gaps, wording improvements, structural issues
- **Career Pivot Suggestions** — 3 realistic alternative paths
- **Zero data storage** — resume analyzed in memory only, never saved

---

## Architecture

```
[Browser: Angular 18 SPA]
       │
       │  POST /api/analyze { resumeText }
       ▼
[Cloudflare Worker]  ── hides GROQ_API_KEY
       │
       │  POST https://api.groq.com/openai/v1/chat/completions
       ▼
[Groq API: Llama 3.1 70B Versatile]
```

---

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/AI-resume-Checker.git
cd AI-resume-Checker/ai-resume-checker
npm install
```

### 2. Deploy Cloudflare Worker

1. Install Wrangler CLI: `npm install -g wrangler`
2. Login: `wrangler login`
3. Navigate to the worker directory:
   ```bash
   cd cloudflare-worker
   ```
4. Add your Groq API key as a secret:
   ```bash
   npx wrangler secret put GROQ_API_KEY
   ```
   Paste your key from [https://console.groq.com/keys](https://console.groq.com/keys)
5. Deploy:
   ```bash
   npx wrangler deploy
   ```
6. Note the deployed URL (e.g., `https://resume-checker-api.YOUR_SUBDOMAIN.workers.dev`)

### 3. Configure the Frontend

Edit `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  workerUrl: 'https://resume-checker-api.YOUR_SUBDOMAIN.workers.dev'
};
```

For local development, edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  workerUrl: 'http://localhost:8787'  // Local wrangler dev server
};
```

### 4. Run Locally

```bash
# Terminal 1: Start Cloudflare Worker locally
cd cloudflare-worker
npx wrangler dev

# Terminal 2: Start Angular dev server
cd ai-resume-checker
ng serve
```

Open `http://localhost:4200`

### 5. Deploy to GitHub Pages

1. Go to your GitHub repo → **Settings** → **Pages**
2. Under "Build and deployment", select **GitHub Actions**
3. Push to `main` branch — the GitHub Action will build and deploy automatically

Your site will be available at: `https://YOUR_USERNAME.github.io/AI-resume-Checker/`

---

## Project Structure

```
AI-resume-Checker/
├── .github/workflows/deploy.yml    # GitHub Pages CI/CD
├── ai-resume-checker/              # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── services/
│   │   │   │   ├── file-parser.service.ts   # PDF/DOCX/TXT extraction
│   │   │   │   └── groq.service.ts          # Cloudflare Worker API client
│   │   │   ├── app.component.ts             # Main app logic
│   │   │   ├── app.component.html           # Template
│   │   │   └── app.component.scss           # Styles
│   │   ├── environments/
│   │   │   ├── environment.ts               # Dev config
│   │   │   └── environment.prod.ts          # Prod config
│   │   ├── styles.scss                      # Global styles
│   │   └── index.html
│   ├── cloudflare-worker/
│   │   ├── worker.js                        # Groq API proxy
│   │   └── wrangler.toml                    # Wrangler config
│   └── package.json
└── README.md
```

---

## Privacy

- Resume is parsed **entirely in the browser**
- Text is sent to Groq API via Cloudflare Worker for analysis
- **Nothing is stored, logged, or indexed**
- File is discarded from memory after processing

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 18, TypeScript |
| Styling | SCSS, dark theme |
| PDF parsing | pdf.js (pdfjs-dist) |
| DOCX parsing | mammoth.js |
| AI Model | Llama 3.1 70B Versatile |
| AI API | Groq |
| API Proxy | Cloudflare Worker |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |
