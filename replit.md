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

## Recent Changes

- **July 12, 2025**: Implemented comprehensive Event-Activity Management System
  - Created EventActivityManager component with multi-select functionality for adding/removing activities from events
  - Added backend API endpoints (/api/events/:eventId/activities) for managing activity-event associations
  - Implemented database operations to handle activity-event relationships with proper foreign key constraints
  - Added search functionality to filter activities by number, type, or description in activity selection dialog
  - Created bulk selection features (Select All/Deselect All) for efficient activity management
  - Integrated activity management into EventDetails Activities tab with admin-only access
  - Removed "Gerenciar Documentos das Atividades" card from Activities tab as requested by user
  - Removed complex "Detalhes das Atividades" accordion section to streamline interface
  - Added clean activity display showing associated activities with essential information
  - Implemented activity file access and details viewing functionality within Activities tab
  - Added quick action buttons for each activity: Arquivo (file download), Detalhes (full view), Remover (admin only)
  - Enhanced Activities tab to balance management functionality with activity information display
  - Added action buttons inside EventActivityManager component cards for consistent user experience
  - Removed "Atividades Associadas" section from main Activities tab to eliminate redundancy
  - **User Preference**: Activities tab should focus solely on activity management through EventActivityManager component

- **July 12, 2025**: Made Event and Approval Type fields optional in legislative activities
  - Modified database schema to remove NOT NULL constraint from event_id column
  - Updated frontend form validation to make eventId and approvalType optional fields
  - Enhanced ActivityForm.tsx with "(opcional)" labels and proper default value handling
  - Updated backend API validation schemas to accept optional eventId values
  - Modified form data processing to handle undefined eventId and approvalType values
  - Added "Nenhum evento" option in event selection dropdown for clarity
  - **FINAL FIX**: Removed strict enum validation for approvalType field to allow empty values
  - Changed validation from z.enum() to z.string().optional() for maximum flexibility
  - Updated backend approval type handling to accept any string value including empty strings
  - Fixed email notification logic to properly handle empty approval type values
  - Successfully tested with new activity creation without required event or approval type selection

- **July 9, 2025**: Implemented "Regime de Tramitação" field for legislative activities
  - Added new regimeTramitacao field to legislative activities database schema with default value "Ordinária"
  - Updated ActivityForm.tsx to include regime selection dropdown with "Ordinária" and "Urgente" options
  - Integrated validation and form handling for the new field in both creation and update workflows
  - Updated backend API routes to process and validate the new regime field
  - Enhanced legislative activity management with processing regime classification

- **July 8, 2025**: Mesa Diretora module fully implemented and tested
  - Created complete CRUD functionality for Mesa Diretora (Board of Directors) management
  - Implemented backend API endpoints for board creation, reading, updating, and deletion
  - Added comprehensive database schema with board and board_members tables
  - Created intuitive frontend interface with member selection and role assignment
  - Resolved foreign key constraint issues by properly validating user IDs
  - Tested board creation, viewing, and deletion through both API and UI
  - Added proper error handling and user feedback for all operations
  - Successfully integrated with legislature system for contextual board management
  - Implemented role-based member assignment (Presidente, Vice-Presidente, 1º Secretário, 2º Secretário)
  - Added responsive design with member avatars and proper user experience flows
  - **Final fix**: Corrected apiRequest function calls in BoardFormV2.tsx to use proper syntax (method, URL, data as separate parameters)
  - **Confirmed working**: Mesa Diretora creation and editing now fully functional after API syntax correction

- **June 23, 2025**: Implemented committee integration for event management
  - Added "Reunião Comissão" as new event category option in database and forms
  - Created event_committees junction table for many-to-many relationships between events and committees
  - Implemented conditional committee selection field that appears when "Reunião Comissão" category is selected
  - Added multi-select checkbox interface for selecting multiple committees per event
  - Updated API endpoints to handle committee associations during event creation and updates
  - Enhanced event management workflow to support committee-specific meetings
  - Created comprehensive committees listing page with search functionality
  - Added individual committee details pages with member hierarchy
  - Integrated committee member management with specific roles (Presidente, Vice-Presidente, Relator, 1º/2º/3º Suplente, Membro)
  - Fixed critical routing issue for public pages (/comissoes route not recognized)
  - Implemented clickable navigation between committees list and detail views
  - Added responsive design with statistics cards and member information display

