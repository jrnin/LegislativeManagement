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

- **July 17, 2025**: Translated "councilor" to "Vereador(a)" System-wide - LOCALIZATION IMPROVEMENT
  - **Complete Translation**: Successfully translated all occurrences of "councilor" term to "Vereador(a)" throughout the system
  - **CouncilorList.tsx Updates**: Updated role display and button text to use "Vereador(a)" instead of "Vereador"
  - **AdminVotingSection.tsx Enhancement**: Updated voting selection message to use inclusive "Vereador(a)" terminology
  - **ActivityDetails.tsx Improvement**: Updated comment placeholder text to use "Vereador(a)" for inclusive language
  - **EventDetails.tsx Enhancements**: Updated all toast messages and error descriptions to use "Vereador(a)" and "Vereadores(as)"
  - **CommitteeEditModal.tsx Updates**: Updated loading messages and error states to use inclusive "Vereadores(as)" terminology
  - **EventDetailsPage.tsx Final Fix**: Fixed attendance list display to show "Vereador(a)" instead of "councilor" in public event details
  - **Inclusive Language**: Implemented gender-inclusive language throughout the municipal legislative system
  - **User Experience**: Improved accessibility and inclusivity for all users regardless of gender identity
  - **Consistency**: Maintained consistent terminology across administrative and public interfaces
  - **Status**: Complete system-wide translation confirmed across all components and user-facing messages

- **July 17, 2025**: Implemented Public Voting Tab for Event Details - PUBLIC INTERFACE ENHANCEMENT
  - **New "Votações" Tab**: Successfully added voting statistics tab to public event details page (EventDetailsPage.tsx)
  - **Comprehensive Voting Display**: Shows voting statistics for all legislative activities within each event
  - **Visual Progress Bars**: Implemented horizontal progress bars showing approval/rejection percentages with color coding
  - **Detailed Statistics**: Displays total votes, approval count, rejection count, and percentages for each activity
  - **Smart Data Loading**: Voting statistics load automatically when "Votações" tab is selected for optimal performance
  - **Overview Integration**: Added voting counter to "Visão Geral" tab showing total votes across all activities
  - **Real-time Statistics**: Fetches current voting data from /api/activities/:id/votes/stats endpoint with event context
  - **Public Access**: Fully accessible to public users without authentication requirements
  - **Responsive Design**: Optimized layout for desktop and mobile viewing with proper spacing and typography
  - **Empty State Handling**: Graceful display when no votes are registered for activities
  - **Visual Consistency**: Maintains same design language as administrative voting interface with green/red color scheme
  - **Status**: Fully functional public voting statistics display confirmed working by user testing

- **July 17, 2025**: Implemented Complete Optimistic Updates System - MAJOR PERFORMANCE ENHANCEMENT
  - **Comprehensive Optimistic Updates**: Added immediate UI feedback for Activities, Attendance, and Voting tabs
  - **Activities Tab Enhancement**: EventActivityManager displays current activities immediately without server delay
  - **Attendance System Optimization**: Lista de Presença updates instantly when registering councilor attendance
  - **Voting System Enhancement**: Voting statistics update immediately for both individual and administrative voting
  - **Local State Management**: Implemented proper local state synchronization with server data across all tabs
  - **React Hooks Fix**: Resolved "rendered more hooks than previous render" error by repositioning useEffect calls
  - **Individual Voting Optimization**: User votes display immediately with real-time statistics updates
  - **Administrative Voting Enhancement**: Bulk voting registration updates statistics instantly
  - **Performance Optimization**: Reduced server round-trips by using optimistic updates with fallback error handling
  - **Real-time Interface**: All three tabs now provide immediate visual feedback during CRUD operations
  - **Error Handling**: Implemented proper rollback mechanisms for failed operations
  - **User Experience**: Eliminated loading delays - all operations appear instantly with smooth transitions
  - **Status**: Complete system with instant response times for activity management, attendance tracking, and voting operations

- **July 17, 2025**: Implemented Direct Event Navigation from Committee Meeting Cards - USER EXPERIENCE IMPROVEMENT
  - **Navigation Enhancement**: Updated committee meeting cards in /committees page to redirect directly to event details
  - **Modal Removal**: Removed event detail modal in favor of direct navigation to /events/{id} pages
  - **Code Cleanup**: Removed unused state variables and dialog components for event details
  - **User Experience**: Streamlined workflow by allowing users to click meeting cards and go directly to full event pages
  - **Implementation**: Changed onClick handler from modal display to `setLocation('/events/${event.id}')`
  - **Status**: Fully functional direct navigation from committee meeting cards to event detail pages

