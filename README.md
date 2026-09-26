# Job Tracker App

A simple, fast application log for tracking job and internship applications — built with React and Vite. All data is stored locally in your browser, so there's no backend or account needed.

## Features

- **Log applications** with company, role, location, status, posting link, date applied, and notes
- **Job vs. Internship** — tag each entry as a Job or Internship and filter by type
- **Status tracking** — Applied, Interview, Offer, Rejected, Withdrawn, with a quick-update panel per entry
- **Search and filter** by company, role, location, status, and type
- **Sortable columns** — click any column header to sort
- **Clickable company links** — click a company name to jump straight to its job posting
- **Stats overview** — see counts per status at a glance
- **Responsive layout** — adapts from desktop down to mobile
- **Local persistence** — your data is saved to the browser's `localStorage`, so it survives page reloads

## Tech Stack

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm

### Installation

```bash
git clone https://github.com/keerthanathummala/Job-Tracker-App.git
cd Job-Tracker-App
npm install
```

### Run locally

```bash
npm run dev
```

Then open the URL shown in your terminal (usually `http://localhost:5173`).

### Build for production

```bash
npm run build
```

The optimized output is generated in the `dist/` folder.

## Deployment

This app is a static site and deploys easily to [Vercel](https://vercel.com):

1. Push your repo to GitHub.
2. Import the repo in Vercel (auto-detects the Vite setup).
3. Click **Deploy** — you'll get a public URL to share.

Any push to `main` automatically redeploys the live site.

## Data & Privacy

Applications are stored only in your browser's `localStorage`. This means:

- Your data stays on your device and is never sent to a server.
- Each browser/device has its own separate list — data isn't shared between users or synced across devices.
- Clearing your browser's site data will erase your saved applications.

## License

This project is for personal use. Add a license of your choice if you plan to share or open-source it.
