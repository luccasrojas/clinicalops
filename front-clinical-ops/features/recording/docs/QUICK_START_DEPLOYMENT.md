# Quick Start: Deploying Offline Recording Feature

This is a quick reference guide for deploying the offline recording feature. For detailed information, see the full deployment guides.

## TL;DR

```bash
# 1. Run pre-deployment checks
cd front-clinical-ops
./features/recording/scripts/pre-deployment-check.sh

# 2. Set environment variable
export NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING=true

# 3. Build and deploy
npm run build
# Deploy using your platform's command

# 4. Monitor
# Check browser console for performance logs
# Watch for alerts in monitoring dashboard
```

## Environment Variables

```bash
# Required
NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING=true  # Enable feature
NEXT_PUBLIC_AWS_REGION=us-east-1           # AWS region
AWS_REGION=us-east-1                       # AWS region (server-side)

# Optional (if not using IAM roles)
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
```

## Feature Flag Control

### Enable Feature

```bash
NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING=true
```

### Disable Feature (Rollback)

```bash
NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING=false
```

## Deployment Phases

### Staging

1. Enable feature flag
2. Deploy
3. Test for 1 week
4. Fix any issues

### Production (Gradual Rollout)

1. **Day 0:** Deploy with feature disabled
2. **Day 1:** Enable for internal users
3. **Day 3-7:** Enable for 10% of users
4. **Day 10-14:** Enable for 50% of users
5. **Day 17-21:** Enable for all users

## Monitoring

### Check Metrics (Browser Console)

```javascript
// Get performance summary
performanceMonitoringService.getPerformanceSummary()

// Export all metrics
performanceMonitoringService.exportMetrics()

// Check for alerts
import { checkMetricsForAlerts } from '@/features/recording/scripts/setup-monitoring'
checkMetricsForAlerts()
```

### Key Metrics to Watch

- Upload success rate: Should be > 95%
- Error rate: Should be < 1%
- Sync queue length: Should be < 5
- Storage usage: Monitor growth

## Rollback

### Quick Rollback (Feature Flag)

```bash
# Set environment variable
NEXT_PUBLIC_ENABLE_OFFLINE_RECORDING=false

# Redeploy or update env var in platform
```

### Full Rollback (Code)

```bash
# Revert to previous version
git revert <commit-hash>
npm run build
# Deploy
```

## Troubleshooting

### Feature not working

- Check environment variable is set correctly
- Verify browser supports IndexedDB
- Check browser console for errors

### Recordings not syncing

- Check network status indicator
- Verify AWS credentials configured
- Check Lambda endpoints accessible

### Storage quota exceeded

- Open management panel: `/dashboard/grabacion/gestionar`
- Manually trigger cleanup
- Check storage stats

## Support

### Documentation

- [Full Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Offline Mode Guide](./OFFLINE_MODE_GUIDE.md)

### Commands

```bash
# Run pre-deployment checks
./features/recording/scripts/pre-deployment-check.sh

# Run tests
npm run test:run

# Run linter
npm run lint

# Build for production
npm run build
```

### Useful Links

- Management Panel: `/dashboard/grabacion/gestionar`
- Performance Dashboard: Add `<PerformanceDashboard />` to your page

## Checklist

### Before Deployment

- [ ] Pre-deployment checks pass
- [ ] Environment variables configured
- [ ] Team briefed
- [ ] Monitoring set up

### After Deployment

- [ ] Verify deployment successful
- [ ] Test basic functionality
- [ ] Monitor metrics
- [ ] Check for errors

### If Issues Occur

- [ ] Check error logs
- [ ] Review metrics
- [ ] Consider rollback
- [ ] Notify team

## Contact

For issues or questions:

- Check documentation first
- Review error logs in browser console
- Contact development team
- Create issue in repository

---

**Quick Reference Version:** 1.0
**Last Updated:** [Date]
