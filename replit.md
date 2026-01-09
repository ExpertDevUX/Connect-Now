# StreamSync - Video Conferencing Application

## Overview

StreamSync is a real-time video conferencing application that enables users to create and join video meeting rooms. The application supports WebRTC-based peer-to-peer video calls with features like screen sharing, audio/video toggling, password-protected rooms, and real-time caption translation. Built as a full-stack TypeScript application with a React frontend and Express backend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and data fetching
- **Styling**: Tailwind CSS with shadcn/ui component library (new-york style)
- **Theming**: next-themes for dark/light mode support
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **API Style**: REST API with typed route definitions in `shared/routes.ts`
- **Real-time Communication**: WebSocket server (ws library) for signaling
- **Build**: esbuild for server bundling, Vite for client bundling
- **Development**: tsx for TypeScript execution without compilation

### WebRTC Implementation
- **STUN Servers**: Google's public STUN servers for NAT traversal
- **Signaling**: WebSocket-based signaling through the Express server
- **Features**: Video/audio streaming, screen sharing, connection status tracking
- **Media Constraints**: HD video (up to 4K), echo cancellation, noise suppression

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` defines database tables
- **Migrations**: Drizzle Kit manages schema migrations in `./migrations`
- **Session Storage**: connect-pg-simple for PostgreSQL session storage

### Shared Code Pattern
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts`: Drizzle database schema and Zod validation schemas
- `routes.ts`: Typed API route definitions with input/output schemas

This pattern ensures type safety across the full stack and reduces duplication.

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Real-time Communication
- **WebSocket (ws)**: Server-side WebSocket implementation for WebRTC signaling
- **Google STUN Servers**: `stun:stun.l.google.com:19302` and related servers for peer discovery

### External APIs
- **Google Translate API**: Used for real-time caption translation (unofficial endpoint)

### UI Component Libraries
- **Radix UI**: Headless UI primitives for accessible components
- **shadcn/ui**: Pre-built component collection using Radix + Tailwind
- **Lucide React**: Icon library

### Chrome Extension
A companion Chrome extension exists in `chrome-extension/` for enhanced functionality on StreamSync pages. It requires the `activeTab` and `storage` permissions.