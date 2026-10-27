# AgriAgent - Autonomous Farm Operations System

## Project Overview
An Agentic AI-driven autonomous farm operations management platform built for hackathons. It integrates crop health telemetry, weather forecasts, soil condition sensors, and shared cross-farm resource availability to autonomously plan, adapt, and coordinate farm operations.

When unexpected events happen (pest outbreak, storm warning, equipment breakdown), the multi-agent system autonomously recalculates task priorities, reallocates shared resources across multiple farms, and pushes notifications/actions in real-time.

---

## 12-Hour Hackathon Execution Roadmap

| Hour Window | Phase | Key Deliverables |
|---|---|---|
| **H0 - H2** | **Foundation & Architecture** | Project setup (MERN monorepo), DB schema design, Seed mock farm data & resources. |
| **H2 - H5** | **Backend Core & Agentic Engine** | Express REST API, Gemini-powered Agent orchestration, tool definitions (weather, crop, resource). |
| **H5 - H8** | **Frontend Control Center** | React + Tailwind dashboard, dynamic task timeline/kanban, multi-farm resource view. |
| **H8 - H10** | **Reactive Loop & Demo Simulator** | Real-time agent thought logs, interactive incident simulator (storm, blight, tractor failure). |
| **H10 - H11** | **Testing & Polish** | End-to-end event simulation validation, UI polish, edge-case safety fallback. |
| **H11 - H12** | **Demo Prep & Pitch Ready** | 3-minute pitch script, recorded backup demo video/gif, clear README. |

---

## Architecture & Tech Stack

- **Frontend**: React 18 / 19, Vite, Tailwind CSS, Lucide Icons, Axios.
- **Backend**: Node.js, Express.js, WebSockets / Server-Sent Events (SSE) for live agent reasoning traces.
- **Database**: MongoDB (Mongoose) with mock/in-memory fallback support.
- **Agentic AI**: Google Gemini API (`@google/genai` or `@google/generative-ai`) with structured tool calling & multi-agent supervisor pattern.

### Multi-Agent Layout
1. **Farm Supervisor Agent**: Orchestrates decisions, coordinates sub-agents, resolves conflicting farm needs.
2. **Weather Sentinel Agent**: Analyzes weather forecast and rain/storm impact on field tasks.
3. **Agronomist Health Agent**: Evaluates crop imagery & soil conditions for blight, irrigation urgency, and pest vectors.
4. **Logistics & Resource Agent**: Manages shared fleets (tractors, spray drones, labor teams) across Farm Alpha and Farm Beta without resource collisions.

---

## Repository Structure

```
hackoween/
├── CLAUDE.md                   # Project conventions, architecture, and hackathon guidelines
├── README.md                   # Public project pitch and setup instructions
├── .gitignore                  # Standard ignore rules
├── server/                     # Backend Node.js / Express
│   ├── package.json
│   ├── src/
│   │   ├── config/             # DB & Gemini API config
│   │   ├── models/             # Farm, Resource, Task, AgentLog schemas
│   │   ├── agents/             # Multi-agent system & tool definitions
│   │   │   ├── supervisor.js
│   │   │   ├── weatherAgent.js
│   │   │   ├── agronomyAgent.js
│   │   │   ├── resourceAgent.js
│   │   │   └── tools/
│   │   ├── controllers/        # Express handlers
│   │   ├── routes/             # API routes (/api/farms, /api/tasks, /api/simulate)
│   │   └── seeds/              # Seed script for realistic multi-farm demo
│   └── index.js
└── client/                     # Frontend React + Vite
    ├── package.json
    ├── src/
    │   ├── components/         # FarmMap, TaskBoard, AgentThoughtLog, SimulatorPanel
    │   ├── context/            # Real-time state / WebSocket listener
    │   ├── services/           # Axios API client
    │   └── App.jsx
```

---

## Git Commit Discipline & Conventions

Use semantic commit messages to keep a clean, professional git history for judges to review:

- `feat(scope): ...` for new features (e.g., `feat(agent): implement supervisor task rescheduling logic`)
- `fix(scope): ...` for bug fixes (e.g., `fix(client): resolve resource double-booking UI bug`)
- `chore(scope): ...` for dependency, config, or boilerplate updates
- `docs(scope): ...` for documentation and demo notes
- `style(scope): ...` for CSS/Tailwind UI polish

### Recommended Commit Milestones
1. `chore(init): project setup, CLAUDE.md guidelines and repo structure`
2. `feat(server): define mongoose schemas for farms, resources, tasks, and telemetry`
3. `feat(server): create realistic multi-farm demo seed data and basic CRUD routes`
4. `feat(agent): implement gemini-powered weather, crop health, and resource optimizer agents`
5. `feat(server): add incident simulation trigger endpoint with reasoning trace streaming`
6. `feat(client): bootstrap react-vite app with tailwind css and layout structure`
7. `feat(client): build real-time task board and multi-farm resource allocation dashboard`
8. `feat(client): add interactive incident simulator and live agent thought feed`
9. `docs(pitch): update README with pitch narrative, architecture diagram, and setup instructions`

---

## Demo Pitch Scenario (The Winning Narrative)
1. **Normal State**: Show Farm A (corn) and Farm B (wheat) operating smoothly. A single spray drone is booked for Farm B tomorrow.
2. **Sudden Crisis**: Click **"Simulate Heavy Rain & Leaf Blight Alert"** on Farm A.
3. **Agent Live Deliberation**: Show the live agent thinking feed in the UI:
   - Weather Agent detects incoming rain in 18 hours (cancels standard spraying on Farm A to avoid chemical runoff).
   - Agronomist Agent spots urgent fungal risk needing immediate bio-fungicide within 6 hours.
   - Resource Agent preempts the shared spray drone from Farm B, reassigns it to Farm A immediately, and shifts Farm B's non-urgent fertilizing to day after tomorrow.
4. **Result**: Dynamic task board updates in real time with zero human intervention required, saving crop yields and avoiding resource collision.