- **July 17, 2025**: Removed "Projetos de Lei" Tab from Committee Details - USER INTERFACE IMPROVEMENT
  - **Tab Removal**: Successfully removed the "Projetos de Lei" tab from committee detail pages per user request
  - **UI Optimization**: Updated tab layout from 3 columns to 2 columns for better visual balance
  - **Code Cleanup**: Removed unused queries and imports related to committee bill tracking
  - **Interface Streamlining**: Committee details now focus on "Membros da Comissão" and "Reuniões" tabs only
  - **User Experience**: Simplified committee interface by removing redundant bill project display
  - **Status**: Fully functional committee detail page with streamlined interface

- **July 17, 2025**: Enhanced Councilor Profile Information Display - COMPREHENSIVE DATABASE INTEGRATION
  - **Complete Database Integration**: Successfully updated councilor profile "Informações Básicas" tab to display all available database fields
  - **Organized Information Sections**: Restructured display into four logical sections:
    - **Dados Pessoais**: Name, CPF, birth date, marital status, profession, education, political party, role
    - **Contato**: Email address and email verification status with visual badges
    - **Endereço**: Complete address information including street, number, neighborhood, city, state, ZIP code
    - **Informações do Sistema**: Registration date, last update, user ID, and legislature association
  - **Enhanced Data Presentation**: Added proper date formatting for timestamps and improved field labeling
  - **Visual Improvements**: Implemented section headers with borders, consistent field spacing, and status badges
  - **Database Field Mapping**: Mapped all user schema fields to display components for complete information visibility
  - **User Experience**: Replaced generic field names with Portuguese labels appropriate for municipal context
  - **Legislative Activities Tab Enhancement**: Comprehensive display of all database fields including:
    - Activity type, number, date, description with proper formatting
    - Regime de tramitação (processing regime) and approval type information
    - Situação (status) with color-coded badges for all legislative workflow stages
    - Approval details including approver, approval date, and comments
    - Creation and update timestamps with proper date formatting
    - File download functionality for activities with attachments
  - **Documents Tab Enhancement**: Complete database information display including:
    - Document type, number, date, description with detailed formatting
    - Author type (Legislative/Executive) and file information
    - Activity and event associations with ID references
    - Document versioning information for parent-child relationships
    - Status tracking with color-coded badges (Vigente, Revogada, Alterada, Suspenso)
    - Creation and update timestamps with comprehensive date formatting
    - Download functionality for documents with file attachments
  - **Status**: Fully functional comprehensive profile information system displaying all database data across all tabs

- **July 16, 2025**: Implemented True 1:N Relationship for Legislative Activities - MAJOR ARCHITECTURAL ENHANCEMENT
  - **Database Architecture**: Successfully implemented proper one-to-many relationship allowing same legislative activity to exist in multiple events
  - **Activity Duplication System**: Created intelligent activity duplication mechanism that:
    - Preserves original activity when not associated with any event
    - Creates activity copies when adding to new events if activity already has eventId
    - Maintains all original data including authors, description, and metadata
  - **Enhanced Storage Layer**: Updated `addActivitiesToEvent()` method to handle true 1:N relationships:
    - Checks if activity already exists in target event to prevent duplicates
    - Automatically associates activities without eventId to new events
    - Duplicates activities with existing eventId to maintain data integrity
    - Copies all related data including authors and metadata
  - **Improved Removal Logic**: Enhanced `removeActivityFromEvent()` to handle activity lifecycle:
    - Deletes duplicate activities when other instances exist
    - Preserves original activity by setting eventId to null when it's the only instance
    - Maintains referential integrity across all related tables
  - **Unique Activity Display**: Modified `getAllLegislativeActivities()` to show only unique activities:
    - Groups activities by activityNumber and activityType
    - Prioritizes original activities (without eventId) over duplicates
    - Maintains consistent user experience in activity selection
  - **Visual Indicators**: Added "Já no evento" badges in EventActivityManager to show current associations
  - **User Experience**: Updated interface descriptions to clearly communicate new functionality
  - **Status**: Fully functional 1:N relationship system allowing same legislative activity across multiple events

