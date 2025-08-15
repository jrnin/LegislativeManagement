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
- **Layout Optimization**: Applied max-w-7xl container width across all public pages for better margin utilization and consistent screen width usage. Menu público redesenhado como barra flutuante centralizada com bordas arredondadas, posicionado fora do header sobrepondo elegantemente o conteúdo (Agosto 2025). Componente 'Último Evento' configurado para exibição exclusiva na página inicial, com query otimizada para economizar recursos nas demais páginas (Agosto 2025). Layout responsivo de 3 colunas implementado na página inicial com proporções 6:3:3 (50%, 25%, 25%) para otimização de espaço e melhor apresentação dos widgets (Agosto 2025). Mini banner do Instagram adicionado na terceira coluna com link para @camaradejaiba e espaçamento otimizado de 20px (Agosto 2025). Interface de abas implementada na página de detalhes do vereador, substituindo seção "Atividades Legislativas" por três abas específicas: Indicações (Lightbulb), Requerimentos (FileText) e Moção (Scale), com carregamento em tempo real dos últimos 5 registros por tipo, badges coloridos de status e formatação otimizada com texto semi-bold (Agosto 2025).

### Technical Implementations
- **Backend**: Express.js with TypeScript, PostgreSQL (Drizzle ORM), Replit Auth for session management, local file system for storage, and SendGrid for emails.
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, React Hook Form with Zod validation.
- **Mobile**: React Native with Expo, React Native Paper for UI, React Navigation v6, and Context API for authentication.
- **Database Schema**: Comprehensive schema including Users, Legislatures, Events, Legislative Activities, Documents, Committees, News System, Voting System, and Timeline.
- **Authentication**: Replit Auth, session-based authentication, role-based access control (admin, councilor, public), email verification, and password reset.
- **File Management**: Complete Object Storage integration with organized directory structure (/documents/YYYY/MM), SimpleFileUploader component replacing Uppy, presigned URL uploads, ACL policy management, seamless document creation workflow, comprehensive document details page with embedded PDF viewer, and conservative file update approach that preserves existing files during edits unless new uploads are made. Smart path update system implemented (August 2025): automatically updates file paths in database only when users upload new files, preserving existing legacy paths for seamless backward compatibility.
- **Legislative Activity Management**: Supports various activity types, detailed workflow statuses, 1:N relationship with events (allowing an activity to exist in multiple events), "Regime de Tramitação" field, and complete exercise year system allowing duplicate activity numbers across different exercise years (2024, 2025).
- **Event Management**: Comprehensive CRUD, association with legislative activities and documents, attendance tracking, and committee meeting integration.
- **Voting System**: Event-category based voting, individual and administrative voting interfaces, real-time statistics, and optimistic updates.
- **News System**: Public and administrative interfaces, complete Object Storage integration for image uploads with automatic ACL policy configuration, category filtering, and social sharing.
- **Comments System**: Advanced comment functionality with mentions (@events, #activities, !documents) and deletion.
- **Timeline System**: Comprehensive audit trail tracking user actions across major system components (activities, documents, voting, attendance, comments).
- **User Management**: Support for admin, councilor, and executive roles with comprehensive profile information display.
- **Metrics Visualization**: Councilor-specific performance metrics with Recharts library integration, including presence tracking, voting statistics (boolean-based: true=favorable, false=unfavorable), activity distribution by type, and monthly attendance charts. Real-time data visualization with bar charts and pie charts for comprehensive performance analysis.
- **Accessibility**: Comprehensive floating accessibility widget positioned on the left side with features including: high contrast mode, dark mode, adjustable font size (12-24px), text spacing enhancement, reading mode with serif fonts, sound controls, and settings persistence via localStorage. All accessibility changes apply smooth CSS transitions for better user experience.

### Feature Specifications
- **Public Interface**: Responsive pages for transparency, browsing legislative activities, document access, councilor profiles, and news.
- **Dashboard Widgets**: Displays recent events and legislative activities.
- **Search and Filtering**: Robust search and filtering capabilities across activities, events, and news.
- **Backup System**: Complete production-ready backup system with automated shell scripts for database and file backups, comprehensive web interface at /system-backups, retention policy (7 days), and 35 MB of verified backups (database: 9.2 MB, uploads: 7.7 MB, config: 156 KB, source: 560 KB).
- **Contact Form**: Fully functional contact form with email destination contato@jaiba.mg.leg.br, comprehensive validation, error handling, and SendGrid integration with development simulation mode.
- **Object Storage**: Full production-ready integration with Google Cloud Storage backend, organized directory structure (/documents/YYYY/MM/), SimpleFileUploader component with native file input, presigned URL direct uploads, ACL policy management, seamless document creation workflow, 101 legacy files (24.3 MB) migrated, avatar cleanup capabilities, complete news image management with public ACL, and public councilor avatar access for deployment compatibility. Successfully tested with PORTARIA document upload and creation (January 2025). File upload limit increased to 10MB for documents (August 2025). **Unified download system implemented (August 2025)**: Comprehensive download routes supporting both Object Storage (/objects/) and legacy local filesystem (/home/runner/) paths with automatic detection and appropriate handling for seamless file access across all storage types.
- **Real-time Features**: WebSocket support for notifications.
- **Search System**: Global site search functionality with real-time results across activities, events, documents, news, and users. Features include visual type indicators, case-insensitive ILIKE queries, authentic database results only (no mock data), and optimized SQL queries for fast response times. Successfully searches through document types like "Ata" and "Requerimento" with proper field mapping (Janeiro 2025).
- **Public Voting Statistics**: Comprehensive public API for voting statistics (`/api/public/activities/:id/votes/stats`) allowing public access to legislative voting data without authentication. System displays real voting statistics with 1251+ votes in database, enabling full transparency of legislative processes on public pages (Agosto 2025).
- **Avatar Display Fix**: Complete resolution of avatar display issues in public event attendance lists. Backend route `/api/public/events/:id/details` now converts avatar URLs from `/objects/` to `/public-objects/` format, enabling public access to user avatars without authentication. Applied consistent pattern used across all public routes for seamless avatar display in event details pages (Agosto 2025).

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