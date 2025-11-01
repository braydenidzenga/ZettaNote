# Background Job Processing with BullMQ

## Overview

ZettaNote uses **BullMQ** for reliable background job processing. BullMQ is a fast, robust queue system based on Redis that handles asynchronous tasks like image uploads, page saves, image cleanup, and task reminders.

## Architecture

### Why BullMQ?

- **Redis-based**: Built on top of Redis for speed and reliability
- **Job Persistence**: Jobs are persisted to Redis, surviving application restarts
- **Retry Logic**: Automatic retry with exponential backoff for failed jobs
- **Concurrency Control**: Process multiple jobs concurrently with configurable limits
- **Monitoring**: Built-in job status tracking and metrics
- **Scheduled Jobs**: Support for cron-like repeatable jobs

### Components

1. **Queues**: Manage job storage and distribution
2. **Workers**: Process jobs from queues
3. **Schedulers**: Set up repeatable/cron-based jobs

## Queue Configuration

Located in `backend/src/config/queue.js`, we define four queues:

### 1. Page Save Queue

- **Purpose**: Process page content updates asynchronously
- **Concurrency**: 5 workers
- **Jobs**: Update page content, manage image references, invalidate caches

### 2. Image Upload Queue

- **Purpose**: Handle image uploads to Cloudinary
- **Concurrency**: 3 workers
- **Jobs**: Upload images, save metadata to database

### 3. Image Cleanup Queue

- **Purpose**: Clean up orphaned and marked images
- **Concurrency**: 1 worker (to avoid conflicts)
- **Jobs**: Mark orphaned images, delete marked images from Cloudinary

### 4. Task Reminder Queue

- **Purpose**: Send email reminders for upcoming/overdue tasks
- **Concurrency**: 1 worker
- **Jobs**: Check deadlines, send email notifications

## Workers

Workers are implemented in `backend/src/workers/`:

### Page Save Worker (`pageSave.worker.js`)

```javascript
// Processes page save operations
- Update page content in MongoDB
- Track image references (added/removed)
- Update Redis cache
- Invalidate related user caches
```

### Image Upload Worker (`imageUpload.worker.js`)

```javascript
// Handles image uploads
- Upload to Cloudinary with unique identifiers
- Save metadata to MongoDB
- Track page associations
```

### Image Cleanup Worker (`imageCleanup.worker.js`)

```javascript
// Manages image lifecycle
- Mark orphaned images (no page references)
- Delete marked images from Cloudinary and database
- Process in configurable batch sizes
```

### Task Reminder Worker (`taskReminder.worker.js`)

```javascript
// Sends task notifications
- Find tasks due in 1 hour (±5 minute window)
- Find overdue tasks
- Send email reminders via Resend API
- Update reminder flags in database
```

## Scheduled Jobs

Configured in `backend/src/config/schedulers.js`:

### Image Cleanup Schedule

- **Frequency**: Every 6 hours (`0 */6 * * *`)
- **Job Type**: Comprehensive cleanup (orphaned detection + marked deletion)
- **Batch Size**: 50 images per run
- **Initial Run**: On server startup

### Task Reminder Schedule

- **Frequency**: Every 5 minutes (`*/5 * * * *`)
- **Job Type**: Check all tasks for upcoming deadlines and overdue status
- **Initial Run**: On server startup

## Job Configuration

### Default Options

```javascript
{
  attempts: 3,                    // Retry failed jobs up to 3 times
  backoff: {
    type: 'exponential',
    delay: 5000                   // Start with 5 second delay
  },
  removeOnComplete: {
    age: 86400,                   // Keep completed jobs for 24 hours
    count: 1000                   // Keep last 1000 completed jobs
  },
  removeOnFail: {
    age: 604800,                  // Keep failed jobs for 7 days
    count: 5000
  }
}
```

## Usage Examples

### Adding a Page Save Job

```javascript
import { pageSaveQueue } from './config/queue.js';

// Queue a page save job
const job = await pageSaveQueue.add('page-save', {
  pageId: '507f1f77bcf86cd799439011',
  newPageData: '# My Note\nContent here...',
  userId: '507f1f77bcf86cd799439012',
});

// Returns job ID for tracking
console.log('Job queued with ID:', job.id);
```

### Adding an Image Upload Job

```javascript
import { imageUploadQueue } from './config/queue.js';

const job = await imageUploadQueue.add('image-upload', {
  image: base64ImageData,
  originalName: 'photo.jpg',
  pageId: '507f1f77bcf86cd799439011',
  userId: '507f1f77bcf86cd799439012',
});
```

### Manual Image Cleanup Trigger

```javascript
import { imageCleanupQueue } from './config/queue.js';

await imageCleanupQueue.add('manual-cleanup', {
  cleanupType: 'comprehensive', // 'mark-orphaned' | 'cleanup-marked' | 'comprehensive'
  batchSize: 100,
});
```

## Monitoring

### Job States

