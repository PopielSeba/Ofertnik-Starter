# Ofertnik - PPP :: Program Equipment Rental System

## Overview

Ofertnik is a comprehensive equipment rental pricing system for PPP :: Program, focusing on automated quote generation with tiered discount pricing. It includes equipment catalog management, client management, and admin controls. The application aims to streamline the rental process, provide accurate pricing, and offer robust management capabilities for any type of rental equipment.

## Recent Changes (August 2025)

- **User Role System**: Added "Kierownik" role with equipment management access but restricted from ADMIN ROOM. Three-tier system: Admin (full access), Kierownik (equipment only), Employee (basic access).
- **Equipment Management**: Enhanced dialog windows with proper height constraints (90vh) and scrolling functionality
- **Authorization Updates**: Kierownik role can access equipment management, categories, pricing, and related functions but cannot access user management or ADMIN ROOM
- **UI/UX Improvements**: Redesigned navigation bar with compact spacing, updated logo layout (PPP above Program, removed "::"), and optimized button sizing
- **User Management Streamlined**: Simplified pending approval page with clean "Oczekiwanie na akceptację rejestracji przez administratora" message
- **Authentication Flow**: Enhanced authorization handling for unapproved users with proper error handling and user experience flow

## User Preferences

Preferred communication style: Simple, everyday language.
Language: Polish (preferred for communication)
System design: Universal rental system (not construction-specific) - can handle bikes, construction equipment, tools, etc.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit OIDC authentication with Passport.js
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple

### Database Design
- **Users**: Three-tier role-based access (admin/kierownik/employee)
- **Equipment Categories**: Hierarchical organization
- **Equipment**: Items with specifications, quantities, and availability
- **Equipment Pricing**: Tiered pricing with period-based discounts
- **Clients**: Company and contact information
- **Quotes**: Quote generation with line items and automatic calculations
- **Sessions**: Secure session storage

### Key Features
- **Authentication System**: Replit OIDC integration with three-tier role-based access control (Admin/Kierownik/Employee). User approval workflow for new registrations.
- **Equipment Management**: CRUD operations for equipment, categories, and inventory tracking. Includes support for diverse equipment types (e.g., vehicles with km-based calculations, engine equipment with motohour intervals, bikes, tools, etc.).
- **Quote Generation System**: Dynamic pricing based on rental period with tiered discounts (e.g., 1-2 days: base price; 3-7 days: 14.29% discount; 8-18 days: 28.57% discount; 19-29 days: 42.86% discount; 30+ days: 57.14% discount). Supports additional equipment/accessories, installation, disassembly, and travel/service costs.
- **Needs Assessment System**: Comprehensive "BADANIA POTRZEB" feature with admin-managed questions, printable reports, conditional equipment accessories selection, and dynamic category creation. Admin panel allows creating equipment categories that automatically generate corresponding equipment accessory categories.
- **Admin Panel**: Comprehensive management for equipment, pricing, users (including approval/rejection), service costs, and needs assessment questions/categories. Universal system suitable for any rental business (construction equipment, bikes, tools, etc.).

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **react-hook-form**: Form state management
- **passport**: Authentication middleware
- **openid-client**: OIDC authentication
- **TypeScript**: Type safety across the stack
- **Vite**: Fast development builds
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Production bundling
- **Drizzle Kit**: Database migrations
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Development tooling