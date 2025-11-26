# Production Deployment: Offline Recording Feature

This document provides a detailed guide for deploying the offline recording feature to production.

## Pre-Deployment Requirements

### 1. Staging Validation

Ensure the following have been completed in staging:

- [ ] Feature has been tested for at least 1 week in staging
- [ ] No critical bugs reported
- [ ] Upload success rate > 95%
- [ ] Performance metrics are acceptable
- [ ] Cross-browser testing completed
- [ ] Mobile testing completed (iOS Safari, Android Chrome)
- [ ] User feedback collected and addressed
- [ ] Documentation reviewed and updated

### 2. Team Readiness

- [ ] Development team briefed on deployment
- [ ] Support team trained on new features
- [ ] Rollback plan reviewed and understood
- [ ] On-call engineer assigned for deployment window
- [ ] Communication plan prepared for users

### 3. Infrastructure Readiness

- [ ] AWS Lambda endpoints verified
- [ ] S3 bucket permissions confirmed
- [ ] API Gateway CORS configured
- [ ] Environment variables prepared
- [ ] Monitoring and alerts configured

## Deployment Strategy

### Option 1: Gradual Rollout (Recommended)

Deploy to production with feature flag disabled, then gradually enable for users.

**Phase 1: Deploy Code (Feature Disabled)**

```bash
# Set feature flag to false
NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING=false

# Deploy to production
npm run build
# Deploy using your platform's deployment command
```

**Phase 2: Enable for Internal Users (Day 1)**

Enable for internal team members first:

```typescript
// Update lib/feature-flags.ts
const INTERNAL_USERS = [
  'admin@clinicalops.co',
  'support@clinicalops.co',
  // Add internal user emails
]

export function isFeatureEnabled(
  feature: keyof typeof featureFlags,
  userEmail?: string,
): boolean {
  if (feature === 'enableOfflineRecording') {
    // Enable for internal users
    if (userEmail && INTERNAL_USERS.includes(userEmail)) {
      return true
    }
    return false
  }
  return featureFlags[feature]
}
```

**Phase 3: Enable for 10% of Users (Day 3-7)**

After internal testing, enable for 10% of users:

```typescript
export function isFeatureEnabled(
  feature: keyof typeof featureFlags,
  userEmail?: string,
): boolean {
  if (feature === 'enableOfflineRecording') {
    // Enable for internal users
    if (userEmail && INTERNAL_USERS.includes(userEmail)) {
      return true
    }

    // Enable for 10% of users based on email hash
    if (userEmail) {
      const hash = simpleHash(userEmail)
      return hash % 100 < 10
    }

    return false
  }
  return featureFlags[feature]
}

// Simple hash function
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}
```

**Phase 4: Enable for 50% of Users (Day 10-14)**

If metrics look good, increase to 50%:

```typescript
return hash % 100 < 50 // 50% of users
```

**Phase 5: Enable for All Users (Day 17-21)**

Full rollout:

```bash
# Set feature flag to true for all users
NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING=true

# Redeploy
npm run build
# Deploy
```

### Option 2: Full Rollout

Deploy with feature enabled for all users immediately:

```bash
# Set feature flag to true
NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING=true

# Deploy to production
npm run build
# Deploy using your platform's deployment command
```

**⚠️ Warning:** This approach has higher risk. Only use if:

- Feature has been extensively tested in staging
- Team is confident in stability
- Support team is ready for potential issues

## Deployment Steps

### Step 1: Pre-Deployment Checks

Run the pre-deployment checklist:

```bash
cd front-clinical-ops
./features/recording/scripts/pre-deployment-check.sh
```

Ensure all checks pass before proceeding.

### Step 2: Create Deployment Backup

```bash
# Tag current production version
git tag -a v1.0.0-pre-offline-recording -m "Pre offline recording deployment"
git push origin v1.0.0-pre-offline-recording

# Document current environment variables
# (Save to secure location)
```

### Step 3: Configure Environment Variables

Set the following environment variables in production:

```bash
# Feature flag (start with false for gradual rollout)
NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING=false

# AWS Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
AWS_REGION=us-east-1

# AWS Credentials (if not using IAM roles)
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
```

### Step 4: Deploy to Production

```bash
cd front-clinical-ops

# Final checks
npm run lint
npm run test:run
npm run build

# Deploy (command depends on hosting platform)
# Vercel:
vercel --prod

# AWS Amplify:
git push origin main

# Or use your platform's deployment command
```

### Step 5: Verify Deployment

After deployment, verify:

1. **Application Loads**
   - Visit production URL
   - Check for console errors
   - Verify no broken functionality

2. **Feature Flag Status**
   - Confirm feature is disabled (or enabled for test users only)
   - Test with internal user account
   - Verify legacy interface loads for regular users

3. **Core Functionality**
   - Test basic recording (if enabled)
   - Verify uploads work
   - Check Lambda endpoints respond

### Step 6: Monitor Initial Metrics

Monitor for the first 24 hours:

- Error rates
- Performance metrics
- User feedback
- Support tickets

## Monitoring and Alerts

### Key Metrics Dashboard

Set up a dashboard to monitor:

1. **Feature Adoption**
   - Number of users with feature enabled
   - Number of offline recordings created
   - Number of recordings synced

2. **Performance Metrics**
   - Upload success rate (target: > 95%)
   - Average upload speed
   - Average recording duration
   - Storage usage per user

3. **Error Metrics**
   - Recording errors (target: < 1%)
   - Storage quota errors
   - Upload failures
   - Sync failures

