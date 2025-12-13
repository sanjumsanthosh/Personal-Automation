# Comprehensive Logging Implementation

## Overview
Added comprehensive logging throughout the Personal-Automation application to track all API calls, database operations, and user interactions on both server-side and client-side.

## What Was Added

### 1. **Centralized Logger Utility** (`src/lib/logger.ts`)
Created a new logging utility that provides:
- **Consistent formatting**: All logs include timestamp, log level, and context
- **Structured data**: Support for additional context data in JSON format
- **Multiple log levels**: `info`, `warn`, `error`, `debug`
- **API-specific helpers**: Convenience methods for logging API requests/responses
- **Error handling**: Proper error object serialization with stack traces

Example log format:
```
[2025-12-13T18:43:05.123Z] [INFO] [v1.run] POST request received | {"body":{"name":"Test Run","type_id":"123"}}
```

### 2. **Server-Side API Logging**
Added comprehensive logging to all API endpoints:

#### Run Management APIs
- **`v1.run.ts`**: Create and list runs
  - Request validation logging
  - Database operation logging
  - Success/error response logging
  
- **`v1.run.$id.ts`**: Get, update, and delete individual runs
  - Run fetch operations
  - Status updates with old/new values
  - Entry count tracking
  - Delete operations with cascade logging

- **`v1.run.$id.trigger.ts`**: Webhook triggering
  - Configuration validation
  - Webhook URL logging
  - Response time tracking
  - Detailed error logging with status codes

- **`v1.run.$runId.claim.ts`**: Entry claiming
  - Pending entry queries
  - Claim operations with entry IDs
  - Count tracking

#### Report Management APIs
- **`v1.report.ts`**: Report creation
  - Entry count logging
  - Database insert operations
  - Entry status updates

- **`v1.report.$id.done.ts`**: Mark reports as done
  - Archive operations
  - Entry count tracking

#### List API
- **`v1.list.$type.ts`**: List entries by type
  - Query parameter logging
  - Result count tracking

### 3. **Client-Side Component Logging**
Added logging to all React components that make API calls:

#### `CreateRunModal.tsx`
- Type fetching from Supabase
- Run creation with parameters
- Auto-claim operations
- Success/error tracking

#### `RunDetailPanel.tsx`
- Run details fetching
- Status updates
- Delete operations
- Entry removal
- Webhook triggering with detailed flow tracking
- Error handling and status reversion

#### `RunsTable.tsx`
- Bulk run fetching
- Update mutations
- Delete mutations
- Webhook triggering (deprecated client-side approach)

#### `ReportPreviewPanel.tsx`
- Mark done operations
- Success/error tracking

## Log Categories

### Request Logs (INFO)
```typescript
logger.info('v1.run', 'POST request received')
logger.info('v1.run', 'Creating new run', { name, type_id, limit_count })
```

### Response Logs (INFO)
```typescript
logger.info('v1.run', 'Run created successfully', { run_id, name })
logger.info('v1.run', 'Runs fetched successfully', { count: 10 })
```

### Error Logs (ERROR)
```typescript
logger.error('v1.run', 'Database error creating run', error, { body })
logger.error('RunDetailPanel', 'Trigger error', error, { runId })
```

### Validation Logs (WARN)
```typescript
logger.warn('v1.run', 'Validation failed: missing required fields', { body })
```

### Debug Logs (DEBUG)
```typescript
logger.debug('v1.run.$id', 'Fetching entries for run', { runId })
```

## Benefits

1. **Debugging**: Easy to trace request flow from client to server
2. **Monitoring**: Track API performance and error rates
3. **Audit Trail**: Complete record of all operations
4. **Error Tracking**: Detailed error context for troubleshooting
5. **Performance**: Response time tracking for webhook calls
6. **User Actions**: Track user interactions and workflows

## How to View Logs

### Development
All logs are printed to the console:
- **Server logs**: Check the terminal where `pnpm run dev` is running
- **Client logs**: Check the browser's developer console (F12)

### Production
Logs can be:
- Collected by log aggregation services (e.g., LogRocket, Sentry)
- Sent to cloud logging services (e.g., CloudWatch, Datadog)
- Stored in files for analysis

## Log Examples

### Successful Run Creation Flow
```
[INFO] [CreateRunModal] Creating run | {"name":"AI Papers","typeId":"abc123","limit":5}
[INFO] [v1.run] POST request received
[DEBUG] [v1.run] Request body parsed | {"body":{"name":"AI Papers","type_id":"abc123","limit_count":5}}
[INFO] [v1.run] Creating new run | {"name":"AI Papers","type_id":"abc123","limit_count":5}
[INFO] [v1.run] Run created successfully | {"run_id":"xyz789","name":"AI Papers"}
[INFO] [CreateRunModal] Create run response | {"status":200,"run_id":"xyz789"}
[INFO] [CreateRunModal] Auto-add enabled, claiming entries | {"run_id":"xyz789","typeId":"abc123","limit":5}
[INFO] [v1.run.$runId.claim] POST request received | {"runId":"xyz789"}
[INFO] [v1.run.$runId.claim] Entries claimed successfully | {"runId":"xyz789","claimed_count":5}
[INFO] [CreateRunModal] Run created successfully | {"run_id":"xyz789"}
```

### Webhook Trigger Flow
```
[INFO] [RunDetailPanel] Run now button clicked | {"runId":"xyz789"}
[INFO] [RunDetailPanel] Updating run status to running | {"runId":"xyz789"}
[INFO] [v1.run.$id] PATCH request received | {"runId":"xyz789"}
[INFO] [v1.run.$id] Run updated successfully | {"runId":"xyz789","status":"running"}
[INFO] [RunDetailPanel] Triggering run via server | {"runId":"xyz789"}
[INFO] [v1.run.$id.trigger] POST request received | {"runId":"xyz789"}
[INFO] [v1.run.$id.trigger] Calling n8n webhook | {"runId":"xyz789","url":"https://n8n.example.com/webhook?runId=xyz789"}
[INFO] [v1.run.$id.trigger] n8n webhook response received | {"runId":"xyz789","status":200,"responseTime":"245ms"}
[INFO] [v1.run.$id.trigger] Webhook triggered successfully | {"runId":"xyz789"}
[INFO] [RunDetailPanel] Run triggered successfully | {"runId":"xyz789"}
```

### Error Flow
```
[ERROR] [v1.run.$id.trigger] N8N_WEBHOOK_URL not configured | {"runId":"xyz789"}
[ERROR] [RunDetailPanel] Server trigger failed | {"runId":"xyz789","status":500,"error":"n8n webhook URL not configured"}
[ERROR] [RunDetailPanel] Trigger error | {"runId":"xyz789","error":{"message":"Failed to trigger run","stack":"..."}}
[INFO] [RunDetailPanel] Reverting run status to created | {"runId":"xyz789"}
```

## Notes

- All sensitive data (like webhook URLs) is logged for debugging but should be sanitized in production
- The logger can be easily extended to support different log levels or outputs
- Pre-existing TypeScript lint errors in `RunsTable.tsx` and `RunDetailPanel.tsx` are unrelated to logging changes
- The unused `Entry` import in `RunDetailPanel.tsx` and `useState` in `RunsTable.tsx` are pre-existing issues

## Next Steps (Optional)

1. **Add log levels configuration**: Environment variable to control log verbosity
2. **Add request IDs**: Track requests across client and server
3. **Add performance metrics**: Track API response times
4. **Add user context**: Include user ID in logs when authentication is added
5. **Add log rotation**: For production file-based logging
6. **Integrate with monitoring service**: Send logs to external service
