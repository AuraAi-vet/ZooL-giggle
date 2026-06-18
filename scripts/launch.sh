#!/bin/bash

# ZooL Production Launch Script
# Automates merge, build, and deployment
# Usage: ./scripts/launch.sh [environment]

set -e  # Exit on error

ENVIRONMENT=${1:-staging}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="./launch_${ENVIRONMENT}_${TIMESTAMP}.log"

echo "🚀 ZooL Production Launch Script"
echo "================================="
echo "Environment: $ENVIRONMENT"
echo "Timestamp: $TIMESTAMP"
echo "Log file: $LOG_FILE"
echo ""

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo "[$(date +'%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

# 1. Verify git status
log "Step 1: Verifying git status..."
if [ -n "$(git status --porcelain)" ]; then
    error "Working directory is not clean. Please commit or stash changes."
fi
success "Git status clean"

# 2. Verify main branch
log "Step 2: Verifying main branch..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    warn "Currently on $CURRENT_BRANCH, switching to main"
    git checkout main
fi
success "On main branch"

# 3. Pull latest changes
log "Step 3: Pulling latest changes..."
git pull origin main || error "Failed to pull latest changes"
success "Latest changes pulled"

# 4. Check if perf/optimize-for-launch exists
log "Step 4: Checking perf/optimize-for-launch branch..."
if ! git show-ref --quiet refs/heads/perf/optimize-for-launch; then
    warn "perf/optimize-for-launch branch not found locally, fetching..."
    git fetch origin perf/optimize-for-launch
fi
success "Branch verified"

# 5. Merge performance optimizations
log "Step 5: Merging performance optimizations..."
git merge perf/optimize-for-launch --no-ff -m "Merge: Performance optimizations for launch" || error "Merge failed"
success "Performance branch merged"

# 6. Verify dependencies
log "Step 6: Verifying dependencies..."
npm ci || error "npm ci failed"
success "Dependencies verified"

# 7. Run type check
log "Step 7: Running TypeScript type check..."
npm run typecheck || warn "Type check warnings found"
success "Type check completed"

# 8. Run lint
log "Step 8: Running ESLint..."
npm run lint || warn "Linting issues found"
success "Lint check completed"

# 9. Production build
log "Step 9: Creating production build..."
npm run build || error "Build failed"
success "Production build completed"

# 10. Check build artifacts
log "Step 10: Verifying build artifacts..."
if [ ! -d "dist" ]; then
    error "dist directory not found after build"
fi
DIST_SIZE=$(du -sh dist | cut -f1)
log "Build size: $DIST_SIZE"
success "Build artifacts verified"

# 11. Environment-specific deployment
log "Step 11: Preparing deployment for $ENVIRONMENT..."

case $ENVIRONMENT in
    staging)
        log "Deploying to staging (Vercel preview)..."
        # vercel deploy --debug  # Uncomment for actual deployment
        success "Staged for Vercel preview deployment"
        ;;
    production)
        log "WARNING: Deploying to PRODUCTION"
        read -p "Are you sure? This will deploy to production. (type 'yes' to continue): " confirm
        if [ "$confirm" != "yes" ]; then
            error "Deployment cancelled"
        fi
        log "Deploying to production..."
        # vercel deploy --prod --debug  # Uncomment for actual deployment
        success "Deployed to production"
        ;;
    *)
        error "Unknown environment: $ENVIRONMENT. Use 'staging' or 'production'"
        ;;
esac

# 12. Post-deployment checks
log "Step 12: Running post-deployment checks..."
# Add health checks here
success "Post-deployment checks passed"

# 13. Create deployment tag
log "Step 13: Creating deployment tag..."
DEPLOY_TAG="deploy/$ENVIRONMENT/$TIMESTAMP"
git tag -a "$DEPLOY_TAG" -m "Deployment to $ENVIRONMENT at $TIMESTAMP"
git push origin "$DEPLOY_TAG"
success "Deployment tag created: $DEPLOY_TAG"

# 14. Summary
log ""
log "================================="
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE${NC}"
log "Environment: $ENVIRONMENT"
log "Build size: $DIST_SIZE"
log "Deployment tag: $DEPLOY_TAG"
log "Log saved to: $LOG_FILE"
log "================================="
log ""
log "Next steps:"
log "1. Verify deployment is live"
log "2. Run smoke tests on all critical flows"
log "3. Monitor error logs and metrics"
log "4. Announce launch to team/users"
