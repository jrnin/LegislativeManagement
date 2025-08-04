# Sistema de Gerenciamento Legislativo

## Overview
This is a comprehensive legislative management system designed for municipal chambers. It streamlines legislative processes, manages events, documents, activities, and users. The system includes both administrative interfaces for chamber staff and public-facing pages to promote transparency and citizen engagement. Its core capabilities include managing legislative activities, events, and documents, with robust authentication, file management, and a dedicated public interface. The vision is to provide a complete digital solution for municipal legislative bodies, enhancing efficiency and public access to information.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Color Schemes**: Primarily uses Tailwind CSS with custom theme configuration, incorporating specific color codes (e.g., green for approved, red for rejected, pink for "Projeto de Decreto Legislativo").
- **Component Library**: Leverages Shadcn/ui for consistent and modern UI components.
- **Design Approach**: Emphasizes responsive design, clean layouts, and intuitive interfaces. Examples include streamlined image galleries, simplified login, and clear visual indicators for required fields and legislative statuses.
- **Visual Enhancements**: Incorporates subtle animations, hover effects, gradient stylings, and enhanced typography for an improved user experience.

### Technical Implementations
- **Backend**: Express.js with TypeScript, PostgreSQL (Drizzle ORM), Replit Auth for session management, local file system for storage, and SendGrid for emails.
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, React Hook Form with Zod validation.
- **Mobile**: React Native with Expo, React Native Paper for UI, React Navigation v6, and Context API for authentication.
- **Database Schema**: Comprehensive schema including Users, Legislatures, Events, Legislative Activities, Documents, Committees, News System, Voting System, and Timeline.
- **Authentication**: Replit Auth, session-based authentication, role-based access control (admin, councilor, public), email verification, and password reset.
- **File Management**: Multi-tier upload system with Object Storage integration, validation, organized directory structure, download, preview, and persistent cloud storage.
- **Legislative Activity Management**: Supports various activity types, detailed workflow statuses, 1:N relationship with events (allowing an activity to exist in multiple events), "Regime de Tramitação" field, and complete exercise year system allowing duplicate activity numbers across different exercise years (2024, 2025).
- **Event Management**: Comprehensive CRUD, association with legislative activities and documents, attendance tracking, and committee meeting integration.
- **Voting System**: Event-category based voting, individual and administrative voting interfaces, real-time statistics, and optimistic updates.
- **News System**: Public and administrative interfaces, complete Object Storage integration for image uploads with automatic ACL policy configuration, category filtering, and social sharing.
- **Comments System**: Advanced comment functionality with mentions (@events, #activities, !documents) and deletion.
- **Timeline System**: Comprehensive audit trail tracking user actions across major system components (activities, documents, voting, attendance, comments).
- **User Management**: Support for admin, councilor, and executive roles with comprehensive profile information display.
- **Accessibility**: Dark mode and high contrast mode features for improved accessibility.

### Feature Specifications
- **Public Interface**: Responsive pages for transparency, browsing legislative activities, document access, councilor profiles, and news.
- **Dashboard Widgets**: Displays recent events and legislative activities.
- **Search and Filtering**: Robust search and filtering capabilities across activities, events, and news.
- **Backup System**: Automated shell scripts for database and file backups, with an administrative web interface and retention policy.
- **Object Storage**: Persistent cloud storage integration using Replit Object Storage with Google Cloud Storage backend, ACL policies, presigned URLs for direct uploads, seamless migration from local file system, full document module compatibility with 101 files (24.3 MB) successfully migrated, avatar cleanup capabilities with complete file removal from cloud storage, and complete news image management with public ACL policies for transparent access.
- **Real-time Features**: WebSocket support for notifications.

## External Dependencies
- **Database**: PostgreSQL (`@neondatabase/serverless` for serverless connection), Drizzle ORM, Drizzle Kit for migrations.
- **Authentication**: Replit Auth system.
- **Email**: SendGrid.
- **File Processing**: Multer for file uploads.
- **Validation**: Zod.
- **UI Framework**: Radix UI primitives.
- **Build Tools**: Vite (frontend), esbuild (backend).
- **Runtime**: tsx.
- **Styling**: PostCSS, Tailwind CSS.
- **Monitoring**: New Relic APM.
- **Weather API**: Open-Meteo API for real-time weather data.