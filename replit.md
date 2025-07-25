# Smart Email Prioritizer

## Overview

This is a Smart Email Prioritizer application that detects spam and phishing emails using Machine Learning and GPT API, while prioritizing emails from trusted senders. The application features a beautiful, responsive UI with glassmorphism design, dark themes, and smooth animations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack TypeScript architecture with a clear separation between frontend and backend components:

### Frontend Architecture
- **Framework**: React with TypeScript and Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom glassmorphic design and dark theme
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Email Analysis**: 
  - Simple ML classifier using keyword analysis and heuristics
  - OpenAI GPT API integration for advanced phishing detection
- **Session Management**: In-memory storage for development (can be extended to use PostgreSQL sessions)

## Key Components

### Core Features
1. **Email Analysis Engine**
   - ML-based classification using keyword matching and pattern recognition
   - GPT-powered analysis for phishing risk assessment and reasoning
   - Trusted sender verification system
   - Risk scoring algorithm combining ML and GPT results

2. **Email Management**
   - Email categorization (trusted, suspicious, spam)
   - Risk score calculation (0-100 scale)
   - Email filtering and search capabilities
   - Bulk operations support

3. **Trusted Sender Management**
   - Add/remove trusted senders
   - Email domain verification
   - Automatic prioritization for trusted contacts

### UI Components
- **EmailCard**: Displays individual emails with risk indicators and actions
- **EmailInput**: Form for analyzing new emails
- **FilterTabs**: Category-based email filtering
- **StatsPanel**: Analytics dashboard showing email statistics
- **TrustedSendersPanel**: Management interface for trusted contacts

## Data Flow

1. **Email Analysis Process**:
   - User submits email (sender, subject, body)
   - System checks if sender is in trusted list
   - ML classifier analyzes content for spam/phishing indicators
   - GPT API provides detailed risk assessment and reasoning
   - Combined results determine final category and risk score
   - Email is stored with analysis results

2. **Display and Filtering**:
   - Emails are fetched and displayed in categorized lists
   - Real-time filtering by category (all, trusted, suspicious, spam)
   - Statistics are calculated and displayed in analytics panel

3. **Trusted Sender Management**:
   - Users can add/remove trusted senders
   - System automatically prioritizes emails from trusted sources
   - Trusted status overrides ML/GPT risk assessments

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM
- **openai**: GPT API integration for advanced email analysis
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Comprehensive UI component library
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production builds
- **vite**: Frontend build tool and development server
- **drizzle-kit**: Database schema management and migrations

## Deployment Strategy

### Development Environment
- Frontend served by Vite dev server with HMR
- Backend runs with tsx for TypeScript execution
- Database migrations handled by Drizzle Kit
- Environment variables for database and API keys

### Production Build
- Frontend built with Vite and served as static files
- Backend bundled with esbuild for Node.js execution
- Database schema pushed using Drizzle Kit
- Neon Database provides serverless PostgreSQL hosting

### Environment Configuration
- `DATABASE_URL`: Neon PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for GPT analysis
- `NODE_ENV`: Environment mode (development/production)

### File Structure
```
├── client/          # React frontend application
├── server/          # Express.js backend API
├── shared/          # Shared TypeScript types and schemas
├── migrations/      # Database migration files
└── dist/           # Production build output
```

The application is designed to be easily deployable on platforms like Replit, with automatic database provisioning through Neon and seamless integration between frontend and backend components.