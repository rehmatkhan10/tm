# Task Manager (TM)

A full-stack Task Manager application built as part of the **Advanced Full Stack Development & Software Testing** course. This project demonstrates modern web development practices using React, Hono, and Cloudflare Workers.

🌐 **Live Demo:** [https://tm.rehmatkhan.workers.dev/login](https://tm.rehmatkhan.workers.dev/login)

📚 **Repository:** [https://github.com/rehmatkhan10/tm](https://github.com/rehmatkhan10/tm)

## ✨ Features

- 📝 **Task Management** - Create, read, update, and delete tasks
- 🔐 **User Authentication** - Secure login/signup with Better Auth
- 📊 **Status Tracking** - Track tasks with statuses (todo, in-progress, done)
- 🎯 **Drag & Drop** - Reorder tasks with intuitive drag-and-drop
- 🌙 **Dark Mode** - Built-in theme support
- ⚡ **Edge Deployment** - Runs on Cloudflare Workers globally

## 🛠️ Tech Stack

### Frontend

- [**React 19**](https://react.dev/) - UI library
- [**TanStack Router**](https://tanstack.com/router) - Type-safe routing
- [**TanStack Query**](https://tanstack.com/query) - Data fetching & caching
- [**Tailwind CSS**](https://tailwindcss.com/) - Styling
- [**Radix UI**](https://www.radix-ui.com/) - Accessible UI components
- [**dnd-kit**](https://dndkit.com/) - Drag and drop functionality

### Backend

- [**Hono**](https://hono.dev/) - Lightweight web framework
- [**Drizzle ORM**](https://orm.drizzle.team/) - TypeScript ORM
- [**Cloudflare D1**](https://developers.cloudflare.com/d1/) - Serverless SQLite database
- [**Better Auth**](https://better-auth.com/) - Authentication library
- [**Zod**](https://zod.dev/) - Schema validation

### Build & Deploy

- [**Vite**](https://vite.dev/) - Build tool
- [**Cloudflare Workers**](https://developers.cloudflare.com/workers/) - Edge runtime
- [**Wrangler**](https://developers.cloudflare.com/workers/wrangler/) - CLI for Cloudflare

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- bun
- Cloudflare account (for deployment)

### Installation

```bash
# Clone the repository
git clone [https://github.com/rehmatkhan10/tm.git](https://github.com/rehmatkhan10/tm.git)
cd tm

# Install dependencies
bun install
