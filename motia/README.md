# ZettaNote Motia Service

This is the Motia event-driven service for handling background tasks in ZettaNote.

## Overview

This service handles heavy background operations that would otherwise slow down the main backend:

- **Image Cleanup**: Scheduled cleanup of unused images from Cloudinary
- **Task Reminders**: Email notifications for upcoming and overdue tasks
- **Async Page Saves**: Background processing of page content updates with image reference management
- **Async Image Uploads**: Background processing of image uploads to Cloudinary

## Architecture

The service uses Motia framework for event-driven workflows:

- **API Steps**: HTTP endpoints that trigger background jobs
- **Event Steps**: Asynchronous processing of heavy operations
- **Cron Steps**: Scheduled tasks for recurring jobs
- **State Management**: Redis-based state storage for job tracking

## Workflows

### Image Management

- `POST /cleanup/images` - Trigger manual image cleanup
- Scheduled cleanup every 6 hours (marked images + orphaned detection)
- Async image upload processing

### Task Management

- `POST /reminders/tasks` - Trigger manual reminder check
- Scheduled reminders every 5 minutes
- Email notifications for tasks due in 1 hour and overdue tasks

### Page Management

- `POST /pages/save` - Async page save with image reference updates
- Background processing of content changes and cache invalidation

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment file:

```bash
cp .env.example .env
```

3. Configure environment variables in `.env`

4. Start the service:

```bash
pnpm start
```

## Development

```bash
# Development mode with hot reload
pnpm dev

# Build for production
pnpm build
```

## Integration with Backend

The Motia service communicates with the main backend via HTTP APIs. The backend should call Motia endpoints for heavy operations instead of processing them synchronously.

### Example Integration

Instead of processing image cleanup synchronously, the backend calls:

```javascript
// Trigger async image cleanup
await axios.post('http://localhost:3001/cleanup/images', {
  cleanupType: 'comprehensive',
  batchSize: 50,
});
```

## Monitoring

Job status and results are stored in Redis state management. Use the following keys:

- `cleanup-jobs:*` - Image cleanup job results
- `reminder-jobs:*` - Task reminder job results
- `page-save-jobs:*` - Page save job results
- `image-upload-jobs:*` - Image upload job results