4. **User Behavior**
   - Recordings created per day
   - Offline vs online recordings ratio
   - Average time to sync
   - Storage cleanup frequency

### Alert Configuration

Configure alerts for:

```yaml
# High Upload Failure Rate
alert: upload_failure_rate > 0.1
duration: 5 minutes
severity: critical
action: Page on-call engineer

# Storage Quota Issues
alert: quota_exceeded_errors > 10
duration: 5 minutes
severity: warning
action: Notify team

# Long Sync Queue
alert: sync_queue_length > 20
duration: 10 minutes
severity: warning
action: Notify team

# High Error Rate
alert: error_rate > 0.05
duration: 5 minutes
severity: critical
action: Page on-call engineer
```

### Logging

Ensure the following are logged:

- All recording operations (start, stop, save)
- Upload attempts and results
- Sync operations
- Storage operations
- Errors with full context

Example log format:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "event": "recording_saved",
  "recordingId": "rec_123",
  "userId": "user_456",
  "duration": 180,
  "size": 5242880,
  "status": "pending_upload"
}
```

## Rollback Procedures

### Quick Rollback (Feature Flag)

If issues are detected, immediately disable the feature:

```bash
# Set feature flag to false
NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING=false

# Redeploy or update environment variable
# (Some platforms allow env var updates without redeployment)
```

This switches all users back to the legacy implementation.

### Full Rollback (Code Revert)

If feature flag rollback is insufficient:

```bash
# Revert to tagged version
git revert <commit-range>

# Or checkout previous tag
git checkout v1.0.0-pre-offline-recording

# Rebuild and redeploy
npm run build
# Deploy
```

### Data Considerations

**Important:** Recordings stored in IndexedDB are client-side only. Rollback does not affect user data:

- Users who recorded offline will still have recordings in IndexedDB
- These recordings will sync when feature is re-enabled
- No data loss occurs during rollback

## Post-Deployment Tasks

### Day 1

- [ ] Monitor error rates every hour
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Verify alerts are working
- [ ] Test rollback procedure (in staging)

### Week 1

- [ ] Daily metrics review
- [ ] Collect user feedback
- [ ] Address any issues
- [ ] Adjust alerts if needed
- [ ] Document any incidents

### Week 2-4

- [ ] Continue monitoring metrics
- [ ] Increase rollout percentage (if gradual)
- [ ] Optimize based on real-world usage
- [ ] Update documentation based on learnings

### Month 1

- [ ] Full metrics analysis
- [ ] User satisfaction survey
- [ ] Performance optimization
- [ ] Plan for future improvements

## Success Criteria

The deployment is considered successful when:

- [ ] Upload success rate > 95% for 1 week
- [ ] Error rate < 1% for 1 week
- [ ] No critical bugs reported
- [ ] User feedback is positive
- [ ] Performance metrics meet targets
- [ ] Support ticket volume is normal

## Communication Plan

### Internal Communication

**Before Deployment:**

- Email to all team members
- Slack announcement
- Brief support team

**During Deployment:**

- Real-time updates in Slack
- Status page updates

**After Deployment:**

- Success announcement
- Metrics summary
- Lessons learned

### User Communication

**For Gradual Rollout:**

- No announcement until 50% rollout
- Blog post or email when fully rolled out
- Highlight benefits: offline capability, reliability

**For Full Rollout:**

- Announcement email/blog post
- In-app notification
- Help documentation update

## Troubleshooting

### Issue: High Upload Failure Rate

**Immediate Actions:**

1. Check AWS Lambda logs
2. Verify S3 bucket permissions
3. Check API Gateway CORS
4. Review network errors in browser console

**Resolution:**

- Fix infrastructure issues
- If persistent, consider rollback

### Issue: Storage Quota Exceeded

**Immediate Actions:**

1. Check storage usage metrics
2. Verify cleanup is running
3. Review retention policy

**Resolution:**

- Manually trigger cleanup for affected users
- Reduce retention period if needed
- Increase cleanup frequency

### Issue: Performance Degradation

**Immediate Actions:**

1. Check performance metrics
2. Review IndexedDB operation times
3. Monitor server response times

**Resolution:**

- Optimize slow operations
- Add caching if needed
- Scale infrastructure if necessary

## Support Resources

### Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Offline Mode Guide](./OFFLINE_MODE_GUIDE.md)
- [Storage Management](./STORAGE_MANAGEMENT.md)
- [FAQ](./FAQ.md)

### Contacts

- **On-Call Engineer:** [Contact info]
- **Development Team:** [Contact info]
- **Support Team:** [Contact info]
- **Infrastructure Team:** [Contact info]

### Escalation Path

1. On-call engineer
2. Development team lead
3. CTO/Technical director

## Appendix

### Environment Variable Reference

```bash
# Feature Flags
NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING=true|false

# AWS Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>

# Optional: Performance Monitoring
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
```

### Useful Commands

```bash
# Check deployment status
vercel ls

# View logs
vercel logs <deployment-url>

# Rollback to previous deployment
vercel rollback <deployment-url>

# Update environment variable
vercel env add NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING
```

### Metrics Queries

```javascript
// In browser console

// Get performance summary
performanceMonitoringService.getPerformanceSummary()

// Export all metrics
performanceMonitoringService.exportMetrics()

// Get storage stats
recordingStorageService.getStorageStats()

// Get recent errors
errorLoggingService.getRecentErrors()
```

## Conclusion

This deployment requires careful planning and monitoring. Follow the gradual rollout approach for safest deployment. Monitor metrics closely and be prepared to rollback if issues arise.

Remember: User data safety is paramount. When in doubt, rollback and investigate.
