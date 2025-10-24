# API Versioning Structure

This document explains the API versioning structure implemented in ZettaNote to support both synchronous (v1) and asynchronous (v2) page saving workflows.

## Directory Structure

```
backend/src/
├── routes/
│   ├── v1/                    # V1 API routes (synchronous)
│   │   ├── index.js          # V1 routes aggregator
│   │   ├── page.routes.js    # V1 page endpoints
│   │   ├── auth.routes.js    # Authentication routes
│   │   └── ...               # Other v1 routes
│   ├── v2/                    # V2 API routes (asynchronous)
│   │   ├── index.js          # V2 routes aggregator
│   │   ├── page.routes.js    # V2 page endpoints
│   │   └── ...
│   └── index.js              # Main routes aggregator
├── controllers/
│   ├── v1/                   # V1 controllers (synchronous)
│   │   ├── page.controller.js # V1 page operations
│   │   └── ...               # Other v1 controllers
│   ├── v2/                   # V2 controllers (asynchronous)
│   │   ├── page.controller.js # V2 page operations with Motia
│   │   └── ...
│   └── ...
```

## API Versions

### V1 API (Synchronous)

- **Base URL**: `/api/v1/` or `/api/` (backward compatibility)
- **Workflow**: Direct synchronous database operations
- **Endpoints**:
  - `POST /api/v1/pages/savepage` - Synchronous page save
  - `GET /api/v1/health` - V1 health check
- **Use Case**: Traditional immediate save operations

### V2 API (Asynchronous)

- **Base URL**: `/api/v2/`
- **Workflow**: Event-driven processing with Motia
- **Endpoints**:
  - `POST /api/v2/pages/savepage` - Queue page save for async processing
  - `POST /api/v2/pages/process-async-save` - Internal endpoint for Motia
  - `GET /api/v2/health` - V2 health check
- **Use Case**: Background processing for better performance

## Key Differences

### V1 (Synchronous)

```javascript
// Frontend calls
const response = await pagesAPI.savePage(pageId, content);
// Returns 200 OK immediately with saved page data
```

### V2 (Asynchronous)

```javascript
// Frontend calls
const response = await pagesAPI.savePage(pageId, content);
// Returns 202 Accepted - page queued for processing

// Motia processes in background
// Calls internal endpoint: /api/v2/pages/process-async-save
// Page gets saved asynchronously
```

## Migration Path

1. **Current State**: V2 API implemented, frontend updated to use v2 endpoints
2. **Backward Compatibility**: V1 routes still available at root level (`/api/*`)
3. **Future**: Remove backward compatibility when all clients updated

## Development Guidelines

- **New Features**: Implement in V2 API
- **Bug Fixes**: Apply to both V1 and V2 as needed
- **Testing**: Test both API versions
- **Documentation**: Update this document when adding new versions

## Health Checks

- `GET /api/health` - General server health
- `GET /api/v1/health` - V1 API specific health
- `GET /api/v2/health` - V2 API specific health
