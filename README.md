# Onyx

**Scientific research infrastructure, powered by AI.**

Onyx is an open-source platform that helps researchers discover literature, map knowledge graphs, surface research gaps, track emerging trends, and collaborate — all in one workspace built for speed and clarity.

Most research tools still feel like they were built in 2010. Onyx is an attempt to build the tool a modern research lab would actually want to use every day.

---

## Why Onyx

- **Stop drowning in papers.** Semantic search finds relevant work by meaning, not just keyword match.
- **See the shape of a field.** The knowledge graph maps how papers, authors, and ideas connect — so you can spot clusters and outliers at a glance.
- **Find what's missing.** Research Gap Discovery highlights underexplored questions in a field, so your next project starts from a real gap instead of a guess.
- **Work with your lab, not around it.** Collections and collaboration tools keep your team's reading, notes, and findings in sync.
- **Know where the field is heading.** Trend Analytics tracks momentum across topics over time.

---

## Highlights

| Feature | What it does |
|---|---|
| AI Research Copilot | Ask questions across your literature and get grounded answers |
| Semantic Search | Find relevant papers by meaning, not just keywords |
| Knowledge Graph | Visualize connections between papers, authors, and concepts |
| Research Gap Discovery | Surface underexplored questions in a field |
| Collections | Organize papers and findings into shareable sets |
| Collaboration | Work with your lab in a shared workspace |
| Trend Analytics | Track how topics and subfields evolve over time |
| Type-safe API | Fully typed client/server contract via OpenAPI + Orval |

---

## Architecture

```
Onyx-sci
├── artifacts
│   ├── api-server       # Express + Drizzle backend
│   ├── oasis-research    # Main research application
│   └── mockup-sandbox    # UI prototyping space
│
├── lib
│   └── db                # Shared database layer (Drizzle ORM + PostgreSQL)
│
└── packages
```

Each package has a single responsibility and stays composable with the rest of the system — no tangled cross-dependencies.

---

## Tech Stack

**Frontend** — React, TypeScript, Vite, Tailwind CSS, Radix UI
**Backend** — Express, Drizzle ORM, PostgreSQL
**AI** — Groq, OpenAPI, Orval

---

## Quick Start

```bash
git clone https://github.com/GSF-001/Onyx-sci.git
cd Onyx-sci
npm install
npm run dev
```

---

## Philosophy

Onyx is built around one principle:

> Research software should be modular, type-safe, fast, and maintainable.

Every package does one thing well, and stays composable with the rest of the ecosystem. No magic, no monoliths.

---

## Status

🚧 **Active development.** Interfaces, APIs, and package layouts may change before the first stable release. Expect breaking changes on `main`.

---

## Contributing

Issues and PRs are welcome. If you're picking this up as a first contribution, check open issues or start a discussion before large changes.

---

## License

MIT
