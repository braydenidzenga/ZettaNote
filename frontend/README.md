# ZettaNote Frontend

A modern, responsive React frontend for the ZettaNote note-taking application, built with Vite and styled with Tailwind CSS.

## 🚀 Features

- **Modern Markdown Editor** with live preview and syntax highlighting
- **Real-time Auto-save** - Never lose your work
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Dark/Light Theme** - Automatic theme switching based on system preferences
- **Rich Text Formatting** - Full markdown support with toolbar shortcuts
- **Page Management** - Create, rename, delete, and organize pages
- **Public Sharing** - Share pages with secure, unique URLs
- **User Authentication** - Secure login with JWT and OAuth support
- **Task Management** - Complete task system with reminders and subtasks

## 🛠️ Tech Stack

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS + DaisyUI components
- **Routing**: React Router DOM
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Build Tool**: Vite 6.0
- **Icons**: Lucide React + React Icons
- **Notifications**: React Hot Toast
- **Markdown Processing**: Markdown-it with custom extensions
- **Math Rendering**: KaTeX for mathematical expressions

## 📁 Project Structure

```text
frontend/
├── public/
│   ├── index.html          # Main HTML template
│   └── manifest.json       # PWA manifest
├── src/
│   ├── assets/             # Static assets (images, icons)
│   ├── components/
│   │   ├── ui/             # Reusable UI components
│   │   ├── home/           # Landing page components
│   │   ├── dashboard/      # Dashboard page components
│   │   │   ├── Note.jsx        # Main markdown editor
│   │   │   ├── Sidebar.jsx     # Page navigation
│   │   │   ├── TopBar.jsx      # Action toolbar
│   │   │   └── Reminder.jsx    # Task reminders
│   │   ├── modals/         # Modal dialogs
│   │   ├── Navbar.jsx      # Main navigation
│   │   ├── Footer.jsx      # Site footer
│   │   └── OAuthButtons.jsx # Social login buttons
│   ├── context/
│   │   ├── AuthProvider.jsx    # Authentication context
│   │   └── ThemeProvider.jsx   # Theme management
│   ├── pages/
│   │   ├── Home.jsx        # Landing page
│   │   ├── Login.jsx       # Login page
│   │   ├── Signup.jsx      # Registration page
│   │   ├── Dashboard.jsx   # Main application
│   │   └── PublicShare.jsx # Public page sharing
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # App entry point
│   ├── index.css           # Global styles
│   └── env.js              # Environment configuration
├── package.json
├── vite.config.js          # Vite configuration
├── index.html
└── README.md
```

## ⚡ Getting Started

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

```bash
VITE_API_URL=http://localhost:4000/api
```

## 🎨 Key Components

### Authentication System

The app supports multiple authentication methods:

- **Email/Password**: Traditional signup and login
- **OAuth Integration**: Google and GitHub login support
- **Session Management**: JWT-based authentication with HTTP-only cookies
- **Auto-redirect**: Seamless navigation based on authentication state

### Markdown Editor

Features a rich markdown editor with:

- **Live Preview**: Toggle between edit and preview modes
- **Syntax Highlighting**: Code blocks with language-specific highlighting
- **Math Support**: KaTeX rendering for mathematical expressions
- **Auto-save**: Content automatically saves every 2 seconds
- **Keyboard Shortcuts**: Full shortcut support (Ctrl+B, Ctrl+I, Ctrl+Z, etc.)
- **Toolbar**: Visual formatting buttons for common markdown elements

### Page Management

Complete page organization system:

- **Create/Rename/Delete**: Full CRUD operations for pages
- **Sidebar Navigation**: Hierarchical page listing
- **Public Sharing**: Generate shareable links for pages
- **Search**: Quick page lookup functionality

### Task Management

Integrated task system with:

- **Task Creation**: Add tasks with due dates and priorities
- **Subtasks**: Break down complex tasks
- **Reminders**: Email notifications for upcoming deadlines
- **Completion Tracking**: Mark tasks as complete

## 🔧 Development

### Available Scripts

```bash
# Development server with hot reload
pnpm run dev

# Production build
pnpm run build

# Preview production build locally
pnpm run preview

# Code linting
pnpm run lint
```

### Code Organization

- **Components**: Modular, reusable React components
- **Pages**: Route-based page components
- **Context**: Global state management
- **Utils**: Helper functions and constants
- **Assets**: Static files and resources

### Best Practices

1. **Functional Components**: Use modern React hooks
2. **Context API**: Leverage React Context for global state
3. **Error Boundaries**: Implement proper error handling
4. **Performance**: Use React.memo for expensive components
5. **Accessibility**: Include proper ARIA labels and keyboard navigation

## 🎨 Styling

### Tailwind CSS + DaisyUI

The application uses Tailwind CSS v4.0 with DaisyUI component library for consistent styling:

```jsx
// Example component styling
<div className="bg-base-100 text-base-content p-4 rounded-lg shadow-lg">
  <h2 className="text-2xl font-bold mb-4">Title</h2>
  <p className="text-base-content/70">Content</p>
</div>
```

### Theme System

DaisyUI provides semantic color variables that automatically adapt to light/dark themes:

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

## 🚀 Deployment

### Build Process

```bash
# Create production build
pnpm run build
```

This generates optimized files in the `dist/` directory.

### Environment Variables for Production

```bash
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

## 🧪 Testing

### Testing Strategy

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API integration and user workflow testing
- **E2E Tests**: End-to-end user journey testing

### Running Tests

```bash
# Run unit tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests (if configured)
pnpm test:e2e
```

## 🤝 Contributing

1. Follow the existing code style and structure
2. Use meaningful component and variable names
3. Add proper error handling and loading states
4. Test components across different screen sizes
5. Ensure accessibility compliance
6. Update documentation for new features

## 📱 Progressive Web App (PWA)

The frontend includes PWA capabilities for offline functionality:

- **Service Worker**: Background sync and caching
- **Web App Manifest**: Installable web app
- **Offline Support**: Basic offline page access

## 🔧 Troubleshooting

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

## 📈 Performance

### Optimization Features

- **Code Splitting**: Lazy loading of routes and components
- **Image Optimization**: Responsive images with modern formats
- **Bundle Analysis**: Webpack bundle analyzer integration
- **Caching**: Aggressive caching strategies for static assets

### Performance Monitoring

- **Lighthouse**: Regular performance audits
- **Core Web Vitals**: Monitoring of key performance metrics
- **Bundle Size**: Tracking and optimization of JavaScript bundles

## 🔮 Future Enhancements

- Real-time collaboration with WebSockets
- Advanced markdown features (tables, diagrams)
- File attachments and media embedding
- Advanced search and filtering
- Mobile app development
- AI-powered writing assistance

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
