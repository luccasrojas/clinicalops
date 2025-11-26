# Deployment Guide: Offline Recording Feature

This guide covers the deployment process for the offline recording improvements feature.

## Prerequisites

- Access to staging and production environments
- AWS CLI configured with appropriate credentials
- Node.js and npm installed
- Access to environment variable configuration

## Feature Flag Configuration

The offline recording feature is controlled by the `NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING` environment variable.

### Environment Variables

```bash
# Enable offline recording feature
NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING=true

# AWS Configuration (required for Lambda proxy)
NEXT_PUBLIC_AWS_REGION=us-east-1
AWS_REGION=us-east-1
```

## Staging Deployment

### Step 1: Set Environment Variables

For staging environment, set the feature flag to `true`:

```bash
# Vercel (if using Vercel)
vercel env add NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING

# AWS Amplify (if using Amplify)
aws amplify update-app --app-id <app-id> --environment-variables NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING=true

# Or update via console/dashboard
```

### Step 2: Build and Deploy

```bash
cd front-clinical-ops

# Install dependencies
npm install

# Run linting
npm run lint

# Run tests
npm run test:run

# Build for production
npm run build

# Deploy to staging
# (deployment command depends on your hosting platform)
```

### Step 3: Verify Deployment

After deployment, verify the following:

1. **Feature Flag Active**
   - Open browser console
   - Check that the new recording interface is loaded (not legacy)
   - Verify IndexedDB database is created: `clinicalops-recordings`

2. **Recording Functionality**
   - Test basic recording (start, pause, resume, stop)
   - Verify recording is saved to IndexedDB
   - Check storage stats are displayed

3. **Offline Mode**
   - Disconnect from internet (or use Chrome DevTools offline mode)
   - Record a new session
   - Verify it's saved locally with "pending_upload" status
   - Reconnect and verify automatic sync

4. **Sync Manager**
   - Create multiple recordings offline
   - Reconnect and verify they sync in order (oldest first)
   - Check sync progress notifications

5. **Management Panel**
   - Navigate to `/dashboard/grabacion/gestionar`
   - Verify all recordings are listed
   - Test play, delete, and manual upload actions

6. **Performance Monitoring**
   - Check browser console for performance logs
   - Verify metrics are being tracked
   - Export metrics using: `performanceMonitoringService.exportMetrics()`

### Step 4: Monitor Error Rates

Monitor the following metrics during staging:

- **Recording Errors**: Check for microphone permission issues
- **Storage Errors**: Monitor quota exceeded errors
- **Upload Failures**: Track network-related upload failures
- **Sync Issues**: Monitor automatic sync success rate

Use browser console to check error logs:

```javascript
// In browser console
errorLoggingService.getRecentErrors()
```

### Step 5: Gather Feedback

- Test with real users (internal team first)
- Collect feedback on:
  - Recording quality
  - Offline mode usability
  - Sync reliability
  - Performance (speed, responsiveness)
  - UI/UX issues

### Step 6: Fix Critical Issues

Before production deployment, ensure:

- [ ] No critical bugs reported
- [ ] Upload success rate > 95%
- [ ] No data loss scenarios
- [ ] Performance is acceptable (< 2s for save operations)
- [ ] Cross-browser compatibility verified

## Production Deployment

### Step 1: Feature Flag Strategy

**Option A: Gradual Rollout (Recommended)**

Start with feature flag disabled, then enable for specific users:

```typescript
// In feature-flags.ts, add user-based rollout
export function isFeatureEnabled(
  feature: keyof typeof featureFlags,
  userId?: string,
): boolean {
  if (feature === 'enableOfflineRecording') {
    // Enable for specific test users first
    const testUsers = ['user1@example.com', 'user2@example.com']
    if (userId && testUsers.includes(userId)) {
      return true
    }
    // Then enable for percentage of users
    if (userId) {
      const hash = simpleHash(userId)
      return hash % 100 < 10 // 10% of users
    }
  }
  return featureFlags[feature]
}
```

**Option B: Full Rollout**

Set environment variable to `true` for all users:

```bash
NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING=true
```

### Step 2: Deploy to Production

```bash
cd front-clinical-ops

# Final checks
npm run lint
npm run test:run
npm run build

# Deploy to production
# (deployment command depends on your hosting platform)
```

### Step 3: Monitor Metrics Closely

After production deployment, monitor:

1. **Error Rates**
   - Track error logs in production monitoring tool
   - Set up alerts for error rate spikes

2. **Performance Metrics**
   - Average recording duration
   - Upload success rate
   - Storage usage trends
   - Sync queue length

3. **User Behavior**
   - Number of offline recordings
   - Sync success rate
   - Storage cleanup frequency

### Step 4: Rollback Plan

If critical issues are detected:

**Quick Rollback (Feature Flag)**

```bash
# Disable feature flag
NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING=false

# Redeploy or update environment variable
```

This will immediately switch all users back to the legacy implementation.

**Full Rollback (Code)**

If feature flag rollback is not sufficient:

```bash
# Revert to previous deployment
git revert <commit-hash>
npm run build
# Deploy previous version
```

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Upload Success Rate**
   - Target: > 95%
   - Alert if: < 90% for 5 minutes

2. **Storage Usage**
   - Monitor average storage per user
   - Alert if: > 500MB per user

3. **Sync Queue Length**
   - Target: < 5 recordings in queue
   - Alert if: > 20 recordings for 10 minutes

4. **Error Rate**
   - Target: < 1% of operations
   - Alert if: > 5% for 5 minutes

### Setting Up Alerts

Example alert configuration (adjust for your monitoring tool):

```yaml
alerts:
  - name: High Upload Failure Rate
    condition: upload_failure_rate > 0.1
    duration: 5m
    severity: critical

  - name: Storage Quota Issues
    condition: quota_exceeded_errors > 10
    duration: 5m
    severity: warning

  - name: Long Sync Queue
    condition: sync_queue_length > 20
    duration: 10m
    severity: warning
```

## Post-Deployment Checklist

- [ ] Feature flag configured correctly
- [ ] Deployment successful (no build errors)
- [ ] Basic functionality verified
- [ ] Offline mode tested
- [ ] Sync manager working
- [ ] Performance metrics being collected
- [ ] Error monitoring active
- [ ] Alerts configured
- [ ] Documentation updated
- [ ] Team notified of deployment

## Troubleshooting

### Issue: Recordings not syncing

**Diagnosis:**

- Check network status indicator
- Verify Lambda endpoints are accessible
- Check browser console for errors

**Solution:**

- Verify AWS credentials are configured
- Check CORS settings on API Gateway
- Verify presigned URL generation is working

### Issue: Storage quota exceeded

**Diagnosis:**

- Check storage stats in management panel
- Verify cleanup is running

**Solution:**

- Manually trigger cleanup
- Reduce retention period (default 7 days)
- Increase cleanup frequency

### Issue: Performance degradation

**Diagnosis:**

- Check performance metrics
- Monitor IndexedDB operation times
- Check for large recordings

**Solution:**

- Implement pagination for large lists
- Optimize IndexedDB queries
- Add indexes if needed

## Support

For issues or questions:

- Check error logs in browser console
- Review performance metrics
- Contact development team
- Create issue in project repository

## References

- [Feature Requirements](../requirements.md)
- [Design Document](../design.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Offline Mode Guide](./OFFLINE_MODE_GUIDE.md)
- [Storage Management](./STORAGE_MANAGEMENT.md)