- **July 14, 2025**: Completed Comprehensive Timeline Integration System - MAJOR SYSTEM ENHANCEMENT
  - **Comprehensive Action Tracking**: Successfully integrated timeline tracking across all major system components
  - **Activity Management Integration**: Added automatic timeline entries for activity addition/removal in EventActivityManager
    - Tracks when activities are added to events with full activity details
    - Records when activities are removed from events with complete context
  - **Document Management Integration**: Implemented timeline tracking for document associations in EventDocumentManager
    - Captures document additions to events with document type and title information
    - Logs document removals from events with complete document details
  - **Voting System Integration**: Added comprehensive voting action tracking
    - Individual user votes tracked with vote type (favorável/contrário) and activity details
    - Administrative bulk voting tracked with vote counts and approval statistics
  - **Attendance System Integration**: Implemented presence tracking for all attendance updates
    - Self-attendance registration tracked with user name and status
    - Administrative attendance updates tracked with councilor information
  - **Comments System Integration**: Enhanced comment tracking with creation and deletion actions
    - Comment creation tracked with content preview (first 100 characters)
    - Comment deletion tracked with appropriate timeline entries
  - **Real-time Timeline Updates**: All actions are automatically recorded in real-time without user intervention
  - **Complete User Experience**: Timeline now provides comprehensive audit trail of all legislative activities
  - **Status**: Fully functional system with complete integration across all major components - confirmed working by user testing

- **July 14, 2025**: Refined Event Timeline System - MAJOR IMPROVEMENT
  - **User Request**: Removed visualizations of tabs from timeline to show only meaningful actions
  - **Database Cleanup**: Removed all timeline entries for tab views (activity_view, document_view, comment_view, attendance_view, voting_view)
  - **Timeline Actions Updated**: System now tracks only insertion, alteration, and deletion actions:
    - Activity management: activity_add, activity_remove
    - Document management: document_add, document_remove
    - Comments: comment_create, comment_edit, comment_delete
    - Attendance: attendance_update
    - Voting: vote_cast, admin_vote
  - **Frontend Updates**: Updated EventTimeline component to display new action types with appropriate icons and colors
  - **Code Cleanup**: Removed all tab navigation tracking from EventDetails.tsx
  - **Improved User Experience**: Timeline now shows only meaningful user actions without noise from tab switching
  - **Status**: Fully functional timeline system showing only relevant user actions

- **July 14, 2025**: Implemented Comprehensive Event Timeline System - MAJOR FEATURE ENHANCEMENT
  - **Complete Timeline Infrastructure**: Successfully created comprehensive timeline system for tracking all user activities within events
  - **Database Schema**: Created `event_timeline` table with fields: id, event_id, user_id, action_type, target_type, target_id, description, metadata, created_at
  - **API Endpoints**: Added `/api/events/:id/timeline` endpoints for fetching and creating timeline entries
  - **Frontend Components**: Created EventTimeline component with modern visual interface showing user actions with timestamps and details
  - **Automatic Tracking**: Implemented automatic tracking of user actions including:
    - Navigation between event tabs (activities, documents, attendance, voting, comments)
    - Creation of comments with content preview
    - Viewing of specific activities and documents
    - Real-time updates every 5 seconds
  - **User Experience**: Added timeline as new tab in event details with clean interface showing user avatars, action types, and descriptions
  - **Integration**: Seamlessly integrated with existing authentication system and event management workflow
  - **Visual Design**: Timeline displays with color-coded action types, user information, and chronological ordering
  - **Performance**: Optimized with proper database indexing and efficient queries
  - **Status**: Fully functional system ready for production use with comprehensive activity tracking

- **July 14, 2025**: Completed Advanced Comments System with Full Mention Navigation + Comment Deletion - MAJOR FEATURE ENHANCEMENT
  - **Complete Mention System**: Successfully implemented comprehensive mention functionality with @ for events, # for activities, and ! for documents
  - **Navigation Integration**: All mentions now render as clickable blue buttons that navigate to corresponding detail pages
  - **API Optimization**: Fixed comment creation to use proper current mentions tracking instead of re-parsing comment text
  - **Page Creation**: Created DocumentDetails page with complete document information display and download functionality
  - **Route Integration**: Added /documents/:id route to App.tsx for proper document detail navigation
  - **Visual Enhancement**: Mentions display with consistent blue styling and hover effects for better user experience
  - **Real-time Updates**: Comment creation properly resets mention state and refreshes comment list
  - **Complete Navigation Flow**: 
    - @ mentions → /events/{id} (EventDetails page)
    - # mentions → /activities/{id} (ActivityDetails page)
    - ! mentions → /documents/{id} (DocumentDetails page)
  - **Comment Deletion System**: Implemented complete comment deletion functionality
    - Red trash button visible only to comment authors and administrators
    - Confirmation dialog before deletion to prevent accidental removal
    - Real-time interface updates after successful deletion
    - Proper authorization checks in backend (user must be comment author or admin)
    - Success/error toast notifications with appropriate messaging
  - **User Testing**: Confirmed working with real-time suggestion display, successful navigation to all target pages, and comment deletion
  - **Database Integration**: Comments with mentions properly stored and retrieved with clickable rendering, deletion removes from database
  - **Status**: System fully functional and tested successfully with all CRUD operations for comments

