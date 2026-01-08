# StreamSync - Real-time Video Communication Platform

## Overview

StreamSync is a real-time video calling application that enables users to create and join video rooms for peer-to-peer communication. The platform supports room creation with optional password protection, WebRTC-based video/audio streaming, and real-time signaling through WebSockets.

The application follows a monorepo structure with a React frontend, Express backend, and PostgreSQL database. It uses modern web technologies including WebRTC for media streaming and WebSockets for real-time signaling between peers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with custom plugins for Replit integration
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Theming**: next-themes for dark/light mode support

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with tsx for development
- **API Design**: RESTful endpoints defined in shared routes with Zod validation
- **Real-time**: WebSocket server (ws) for signaling
- **Build**: esbuild for production bundling with selective dependency bundling

### Database Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit with `db:push` command

### Real-time Communication
- **WebRTC**: Peer-to-peer video/audio with STUN servers (Google's public STUN)
- **Signaling**: WebSocket connection at `/ws` relative path for offer/answer/ICE candidate exchange
- **Media Constraints**: 720p video at 30fps with echo cancellation and noise suppression

### Shared Code Pattern
- **Location**: `shared/` directory contains code used by both client and server
- **Routes**: Type-safe API route definitions with Zod schemas in `shared/routes.ts`
- **Schema**: Database schema and insert types in `shared/schema.ts`
- **Path Aliases**: `@shared/*` maps to shared directory

### Key Design Decisions
1. **Monorepo Structure**: Client, server, and shared code in single repository for type safety across boundaries
2. **Schema-First Validation**: Zod schemas define API contracts, used for both client and server validation
3. **Component Library**: shadcn/ui provides accessible, customizable UI primitives
4. **WebRTC Direct**: No media server - pure P2P connections for simplicity and lower latency

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage in PostgreSQL (available but sessions not currently implemented)

### WebRTC Infrastructure
- **STUN Servers**: 
  - `stun:stun.l.google.com:19302`
  - `stun:stun1.l.google.com:19302`
- No TURN server configured - may cause issues behind strict NATs/firewalls

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI primitives (used by shadcn/ui)
- **framer-motion**: Animation library
- **wouter**: Lightweight routing
- **next-themes**: Theme management

### Build & Development
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **drizzle-kit**: Database migrations and schema management
- **tsx**: TypeScript execution for development