- **June 25, 2025**: Enhanced committee dashboard with commission meeting events and legislative activities
  - Added commission meeting events display in committee details page
  - Created new API endpoint `/api/committees/:id/events` to fetch committee-specific events
  - Implemented tabbed interface with "Membros da Comissão", "Reuniões", and "Projetos de Lei" tabs
  - Added clickable event cards showing date, time, location, and status information
  - Created detailed event modal with comprehensive information including:
    - Complete event information (date, time, location, status)
    - Associated legislative activities with approval status
    - Event documents with download functionality
    - Attendance tracking for committee members
  - Enhanced user experience with hover effects and smooth interactions
  - Integrated event details fetching using existing event API endpoints
  - Added "Projetos de Lei" tab displaying bill projects associated with committee
  - Created API endpoint `/api/committees/:id/activities` with activity type filtering
  - Implemented database method `getCommitteeLegislativeActivities()` to fetch activities by committee
  - Added comprehensive bill display showing approval status, authors, descriptions, and documents
  - Integrated download functionality and detailed view links for each bill project

- **June 26, 2025**: Updated legislative activity status system with comprehensive situation tracking
  - Replaced simplified status options with detailed legislative workflow statuses
  - Updated situation options to reflect real legislative process: Arquivado, Aguardando Análise, Análise de Parecer, Aguardando Deliberação, Aguardando Despacho do Presidente, Aguardando Envio ao Executivo, Devolvida ao Autor, Pronta para Pauta, Tramitando em Conjunto, Tramitação Finalizada, Vetado
  - Modified database schema to set "Aguardando Análise" as default status for new activities
  - Updated all existing records from "Em Tramitação" to "Aguardando Análise" to maintain data consistency
  - Enhanced frontend forms with comprehensive situation selection dropdown
  - Updated backend API routes to process new situation field in creation and editing workflows
  - Integrated situation validation across all legislative activity endpoints

- **July 3, 2025**: Implemented administrative voting system for legislative activities
  - Created new backend endpoint `/api/activities/:activityId/votes/admin` for batch voting functionality
  - Implemented administrative interface allowing admins to register votes on behalf of councilors
  - Added comprehensive councilor selection with checkboxes and vote type buttons (Aprovado/Rejeitado)
  - Integrated existing vote validation to prevent duplicate voting
  - Added optional comment field for each vote registration
  - Enhanced UI with councilor avatars, names, and existing vote status display
  - Implemented real-time vote statistics updates and timeline integration
  - Added purple-themed "Registrar Votos" button visible only to administrators
  - Created responsive dialog interface with scrollable councilor list
  - Integrated loading states and success/error handling with toast notifications

- **July 5, 2025**: Enhanced committee dashboard with committee meeting events widget
  - Added committee meeting events widget to dashboard committees page in two-column layout
  - Implemented event filtering by category "Reunião Comissão" using existing backend endpoints
  - Created clickable event cards displaying event number, date, time, location, and status
  - Added comprehensive event detail modal showing complete event information
  - Integrated committee associations display for committee-specific meetings
  - Enhanced user experience with hover effects and responsive design
  - Implemented proper event data fetching with loading states and empty state handling
  - Added event detail viewing functionality with organized information sections
  - Fixed critical date formatting issue in legislative activities where dates were displaying one day earlier
  - Updated formatDate and formatDateTime functions to handle timezone issues correctly
  - Implemented proper date parsing to avoid UTC conversion problems with database dates
  - Corrected legislative activity status display system to show proper 'situacao' field
  - Changed "Status" column to "Situação" displaying actual legislative workflow status
  - Added comprehensive color coding for all legislative situations (Arquivado, Aguardando Análise, etc.)
  - Fixed status display to reflect database 'situacao' field instead of just approval status
  - Removed event detail modal in favor of direct navigation to event details page (/events/{id})
  - Enhanced document type system with three new document types: "Parecer", "Ata", and "Lista de Presença"
  - Updated document type options in DocumentForm.tsx to include new document types
  - Added color coding for new document types in DocumentList.tsx with distinct visual badges
  - Improved document categorization system to support legislative meeting documentation needs
  - Fixed committee member count display in /committees page by modifying getAllCommittees() function
  - Updated backend storage layer to include member data with user information in committee listings
  - Resolved issue where member count was showing "0 membros" instead of actual database values
  - Improved committee data structure to properly display member statistics in admin interface

- **July 6, 2025**: Enhanced voting display in event details with comprehensive legislative activity voting statistics
  - Modified "Votações" tab in event details to display all legislative activities instead of only approval-pending ones
  - Enhanced voting statistics display with visual progress bars showing approve/reject percentages
  - Improved VotingStats component with detailed vote counts and percentages for each activity
  - Added comprehensive activity information including activity number, date, type, and description
  - Implemented better visual design with badges and color-coded information for easier reading
  - Changed button text from "Analisar" to "Ver Votações" for better user understanding
  - Updated tab header to "Votações das Atividades Legislativas" with activity count badge
  - Enhanced user experience with proper loading states and empty state handling

## Changelog

- June 23, 2025. Initial setup