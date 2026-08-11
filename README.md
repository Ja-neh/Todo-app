# Todo App

A local-first task management application built with Next.js and SQLite.

## Third-Party Code

- **next** — Provides App Router, Server Actions, and server-side rendering for the application
- **react** — Component and UI logic
- **node:sqlite** — Local-first SQLite database persistence (built into Node.js v22+)
- **typescript** — Enforces type safety across the codebase and catches errors at compile time

## Database Design

The database consists of a single table: `tasks`.

### Table: tasks

- **id** — INTEGER PRIMARY KEY AUTOINCREMENT — Unique identifier
- **title** — TEXT NOT NULL — Task title
- **description** — TEXT DEFAULT '' — Optional details
- **dueDate** — TEXT NOT NULL — Due date in YYYY-MM-DD format
- **topic** — TEXT NOT NULL — Category (e.g., Work, Personal)
- **status** — TEXT CHECK(status IN ('Todo', 'In-Progress', 'Complete')) — Fixed workflow state
- **archived** — INTEGER DEFAULT 0 — Soft-delete flag (0 = active, 1 = archived)
- **createdAt** — TEXT DEFAULT (datetime('now')) — Creation timestamp
- **updatedAt** — TEXT DEFAULT (datetime('now')) — Last update timestamp

## Running Instructions

### Requirements

- Node.js v22.5.0 or higher (required for `node:sqlite` support)
- npm v10+ (bundled with Node.js)

## 1. Clone the repository
git clone https://github.com/Ja-neh/Todo-app.git

## 2. Enter the project directory
cd Todo-app

## 3. Install dependencies
npm install

## 4. Start the development server
npm run dev

## 5. For running tests
npm test

## AI Usage Declaration

This repository makes use of AI code generation using the following tools: Antigravity IDE[Gemini 3.6 Flash (High)].

This repository makes use of AI inline editing using the following tools: Antigravity IDE[Gemini 3.6 Flash (High)].

This repository does not use AI code review.

Full AI interaction transcripts are available in: `Transcript.md`