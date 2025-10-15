# Contributing to ZettaNote Backend

Thank you for your interest in contributing to ZettaNote! This document provides guidelines and standards for contributing to the backend codebase.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Code Standards](#code-standards)
- [Documentation Requirements](#documentation-requirements)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Follow the project's coding standards
- Help others learn and grow

## Getting Started

### 1. Fork and Clone

```bash
git fork https://github.com/MannuVilasara/ZettaNote
cd ZettaNote/backend
pnpm install
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Set up Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

## Code Standards

### ✅ DO's

#### 1. Use Logger Instead of Console

```javascript
// ❌ Bad
console.log('User created');
console.error('Error:', error);

// ✅ Good
logger.info('User created', { userId: user.id });
logger.error('Failed to create user', error);
```

#### 2. Use Constants

```javascript
// ❌ Bad
res.status(200).json({ message: 'Success' });
throw new Error('User not found');

// ✅ Good
res.status(STATUS_CODES.OK).json({ message: MESSAGES.SUCCESS });
throw new Error(MESSAGES.AUTH.USER_NOT_FOUND);
```

#### 3. Document All Routes

```javascript
/**
 * POST /api/auth/signup
 * @description    Register a new user account
 * @access  Public
 * @param   {string} email - User email address
 * @param   {string} password - User password (min 12 chars)
 * @returns {Object} User object and JWT token
 * @throws  {400} Invalid input or duplicate email
 */
router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    // Implementation
  })
);
```

#### 4. Document All Exported Functions

```javascript
/**
 * Create a new user account
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - User email
 * @param {string} req.body.password - User password
 * @returns {Object} Response with status and message
 */
export const signup = async (req) => {
  // Implementation
};
```

#### 5. Proper Error Handling

```javascript
try {
  const result = await someOperation();
  return {
    resStatus: STATUS_CODES.OK,
    resMessage: { message: MESSAGES.SUCCESS, data: result },
  };
} catch (err) {
  logger.error('Operation failed', err);
  return {
    resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
    resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
  };
}
```

### ❌ DON'Ts

1. **Don't use `console.log`** - Use `logger.info()` instead
2. **Don't use magic numbers** - Use `STATUS_CODES` constants
3. **Don't hard-code messages** - Use `MESSAGES` constants
4. **Don't skip error handling** - Always wrap in try-catch
5. **Don't skip documentation** - Document all routes and exported functions

## Documentation Requirements

### Route Documentation

Every route MUST include:

- HTTP method and path
- `@description` - Clear description
- `@access` - Public, Private, or Admin
- `@param` - All parameters (path, query, body)
- `@returns` - Return value type and description
- `@throws` - Possible error codes and descriptions

### Function Documentation

All exported functions MUST include:

- Function description
- `@param` - All parameters with types and descriptions
- `@returns` - Return value with type and description
- `@throws` - Possible errors (if applicable)

## File Structure and Naming

### Folder Structure

```
src/
├── config/           # Configuration files
├── constants/        # Constants and enums
├── controllers/      # Business logic
├── middleware/       # Express middleware
├── models/           # Mongoose models
├── routes/           # Route definitions
├── utils/            # Utility functions
└── mailers/          # Email templates
```

### Naming Conventions

- **Files**: `kebab-case.js` (e.g., `auth.controller.js`)
- **Functions**: `camelCase` (e.g., `getUserById`)
- **Classes**: `PascalCase` (e.g., `UserModel`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `STATUS_CODES`)
- **Private functions**: `_prefixWithUnderscore`

## Testing Guidelines

### Before Submitting

1. **Run Linter**

   ```bash
   pnpm lint
   ```

2. **Fix Linting Issues**

   ```bash
   pnpm lint --fix
   ```

3. **Test Your Endpoints**
   - Use Postman, Insomnia, or curl
   - Test all success cases
   - Test all error cases
   - Verify status codes and messages

4. **Check Logs**
   - Ensure proper logging
   - No console statements
   - Appropriate log levels

## Pull Request Process

### 1. Before Creating PR

- [ ] All new code follows the project's coding standards
- [ ] All routes have proper JSDoc documentation
- [ ] All exported functions have JSDoc comments
- [ ] Used `logger` instead of `console`
- [ ] Used `STATUS_CODES` and `MESSAGES` constants
- [ ] Added appropriate error handling
- [ ] Tested all endpoints manually
- [ ] No ESLint errors or warnings
- [ ] Code follows existing patterns in the project

### 2. Create Pull Request

Use the PR template and fill out all sections:

- Clear description of changes
- Type of change (bug fix, feature, etc.)
- Complete the checklist
- Add screenshots (if UI changes)
- Describe how you tested

### 3. Code Review

- Address all review comments
- Keep discussions professional
- Ask for clarification if needed
- Update code based on feedback

### 4. After Merge

- Delete your feature branch
- Pull the latest main branch
- Create new branch for next feature

## Common Patterns

### Controller Pattern

```javascript
export const controllerName = async (req) => {
  try {
    // 1. Extract and validate input
    const { field } = req.body;

    if (!field) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: 'Field is required' },
      };
    }

    // 2. Business logic
    const result = await Model.findOne({ field });

    // 3. Return success response
    return {
      resStatus: STATUS_CODES.OK,
      resMessage: { message: MESSAGES.SUCCESS, data: result },
    };
  } catch (err) {
    logger.error('Controller error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};
```

### Route Pattern

```javascript
router.method(
  '/path',
  middleware,
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage, token } = await controller(req);

    if (token) {
      res.cookie('token', token, cookieOptions);
    }

    res.status(resStatus).json(resMessage);
  })
);
```

## Getting Help

- 📖 Check the [CODE_STANDARDS.md](./CODE_STANDARDS.md) for detailed standards
- 💬 Ask questions in GitHub Discussions
- 🐛 Report bugs in GitHub Issues
- 📧 Contact maintainers if you need help

## Resources

- [Winston Logger Documentation](https://github.com/winstonjs/winston)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Mongoose Documentation](https://mongoosejs.com/docs/guide.html)
- [JSDoc Documentation](https://jsdoc.app/)

Thank you for contributing to ZettaNote! 🚀