- **waiting**: Job is in queue, waiting to be processed
- **active**: Job is currently being processed
- **completed**: Job finished successfully
- **failed**: Job failed (will retry if attempts remaining)
- **delayed**: Job is delayed for retry

### Event Listeners

Workers emit events for monitoring:

```javascript
worker.on('completed', (job, result) => {
  logger.info('Job completed', { jobId: job.id, result });
});

worker.on('failed', (job, err) => {
  logger.error('Job failed', { jobId: job.id, error: err.message });
});

worker.on('error', (err) => {
  logger.error('Worker error', { error: err });
});
```

## Error Handling

### Automatic Retries

- Failed jobs are automatically retried up to 3 times
- Exponential backoff: 5s, 10s, 20s delays
- After all attempts fail, job moves to 'failed' state

### Job Failures

Common failure scenarios and handling:

1. **Database Connection Issues**
   - Job will retry automatically
   - Check MongoDB connection health
   - Review connection pool settings

2. **External API Failures** (Cloudinary, Resend)
   - Retry with exponential backoff
   - Check API credentials and quotas
   - Monitor external service status

3. **Data Validation Errors**
   - Job fails immediately (no retry)
   - Log detailed error information
   - Fix data issues at source

## Configuration

### Environment Variables

```bash
# Redis connection for BullMQ
REDIS_URL=redis://localhost:6379

# Disable scheduled jobs if needed
DISABLE_REMINDER_CRON=false
DISABLE_IMAGE_CLEANUP_CRON=false
```

### Redis Connection

BullMQ uses Redis connection configured in `backend/src/config/index.js`:

```javascript
redis: {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  host: 'localhost',  // Parsed from URL
  port: 6379          // Parsed from URL
}
```

## Server Integration

Workers and schedulers are initialized in `backend/server.js`:

```javascript
// Initialize queues
await initializeQueues();

// Start workers
const workers = {
  pageSave: createPageSaveWorker(),
  imageUpload: createImageUploadWorker(),
  imageCleanup: createImageCleanupWorker(),
  taskReminder: createTaskReminderWorker(),
};

// Initialize scheduled jobs
await initializeScheduledJobs();
```

### Graceful Shutdown

Workers and queues are properly closed on server shutdown:

```javascript
// Close workers
await Promise.all([
  workers.pageSave.close(),
  workers.imageUpload.close(),
  workers.imageCleanup.close(),
  workers.taskReminder.close(),
]);

// Close queues
await closeQueues();
```

## Performance Tuning

### Concurrency Settings

Adjust worker concurrency based on your server resources:

```javascript
// High-traffic page saves
const worker = new Worker('page-save', processPageSave, {
  connection: redisConnection,
  concurrency: 10, // Process 10 jobs simultaneously
});

// Resource-intensive image uploads
const worker = new Worker('image-upload', processImageUpload, {
  connection: redisConnection,
  concurrency: 3, // Limit concurrent uploads
});
```

### Redis Memory

Monitor Redis memory usage:

- Completed jobs are auto-removed after 24 hours
- Failed jobs kept for 7 days for debugging
- Adjust retention policies based on volume

## Troubleshooting

### Common Issues

1. **Jobs Stuck in Queue**
   - Check if workers are running
   - Verify Redis connectivity
   - Review worker error logs

2. **High Memory Usage**
   - Check job retention settings
   - Monitor queue sizes
   - Adjust cleanup policies

3. **Slow Job Processing**
   - Increase worker concurrency
   - Optimize job processing logic
   - Check database/external API performance

### Debug Commands

```bash
# Monitor Redis queue keys
redis-cli KEYS "bull:*"

# Check queue lengths
redis-cli LLEN "bull:page-save:wait"

# View job details
redis-cli HGETALL "bull:page-save:job-id"
```

## Migration from Motia

ZettaNote previously used Motia for background tasks. BullMQ provides:

- **Better reliability**: Redis-backed persistence
- **Simpler deployment**: No separate service needed
- **Better monitoring**: Built-in job status tracking
- **More flexible**: Standard Node.js patterns
- **Cost effective**: Runs in main backend process

All Motia functionality has been migrated to BullMQ workers with equivalent or improved capabilities.

## Best Practices

1. **Keep Jobs Small**: Break large tasks into smaller jobs
2. **Idempotent Jobs**: Ensure jobs can be safely retried
3. **Timeout Handling**: Set appropriate job timeouts
4. **Monitor Job Metrics**: Track completion rates and failures
5. **Test Locally**: Use Redis locally for development
6. **Graceful Degradation**: Handle queue failures gracefully

## Future Enhancements

- **Job Prioritization**: High-priority jobs processed first
- **Rate Limiting**: Limit job processing rates
- **Job Chaining**: Sequential job dependencies
- **Progress Tracking**: Real-time job progress updates
- **Admin Dashboard**: Web UI for job monitoring
- **Metrics Export**: Prometheus/Grafana integration
