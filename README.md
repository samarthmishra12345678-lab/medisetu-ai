# MediSetu

Full-stack health reference web application built by **Samarth Mishra** using a static frontend (`HTML5`, `CSS3`, `ES6+ JavaScript`) paired with `Node.js` / `Vercel Serverless` REST APIs.

## Purpose

MediSetu translates laboratory report values and Latin prescription abbreviations into plain English and Hindi, checks supplement timing interactions, evaluates student sleep debt and study fatigue, provides standard first-aid protocols, and hosts a live session notice board for student groups.

## Core Modules

| Module | Frontend Component | Backend Route |
| :--- | :--- | :--- |
| **Lab & Prescription Reader** | Bilingual output + browser speech read-aloud | `POST /api/analyze` |
| **Sleep & Study Fatigue Check** | Interactive sliders + 4-4-4-4 paced breathing timer | `POST /api/burnout` |
| **Campus Notice Board** | Sanitized notice submission + helpful confirmation | `GET /api/community`, `POST /api/community` |
| **First-Aid Protocols** | Immediate steps for fainting, burns, choking, and snakebite | Client reference |
| **Daily Dose Checklist** | Private device reminders with data clear controls | Browser `localStorage` |
| **Legal & Privacy Pages** | Dedicated `/privacy.html`, `/terms.html`, and SVG favicon | Static routes |

## Directory Structure

```text
medisetu-fullstack/
├── api/
│   ├── health.js          # GET /api/health
│   ├── analyze.js         # POST /api/analyze
│   ├── burnout.js         # POST /api/burnout
│   └── community.js       # GET & POST /api/community
├── public/
│   ├── favicon.svg        # Vector SVG favicon
│   ├── index.html         # Main application page
│   ├── privacy.html       # Privacy policy & local storage clear control
│   ├── terms.html         # Terms, conditions & clinical disclaimer
│   ├── styles.css         # Flat architectural zinc & emerald stylesheet
│   └── app.js             # Frontend API client & audio readout
├── docs/
│   └── MediSetu_Project_Summary.pdf
├── server.js              # Local HTTP full-stack server
├── test_suite.mjs         # Automated API & static standards audit suite
├── vercel.json            # Vercel routing configuration
└── package.json           # Node scripts & metadata
```

## Run & Verify Locally

```bash
npm start
npm test
```

## Engineering & Accessibility Details

- **Color & Layout:** Neutral zinc surfaces (`#09090b`, `#18181b`) paired with high-contrast emerald accents (`#0f766e`), clean flat typography, `6px` rectangular control geometry, and inline geometric vector icons.
- **Privacy Architecture:** Zero user accounts, zero tracking cookies, zero third-party analytics scripts, and a single-click local storage clear control on `/privacy.html`.
- **Legal Coverage:** Full clinical non-substitution disclaimer and emergency guidance (`112` / `108` / `14416`) linked globally from every page via `/terms.html`.
