# ZettaNote Frontend Documentation

## Overview

ZettaNote is a modern, feature-rich note-taking application built with React and Vite. It provides a clean, intuitive interface for creating, editing, and organizing notes with real-time collaboration features.

## Tech Stack

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS 4.0 with DaisyUI components
- **Routing**: React Router DOM v7
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Animations**: Framer Motion & GSAP
- **Icons**: Lucide React & React Icons
- **Notifications**: React Hot Toast
- **Syntax Highlighting**: Highlight.js
- **Build Tool**: Vite 6.0

## Project Structure

```
frontend/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── assets/                 # Static assets
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── home/               # Home page components
│   │   │   ├── CommunityAndContribution.jsx
│   │   │   ├── ExampleNote.jsx
│   │   │   └── ...
│   │   ├── dashboard/          # Dashboard components
│   │   │   ├── Note.jsx        # Main note editor
│   │   │   ├── Sidebar.jsx     # Page navigation
│   │   │   └── TopBar.jsx      # Action toolbar
│   │   ├── modals/             # Modal components
│   │   ├── Navbar.jsx          # Main navigation
│   │   ├── Footer.jsx          # Site footer
│   │   ├── OAuthButtons.jsx    # Social login buttons
│   │   └── ...
│   ├── context/
│   │   ├── AuthProvider.jsx    # Authentication context
│   │   └── ThemeProvider.jsx   # Theme management
│   ├── pages/
│   │   ├── Home.jsx            # Landing page
│   │   ├── Login.jsx           # Login page
│   │   ├── Signup.jsx          # Registration page
│   │   ├── Dashboard.jsx       # Main application
│   │   └── PublicShare.jsx     # Public note sharing
│   ├── App.jsx                 # Main app component
│   ├── main.jsx                # App entry point
│   ├── index.css               # Global styles
│   └── env.js                  # Environment configuration
├── package.json
├── vite.config.js
├── index.html
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18.x
- pnpm (recommended) or npm
- Backend API running (see backend documentation)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Lint code
pnpm run lint
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:4000/api
```

## Key Features

### Authentication System

- **Email/Password Authentication**: Traditional signup and login
- **OAuth Integration**: Google and GitHub login support
- **Session Management**: JWT-based authentication with HTTP-only cookies
- **Auto-redirect**: Seamless navigation based on authentication state

### Note Management

- **Real-time Auto-save**: Content automatically saves every 2 seconds
- **Rich Text Editor**: Markdown-based note editing with syntax highlighting
- **Page Organization**: Hierarchical page structure with sidebar navigation
- **Page Sharing**: Public sharing with unique URLs
- **Page Operations**: Create, rename, delete, and organize pages

### User Interface

- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Dark/Light Themes**: System-aware theme switching
- **Smooth Animations**: Framer Motion powered transitions
- **Toast Notifications**: User feedback with react-hot-toast
- **Loading States**: Skeleton loaders and progress indicators

## Component Architecture

### Context Providers

#### AuthProvider

Manages user authentication state across the application.

```jsx
const { user, setuser } = useContext(authContext);
```

#### ThemeProvider

Handles theme switching and persistence.

### Main Components

#### App.jsx

Root component handling routing and global layout.

#### Dashboard.jsx

Main application interface with sidebar, editor, and toolbar.

#### Note.jsx

Rich text editor with markdown support and auto-save functionality.

#### Sidebar.jsx

Page navigation with create, select, and organize functionality.

## API Integration

The frontend communicates with the backend through RESTful APIs:

### Authentication Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/getuser` - Get current user info
- `POST /api/auth/logout` - User logout

### Page Management Endpoints

- `POST /api/pages/getpages` - Get all user pages
- `POST /api/pages/getpage` - Get specific page content
- `POST /api/pages/createpage` - Create new page
- `POST /api/pages/savepage` - Save page content
- `POST /api/pages/renamepage` - Rename page
- `DELETE /api/pages/deletepage` - Delete page
- `GET /api/pages/share/:shareId` - Access shared page

### HTTP Client Configuration

All API calls use Axios with the following configuration:

- Base URL from `VITE_API_URL` environment variable
- Credentials enabled for cookie-based authentication
- Automatic error handling for 401 responses

## Styling System

### Tailwind CSS + DaisyUI

The application uses Tailwind CSS v4.0 with DaisyUI component library:

```jsx
// Example component styling
<div className="bg-base-100 text-base-content p-4 rounded-lg shadow-lg">
  <h2 className="text-2xl font-bold mb-4">Title</h2>
  <p className="text-base-content/70">Content</p>
</div>
```

### Theme Variables

DaisyUI provides semantic color variables:

- `bg-base-100` - Primary background
- `text-base-content` - Primary text color
- `bg-primary` - Primary brand color
- `text-error` - Error text color

### Responsive Design

Mobile-first responsive classes:

- `sm:` - Small screens (640px+)
- `md:` - Medium screens (768px+)
- `lg:` - Large screens (1024px+)
- `xl:` - Extra large screens (1280px+)

## Development Workflow

### Code Organization

- **Components**: Modular, reusable React components
- **Pages**: Route-based page components
- **Context**: Global state management
- **Utils**: Helper functions and constants
- **Assets**: Static files and resources

### Best Practices

1. **Component Structure**: Use functional components with hooks
2. **State Management**: Leverage React Context for global state
3. **Error Handling**: Implement try-catch blocks and user feedback
4. **Performance**: Use React.memo for expensive components
5. **Accessibility**: Include proper ARIA labels and keyboard navigation

### Development Commands

```bash
# Development server with hot reload
pnpm run dev

# Production build
pnpm run build

# Code linting
pnpm run lint

# Type checking (if TypeScript is added)
pnpm run type-check
```

## Deployment

### Build Process

```bash
# Create production build
pnpm run build
```

This generates optimized files in the `dist/` directory.

### Environment Variables for Production

```env
VITE_API_URL=https://api.yourdomain.com
```

### Docker Deployment

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Contributing

1. Follow the existing code style and structure
2. Use meaningful component and variable names
3. Add proper error handling and loading states
4. Test components across different screen sizes
5. Ensure accessibility compliance
6. Update documentation for new features

## Troubleshooting

### Common Issues

1. **API Connection Issues**

   - Verify `VITE_API_URL` is correctly set
   - Check backend is running and accessible
   - Ensure CORS is properly configured

2. **Authentication Problems**

   - Clear browser cookies and localStorage
   - Check JWT token expiration
   - Verify backend authentication endpoints

3. **Styling Issues**
   - Ensure Tailwind CSS is properly configured
   - Check for conflicting CSS classes
   - Verify DaisyUI theme variables

### Development Tips

- Use browser dev tools for debugging
- Check network tab for API call failures
- Use React DevTools for component inspection
- Enable "Preserve log" in console for persistent logging

## Future Enhancements

- Real-time collaboration with WebSockets
- Advanced markdown features (tables, math, diagrams)
- File attachments and media embedding
- Advanced search and filtering
- Mobile app development
- Offline support with service workers

