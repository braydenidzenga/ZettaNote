# ZettaNote Backend Documentation

## Overview

ZettaNote Backend is a robust Node.js/Express API server that powers the note-taking application. It provides RESTful endpoints for user authentication, page management, admin functionality, and email services.

## Architecture

### Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js 5.x
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis for session management
- **Authentication**: JWT with HTTP-only cookies
- **Validation**: Zod schema validation
- **Email**: Resend API integration
- **Security**: bcryptjs, rate limiting, CORS
- **Logging**: Winston logger
- **Process Management**: Nodemon for development

### Design Patterns

- **MVC Architecture**: Models, Controllers, Routes separation
- **Middleware Pattern**: Request processing pipeline
- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic encapsulation
- **Error Handling**: Centralized error management

## Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration management
│   │   ├── index.js         # Main configuration aggregator
│   │   ├── database.js      # MongoDB connection setup
│   │   ├── redis.js         # Redis connection setup
│   │   ├── passport.js      # OAuth authentication setup
│   │   └── cors.js          # CORS configuration
│   │
│   ├── controllers/         # Request handlers
│   │   ├── auth.controller.js     # Authentication logic
│   │   ├── page.controller.js     # Page CRUD operations
│   │   ├── admin.controller.js    # Admin functionality
│   │   ├── mailer.controller.js   # Email services
│   │   └── task.controller.js     # Task management
│   │
│   ├── models/              # Data models
│   │   ├── User.model.js          # User schema
│   │   ├── Page.model.js          # Page schema
│   │   ├── Task.model.js          # Task schema
│   │   └── AdminAccount.model.js  # Admin schema
│   │
│   ├── routes/              # API route definitions
│   │   ├── index.js               # Route aggregator
│   │   ├── auth.routes.js         # Authentication routes
│   │   ├── page.routes.js         # Page management routes
│   │   ├── admin.routes.js        # Admin routes
│   │   ├── mailer.routes.js       # Email routes
│   │   ├── task.routes.js         # Task routes
│   │   └── oauth.routes.js        # OAuth routes
│   │
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.js     # JWT authentication
│   │   ├── admin.middleware.js    # Admin authorization
│   │   ├── error.middleware.js    # Error handling
│   │   └── validation.middleware.js # Request validation
│   │
│   ├── utils/               # Utility functions
│   │   ├── logger.js              # Logging utility
│   │   ├── token.utils.js         # JWT token management
│   │   ├── password.utils.js      # Password hashing
│   │   ├── security.utils.js      # Security helpers
│   │   └── validator.utils.js     # Validation helpers
│   │
│   ├── constants/           # Application constants
│   │   ├── messages.js            # Response messages
│   │   └── statusCodes.js         # HTTP status codes
│   │
│   ├── jobs/                # Background jobs
│   │   └── reminderJob.js         # Reminder notifications
│   │
│   ├── mailers/             # Email service clients
│   │   └── resend.client.js       # Resend API client
│   │
│   └── app.js               # Express application setup
│
├── scripts/                 # Utility scripts
│   ├── createFirstAdmin.js        # Admin account creation
│   └── fix-jsdoc-types.js         # JSDoc type fixes
│
├── server.js                # Application entry point
├── package.json
├── .env.example             # Environment variables template
└── README.md
```

## Core Components

### Configuration System

The configuration is modular and environment-aware:

```javascript
// src/config/index.js
const config = {
  server: {
    port: process.env.PORT || 4000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    uri: process.env.DB || 'mongodb://localhost:27017/zettanote',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  // ... more config
};
```

### Database Models

#### User Model

```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
  isBanned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
```

#### Page Model

```javascript
const pageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pageData: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shareId: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
```

### Authentication Flow

1. **Registration**: User submits email/password OR login using provider (google/github)
2. **Password Hashing**: bcryptjs hashes password if credentials
3. **JWT Generation**: Create access token
4. **Cookie Storage**: Store JWT in HTTP-only cookie
5. **Middleware Verification**: Validate token on protected routes

### Middleware Pipeline

```javascript
// Request processing order
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(rateLimiting);
app.use('/api', routes);
app.use(errorHandler);
```

## API Endpoints

### Authentication Routes

| Method | Endpoint                   | Description       | Auth Required |
| ------ | -------------------------- | ----------------- | ------------- |
| POST   | `/api/auth/signup`         | User registration | No            |
| POST   | `/api/auth/login`          | User login        | No            |
| GET    | `/api/auth/getuser`        | Get current user  | Yes           |
| POST   | `/api/auth/logout`         | User logout       | Yes           |
| POST   | `/api/auth/changepassword` | Change password   | Yes           |
| DELETE | `/api/auth/deleteUser`     | Delete account    | Yes           |

### Page Management Routes

| Method | Endpoint                    | Description         | Auth Required |
| ------ | --------------------------- | ------------------- | ------------- |
| POST   | `/api/pages/getpages`       | Get all user pages  | Yes           |
| POST   | `/api/pages/getpage`        | Get specific page   | Yes           |
| POST   | `/api/pages/createpage`     | Create new page     | Yes           |
| POST   | `/api/pages/savepage`       | Save page content   | Yes           |
| POST   | `/api/pages/renamepage`     | Rename page         | Yes           |
| DELETE | `/api/pages/deletepage`     | Delete page         | Yes           |
| POST   | `/api/pages/sharepage`      | Share page publicly | Yes           |
| GET    | `/api/pages/share/:shareId` | Access shared page  | No            |

### Admin Routes

| Method | Endpoint               | Description   | Auth Required |
| ------ | ---------------------- | ------------- | ------------- |
| POST   | `/api/admin/login`     | Admin login   | No            |
| GET    | `/api/admin/users`     | Get all users | Admin         |
| POST   | `/api/admin/ban-user`  | Ban user      | Admin         |
| GET    | `/api/admin/analytics` | Get analytics | Admin         |

### Email Routes

| Method | Endpoint           | Description     | Auth Required |
| ------ | ------------------ | --------------- | ------------- |
| POST   | `/api/mailer/send` | Send email      | Yes           |
| POST   | `/api/mailer/test` | Send test email | Yes           |

## Security Features

### Authentication & Authorization

- JWT-based authentication with HTTP-only cookies
- Password hashing with bcryptjs
- Admin role-based access control
- Session management with Redis

### Input Validation

- Zod schema validation for all inputs
- Sanitization of user inputs
- Type checking and constraint validation

### Rate Limiting

- Express rate limiting for API endpoints
- Slow down middleware for abusive requests
- DDoS protection measures

### CORS Configuration

- Configurable allowed origins
- Proper preflight handling
- Secure cookie settings

## Error Handling

### Centralized Error Middleware

```javascript
const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors,
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};
```

### Error Types

- **ValidationError**: Input validation failures
- **AuthenticationError**: Auth failures (401)
- **AuthorizationError**: Permission failures (403)
- **NotFoundError**: Resource not found (404)
- **ConflictError**: Resource conflicts (409)

## Database Operations

### Connection Management

```javascript
const connectDatabase = async () => {
  try {
    await mongoose.connect(config.database.uri);
    logger.success('Connected to MongoDB');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', err);
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
};
```

### Query Optimization

- Proper indexing on frequently queried fields
- Population of referenced documents
- Efficient aggregation pipelines
- Connection pooling configuration

## Caching Strategy

### Redis Integration

- Session storage for OAuth flows
- Rate limiting data
- Temporary data caching
- Background job queues

### Cache Keys

- `session:{userId}` - User session data
- `rateLimit:{ip}` - Rate limiting counters
- `oauth:{state}` - OAuth state validation

## Email System

### Resend Integration

```javascript
const sendEmail = async (to, subject, html, text) => {
  const response = await resend.emails.send({
    from: config.email.from,
    to,
    subject,
    html,
    text,
  });
  return response;
};
```

### Email Templates

- Welcome emails for new users
- Password reset notifications
- Account verification emails
- Admin notifications

## Background Jobs

### Reminder System

- Cron-based task scheduling
- Automated email reminders
- Task completion notifications
- Maintenance cleanup jobs

## Testing Strategy

### Unit Tests

- Controller logic testing
- Utility function testing
- Model validation testing
- Middleware testing

### Integration Tests

- API endpoint testing
- Database operation testing
- Authentication flow testing
- Email service testing

### Test Coverage

- Minimum 80% code coverage
- Critical path testing
- Error scenario testing
- Performance testing

## Deployment

### Environment Setup

```bash
# Production environment variables
NODE_ENV=production
PORT=4000
ALLOWED_ORIGINS=http://localhost:5173,http://locahost:3000
DB=mongodb://production-server/zettanote
JWT_SECRET=your-production-secret
BACKEND_URL=http://localhost:4000
FRONTEND_URL=http://localhost:5173

# Optional Keys to enable these features
RESEND_API_KEY=your-resend-key
FROM_MAIL=no-reply@yourdomain.com
REDIS_URL=redis://production-server:6379
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod
COPY . .
EXPOSE 4000
CMD ["node", "server.js"]
```

### Health Checks

- Application health endpoint
- Database connectivity checks
- Redis connectivity checks
- External service availability

## Monitoring & Logging

### Winston Logger

```javascript
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### Log Levels

- **error**: Application errors and exceptions
- **warn**: Warning conditions
- **info**: General information messages
- **debug**: Detailed debugging information

## Performance Optimization

### Database Optimization

- Proper indexing strategies
- Query optimization
- Connection pooling
- Read/write separation

### Caching Layers

- Redis for session data
- In-memory caching for frequently accessed data
- CDN for static assets

### Code Optimization

- Async/await patterns
- Stream processing for large data
- Memory leak prevention
- CPU-intensive task offloading

## Scalability Considerations

### Horizontal Scaling

- Stateless application design
- Database read replicas
- Redis cluster configuration
- Load balancer setup

### Vertical Scaling

- Memory optimization
- CPU profiling
- Database query optimization
- Caching strategy improvements

## Maintenance

### Database Migrations

- Schema version control
- Backward compatibility
- Data migration scripts
- Rollback procedures

### Dependency Updates

- Regular security updates
- Compatibility testing
- Breaking change handling
- Automated update processes

### Backup Strategy

- Database backups
- File system backups
- Configuration backups
- Disaster recovery procedures

## Troubleshooting

### Common Issues

1. **Database Connection Issues**

   - Check MongoDB URI configuration
   - Verify network connectivity
   - Check MongoDB server status
   - Review connection pool settings

2. **Authentication Problems**

   - Verify JWT secret configuration
   - Check cookie settings
   - Validate token expiration
   - Review CORS configuration

3. **Performance Issues**
   - Monitor database query performance
   - Check Redis connectivity
   - Review application logs
   - Analyze memory usage

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Database query debugging
mongoose.set('debug', true);
```

## Contributing

1. Follow existing code structure and patterns
2. Add comprehensive error handling
3. Include input validation for all endpoints
4. Write meaningful commit messages
5. Update documentation for API changes
6. Add tests for new functionality

## Future Enhancements

- GraphQL API implementation
- Real-time notifications with WebSockets
- Advanced analytics and reporting
- Multi-tenant architecture
- API versioning strategy
- Microservices decomposition
