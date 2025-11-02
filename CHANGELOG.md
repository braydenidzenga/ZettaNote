# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.4.0] - 2025-11-02

### Added

- **BullMQ Integration**: Migrated from Motia to BullMQ for background job processing
  - Implemented comprehensive queue management system
  - Added scheduled task reminders with email notifications
  - Implemented image cleanup jobs (orphaned and marked images)
  - Added page save processing with async operations
  - Created 25+ integration tests for BullMQ functionality
- **Redis Integration**: Added Redis support for BullMQ queues with optional fallback
  - Graceful degradation when Redis is unavailable
  - Redis port mapping in Docker Compose
  - Redis URL configuration for local development

### Changed

- **CI/CD Pipeline**: Cleaned up GitHub Actions workflow
  - Removed Motia building from docker-build.yml
  - Streamlined deployment process for active services only
- **Background Jobs**: Made BullMQ optional with conditional initialization
  - Jobs only run when Redis is properly configured
  - Clear logging for job scheduling status

### Fixed

- Redis connectivity issues in Docker setup
- BullMQ initialization errors when Redis unavailable
- Docker Compose Redis service configuration

## [4.3.0] - 2024-12-XX

### Added

- **Markdown Parser**: Implemented markdown-it parser for rich text rendering
  - Syntax highlighting support
  - Task lists and definition lists
  - Code block parsing with proper formatting
- **Search Optimization**: Added caching for frontend and backend search queries
  - Page indexing for faster search results
  - Redis caching for query optimization
- **Profile Management**: Added profile update routes and functionality
- **Task Management System**: Complete task management with email reminders
  - Task creation, editing, and deletion
  - Email notifications via Resend
  - Task scheduling and reminders
- **Image Management**: Paste and upload functionality with Cloudinary integration
  - Direct image paste in editor
  - Cloudinary storage and optimization
  - Image cleanup jobs

### Changed

- **Dashboard UI**: Major upgrade to dashboard interface
  - Improved navigation and layout
  - Better responsive design
  - Enhanced user experience
- **Toolbar**: Added floating toolbar with custom table insertion modal
- **Rate Limiting**: Added rate limiters for signup and login endpoints

### Fixed

- Date selection experience in add reminder modal
- Note editor container growing indefinitely
- Public link sharing functionality
- Share page editing by shared users
- Page save without data validation

## [4.2.0] - 2024-11-XX

### Added

- **Redis Caching**: Cache pages in Redis for improved performance
- **Download Control**: Allow/disallow download toggle for shared pages
- **Mobile Menu**: New mobile menu design for better UX on small devices
- **Syntax Highlighting**: Reordered code block parsing with improved highlighting

### Changed

- **Navbar**: Enhanced navbar with drawer for small devices
- **Home Page**: UI/UX enhancements for homepage features section
  - Added animations on hover
  - Improved layout and responsiveness

### Fixed

- Download button visibility after disabling downloads
- Offcenter bullet points in Markdown lists
- Note popup opening in side section
- Core features card height consistency

## [4.1.0] - 2024-10-XX

### Added

- **ESLint Configuration**: Added ESLint rules for backend and frontend
  - No debug statements in production code
  - Consistent code formatting
  - Import organization rules
- **Hybrid Authentication**: Google and GitHub OAuth login
  - GitHub authentication integration
  - Google authentication integration
  - OAuth callback handling
- **Private Sharing**: Share pages with specific users

### Changed

- **Input Components**: Refactored login and signup with reusable Input component
- **Documentation**: Updated docs to include latest changes and endpoints
- **Toast Notifications**: Enhanced toast styling and positioning

### Fixed

- Missing example environment files
- Toast notification issues
- User undefined error when signed up
- Navbar UI/UX improvements

## [4.0.0] - 2024-09-XX

### Added

- **Backend Refactoring**: Complete backend restructure
  - Organized routes, controllers, and middleware
  - Added API versioning system
  - Improved error handling
  - Better code organization
- **Admin Portal**: New admin management portal
  - Admin dashboard
  - User management
  - System monitoring
- **Mailer Utilities**: Resend mailer client integration
  - Email sending functionality
  - Template support
- **Testing Framework**: Jest and Supertest setup
  - Basic backend tests
  - Test utilities and setup
- **Docker Support**: Complete Docker setup
  - Multi-service Docker Compose
  - Production-optimized Dockerfiles
  - Nginx reverse proxy configuration
- **CI/CD**: GitHub Actions workflows
  - Auto deployment on push
  - Code quality checks
  - Building checks for frontend and backend
  - PR auto-labeling

### Changed

- **Authentication**: Use HTTP Cookies for JWT Authentication
- **HTTP Client**: Replaced Fetch with Axios
- **File Structure**: Improved project organization
  - Separated concerns
  - Better module structure
  - Cleaner imports

### Fixed

- Logout functionality
- Validation bugs during registration
- Redirect and multiple toasts after creating new page

## [3.9.0] - 2024-08-XX

### Added

- **Page Management**: Rename pages functionality
- **Public Sharing**: Public share links for pages
  - Copy button for share links
  - Public view without authentication
- **Delete Functionality**: Delete pages and users
  - Delete page button
  - Delete user route
- **Auto-save**: Save on change with debouncing
- **Rich Text Editor**: Markdown rich text editor implementation

### Changed

- **Theme**: Added theme switch button
- **Favicon**: Added custom favicon
- **Landing Page**: Enhanced with modern UI and animations
  - Hero section improvements
  - Feature showcase
  - Responsive design

### Fixed

- Password validation on signup
- Email indexing and bcrypt optimization
- Page save without data
- Redirect issues

## Earlier Versions

### [3.0.0] - 2024-07-XX

- Initial public release
- Basic authentication (signup/login)
- Page creation and editing
- JWT token management
- MongoDB integration
- React frontend setup
- Express backend setup

---

## Legend

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

## Links

- [GitHub Repository](https://github.com/braydenidzenga/ZettaNote)
- [Issue Tracker](https://github.com/braydenidzenga/ZettaNote/issues)
- [Documentation](./docs/)

## Contributors

Thanks to all our contributors! See the [Contributors List](https://github.com/braydenidzenga/ZettaNote/graphs/contributors) for everyone who has helped make ZettaNote better.
