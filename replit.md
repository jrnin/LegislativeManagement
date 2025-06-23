# Sistema de Gerenciamento Legislativo - Replit.md

## Overview

This is a comprehensive legislative management system built with a modern full-stack architecture. The system provides functionality for managing legislative processes, events, documents, activities, and user management for municipal chambers. It includes both administrative interfaces and public-facing pages for transparency and citizen engagement.

## System Architecture

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth integration with session management
- **File Storage**: Local file system with organized upload directories
- **Email Service**: SendGrid for transactional emails
- **Real-time Features**: WebSocket support for notifications

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state
- **UI Components**: Shadcn/ui component library
- **Styling**: Tailwind CSS with custom theme configuration
- **Forms**: React Hook Form with Zod validation

### Mobile Application
- **Framework**: React Native with Expo
- **UI Library**: React Native Paper
- **Navigation**: React Navigation v6
- **State Management**: Context API for authentication

## Key Components

### Database Schema (Drizzle ORM)
- **Users**: Authentication and profile management
- **Legislatures**: Legislative session periods
- **Events**: Legislative sessions and meetings
- **Legislative Activities**: Bills, proposals, and legislative actions
- **Documents**: File attachments and legislative documents
- **Committees**: Legislative committees and memberships
- **News System**: Articles, categories, and comments
- **Voting System**: Document and activity voting
- **Timeline**: Activity tracking and audit trail

### Authentication System
- Replit Auth integration for SSO
- Session-based authentication with PostgreSQL storage
- Role-based access control (admin, councilor, public)
- Email verification system
- Password reset functionality

### File Management
- Multi-tier upload system (documents, avatars, general files)
- File type validation and security
- Organized directory structure
- Download and preview capabilities

### Public Interface
- Responsive public pages for transparency
- Legislative activity browsing
- Document access and search
- Councilor profiles and information
- News and announcements system

## Data Flow

1. **Authentication Flow**: User login → Session creation → Role-based access
2. **Document Flow**: Upload → Validation → Storage → Association with activities/events
3. **Legislative Process**: Activity creation → Approval workflow → Voting → Publication
4. **Public Access**: Read-only access to approved content → Search and filtering
5. **Notification System**: Real-time updates via WebSocket → Email notifications

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **Authentication**: Replit Auth system integration
- **Email**: SendGrid for transactional emails
- **File Processing**: Multer for file uploads
- **Validation**: Zod for schema validation
- **UI Framework**: Radix UI primitives with custom styling

### Development Tools
- **Build**: Vite for frontend bundling
- **Database**: Drizzle Kit for migrations
- **Runtime**: tsx for TypeScript execution
- **Styling**: PostCSS with Tailwind CSS

## Deployment Strategy

### Production Build
- Frontend: Vite build process creates optimized static assets
- Backend: esbuild bundles server code for Node.js execution
- Database: Drizzle migrations handle schema updates

### Environment Configuration
- Database connection via DATABASE_URL
- SendGrid API key for email services
- Session secret for authentication security
- File upload paths and limits

### Hosting Requirements
- Node.js 20+ runtime environment
- PostgreSQL database (Neon recommended)
- File storage with appropriate permissions
- HTTPS for secure authentication

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 23, 2025. Initial setup