# ZettaNote Backend

A clean, well-structured Node.js/Express backend for ZettaNote note-taking application.

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── index.js         # Main configuration
│   │   ├── database.js      # Database connection
│   │   └── cors.js          # CORS configuration
│   │
│   ├── controllers/         # Business logic controllers
│   │   ├── auth.controller.js
│   │   ├── page.controller.js
│   │   ├── admin.controller.js
│   │   └── mailer.controller.js
│
│   ├── mailers/             # Email service clients
│   │   └── resend.client.js # Resend API integration
│
│   ├── models/              # Mongoose models
│   │   ├── User.model.js
│   │   ├── Page.model.js
│   │   └── AdminAccount.model.js
│   │
│   ├── routes/              # API routes
│   │   ├── index.js         # Route aggregator
│   │   ├── auth.routes.js
│   │   ├── page.routes.js
│   │   ├── admin.routes.js
│   │   └── mailer.routes.js
│
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.js
│   │   ├── admin.middleware.js
│   │   ├── error.middleware.js
│   │   └── validation.middleware.js
│   │
│   ├── utils/               # Utility functions
│   │   ├── token.utils.js
│   │   ├── password.utils.js
│   │   ├── security.utils.js
│   │   └── validator.utils.js
│   │
│   ├── constants/           # Constants and enums
│   │   ├── messages.js
│   │   └── statusCodes.js
│   │
│   └── app.js               # Express app configuration
│
├── scripts/                 # Utility scripts
│   └── createFirstAdmin.js  # Admin creation script
│
├── server.js                # Server entry point
├── package.json
├── .env.example
├── .dockerignore
├── Dockerfile
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start development server
pnpm dev

# Start production server
pnpm start
```

### Environment Variables

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DB=mongodb://localhost:27017/zettanote

# JWT
JWT_SECRET=your-secret-key-change-in-production

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Cron Jobs
DISABLE_REMINDER_CRON=false  # Set to 'true' to disable the reminder cron job
```

## 📚 API Documentation

### Authentication Endpoints

#### Signup

```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

#### Get User

```http
GET /api/auth/getuser
Cookie: token=<jwt-token>
```

#### Logout

```http
POST /api/auth/logout
Cookie: token=<jwt-token>
```

#### Change Password

```http
POST /api/auth/changepassword
Cookie: token=<jwt-token>
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

#### Delete User

```http
DELETE /api/auth/deleteUser
Cookie: token=<jwt-token>
```

### Page Endpoints

#### Get All Pages

```http
POST /api/pages/getpages
Cookie: token=<jwt-token>
```

#### Get Single Page

```http
POST /api/pages/getpage
Cookie: token=<jwt-token>
Content-Type: application/json

{
  "pageId": "507f1f77bcf86cd799439011"
}
```

#### Create Page

```http
POST /api/pages/createpage
Cookie: token=<jwt-token>
Content-Type: application/json

{
  "pageName": "My New Page"
}
```

#### Save Page

```http
POST /api/pages/savepage
Cookie: token=<jwt-token>
Content-Type: application/json

{
  "pageId": "507f1f77bcf86cd799439011",
  "pageData": "# My content here"
}
```

#### Rename Page

```http
POST /api/pages/renamepage
Cookie: token=<jwt-token>
Content-Type: application/json

{
  "pageId": "507f1f77bcf86cd799439011",
  "pageName": "New Page Name"
}
```

#### Delete Page

```http
POST /api/pages/deletepage
Cookie: token=<jwt-token>
Content-Type: application/json

{
  "pageId": "507f1f77bcf86cd799439011"
}
```

#### Share Page

```http
POST /api/pages/sharepage
Cookie: token=<jwt-token>
Content-Type: application/json

{
  "pageId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012"
}
```

#### Public Share

```http
GET /api/pages/share/:shareId
```

### Admin Endpoints

All admin endpoints require authentication and appropriate permissions.

#### Admin Login

```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "AdminPassword123!"
}
```

#### Get All Users

```http
GET /api/admin/users
Authorization: Bearer <admin-token>
```

#### Ban User

```http
POST /api/admin/ban-user
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439011"
}
```

#### Get Analytics

```http
GET /api/admin/analytics
Authorization: Bearer <admin-token>
```

### Mailer Endpoints

#### Send Email

```http
POST /api/mailer/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "user@example.com",
  "subject": "Welcome to ZettaNote",
  "html": "<h1>Welcome!</h1><p>Thank you for joining us.</p>",
  "text": "Welcome! Thank you for joining us."
}
```

**Note:**

- Requires `RESEND_API_KEY` to be configured in `.env`
- `to` can be a string or array of email addresses
- Either `html` or `text` (or both) must be provided
- Requires user authentication

#### Send Test Email

```http
POST /api/mailer/test
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "test@example.com",
  "subject": "Test Email",
  "html": "<p>This is a test email</p>"
}
```

## 🛠️ Development

### Running Tests

```bash
pnpm test
```

### Linting

```bash
pnpm lint
```

### Code Formatting

```bash
pnpm format
```

## 📦 Building for Production

```bash
# Build
pnpm build

# Start production server
pnpm start
```

## 🐳 Docker

```bash
# Build Docker image
docker build -t zettanote-backend .

# Run container
docker run -p 4000:4000 --env-file .env zettanote-backend
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style Guidelines

- Use ES6+ features
- Follow async/await pattern
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Keep functions small and focused
- Handle errors appropriately
- Write clean, readable code

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Express.js - Fast, unopinionated web framework
- MongoDB - NoSQL database
- Mongoose - MongoDB object modeling
- JWT - JSON Web Tokens for authentication
- Zod - TypeScript-first schema validation

## 📧 Contact

For questions or support, please open an issue on GitHub.