- **July 14, 2025**: Implemented Event-Category Based Voting System - MAJOR ARCHITECTURAL CHANGE
  - **Database Schema Update**: Added `event_id` column to `activity_votes` table with NOT NULL constraint
  - **Migration Completed**: Successfully migrated all existing votes to include event associations
  - **Unique Constraint**: Added `unique_activity_event_user_vote` constraint to prevent duplicate votes per event
  - **Backend API Updates**: Modified all voting endpoints to support event-based voting:
    - `/api/activities/:activityId/votes` - Now accepts `eventId` query parameter
    - `/api/activities/:activityId/votes/admin` - Now requires `eventId` in request body
    - `/api/activities/:activityId/votes/my` - Now accepts `eventId` query parameter
    - `/api/activities/:activityId/votes/stats` - Now accepts `eventId` query parameter
  - **Storage Layer Enhancement**: Updated all voting methods to handle event context:
    - `getActivityVotesByActivityAndEvent()` - New method for event-specific votes
    - `getActivityVoteByUserActivityAndEvent()` - New method for user's vote in specific event
    - `getActivityVotesStatsByEvent()` - New method for event-specific voting statistics
    - `createActivityVote()` - Updated to enforce event-based voting validation
  - **Frontend Component Updates**: Modified all voting components to pass and handle `eventId`:
    - `AdminVotingSection` - Updated to accept and send `eventId`
    - `VotingStats` - Updated to display event-specific statistics
    - `EventDetails` - Updated all voting queries to include event context
  - **Key Benefits**:
    - Same legislative activity can now be voted on multiple times across different event categories
    - Voting results are properly separated by event type (Sessão Ordinária, Extraordinária, Reunião Comissão)
    - Historical voting data is preserved and properly contextualized
    - Admin voting system now supports event-specific vote registration
    - Real-time statistics are accurate for each event context
  - **Validation**: Confirmed system working with existing data showing proper event associations

- **July 12, 2025**: Implemented Administrative Voting System for Event Details
  - Added AdminVotingSection component to "Ver Votações" dialog in event details
  - Integrated multi-select councilor voting interface with approve/reject options
  - Added optional comment fields for each vote registration
  - Implemented auto-loading of councilors when admin opens voting dialog
  - Connected to existing backend `/api/activities/:activityId/votes/admin` endpoint
  - Enhanced voting statistics display with real-time updates after vote registration
  - Added proper authentication and role-based access control for admin-only voting
  - Created comprehensive councilor selection interface showing existing vote status
  - Implemented bulk vote registration with proper validation and error handling
  - Added toast notifications for successful vote registration and error feedback
  - **Clean Interface Update**: Removed voting statistics section from individual activity voting dialog per user request
  - Fixed voting statistics calculation to properly handle database boolean values stored as 't'/'f' characters
  - Confirmed voting system working correctly with 80% approval rate (4 approve, 1 reject votes)
  - **Status Color Enhancement**: Updated event status colors to use standard Tailwind CSS backgrounds
  - Applied consistent color scheme across all components: Aberto (blue), Andamento (yellow), Concluido (green), Cancelado (red)
  - Enhanced visual consistency with bg-[color]-100 and text-[color]-800 standard Tailwind patterns

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
  - Added event category display to event details page showing category information alongside date, time, and location
  - **User Preference**: Activities tab should focus solely on activity management through EventActivityManager component

- **July 12, 2025**: Implemented comprehensive Event-Document Management System similar to Activity Management
  - Created EventDocumentManager component with multi-select functionality for adding/removing documents from events
  - Added backend API endpoints (/api/events/:eventId/documents) for managing document-event associations
  - Implemented database operations to handle document-event relationships using eventId field in documents table
  - Added search functionality to filter documents by number, title, type, or description in document selection dialog
  - Created bulk selection features (Select All/Deselect All) for efficient document management
  - Integrated document management into EventDetails Documents tab with admin-only access
  - Added action buttons for each document: Arquivo (file download), Detalhes (full view), Remover (admin only)
  - Maintained read-only document view for non-admin users with clean table interface
  - Applied same design patterns as EventActivityManager for consistency across event management features

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