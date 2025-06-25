# Productivity App

A comprehensive productivity application built with React, TypeScript, Tailwind CSS, and Supabase. This app helps you manage tasks, track time, analyze sleep patterns, summarize emails, and organize your calendar.

## Features

- **Task Management**: Create, update, and organize your to-do lists
- **Pomodoro Timer**: Stay focused with a customizable productivity timer
- **Calendar**: Schedule and manage your events
- **Email AI Summarization**: Get concise summaries of lengthy emails
- **Sleep Pattern Recognition**: Track and analyze your sleep habits
- **User Authentication**: Secure login and registration

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (Authentication, Database, Storage)
- **Routing**: React Router
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd productivity-app
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the root directory with your Supabase credentials

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Start the development server

```bash
npm run dev
```

## Supabase Setup

1. Create a new Supabase project
2. Set up the following tables in your Supabase database:
   - `users` (handled by Supabase Auth)
   - `tasks`
   - `timer_sessions`
   - `calendar_events`
   - `email_summaries`
   - `sleep_patterns`

## Security

Set up Row Level Security (RLS) policies for each table to ensure users can only access their own data.

Example RLS policy for the `tasks` table:

```sql
create policy "Users can only access their own tasks"
on tasks
for all
using (auth.uid() = user_id);
```

## License

MIT
