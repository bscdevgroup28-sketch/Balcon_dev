# Backend Test Failures - Baseline Report
**Date**: 2025-01-21  
**Branch**: production-readiness-fixes  
**Pass Rate**: 91.8% (112 passed / 122 total)

## Summary
- **Test Suites**: 51 passed, 4 failed, 55 total
- **Tests**: 112 passed, 10 failed, 122 total
- **Time**: 73.9s

## Failing Tests by Category

### 1. Cache Invalidation (1 test)
**File**: `tests/integration/analyticsInvalidation.test.ts`

**Test**: "serves cached analytics, then invalidates on material create"

**Issue**: ETag not changing after cache invalidation
```
Expected ETag to change after material creation
Expected: not "574e7ffc45eb41a61c18ffee1723d8796b718a6c"
Received: "574e7ffc45eb41a61c18ffee1723d8796b718a6c"
```

**Root Cause**: Cache invalidation may not be properly invalidating analytics cache, or ETag generation may be deterministic

**Priority**: Medium (feature-specific, not blocking)

---

### 2. Authorization Error (1 test)
**File**: `tests/integration/changeOrders.test.ts`

**Test**: "creates, sends, approves, and prevents invalid updates"

**Issue**: Expected 400 Bad Request, got 403 Forbidden
```
Expected status 400, got 403
Test line: changeOrders.test.ts:108
```

**Root Cause**: Authorization middleware may be more restrictive than test expects, or test user lacks required permissions

**Priority**: High (authorization behavior change)

---

### 3. Project Creation Failures (8 tests in 2 files)
These tests all fail with the same Sequelize constraint error during `beforeEach` setup.

#### File: `tests/integration/ordersQuotesEvents.test.ts` (5 tests)
- "creates a quote and emits quote.created"
- "updates a quote and emits quote.updated"
- "sends a quote and emits quote.sent"
- "responds to a quote (accept) and emits quote.responded & quote.accepted"
- "creates an order from project context and emits order.created"

#### File: `tests/integration/workOrders.test.ts` (3 tests)
- "creates a work order and persists domain event"
- "updates a work order and emits update event"
- "exposes Prometheus metrics"

**Error**:
```typescript
await Project.create({
  title: 'Event Project',
  description: 'Test',
  projectType: 'residential',
  priority: 'medium',
  inquiryNumber: 'INQ-0001',
  status: 'inquiry',
  userId: 1
} as any);

// Error: Database constraint violation at Project.save
```

**Root Cause**: Test setup failing - likely missing foreign key (userId: 1 may not exist in test DB), or schema constraint added since test creation

**Priority**: Critical (8 tests blocked, event system untested)

---

## Analysis

### High-Level Patterns
1. **Test Setup Issues**: Most failures (8/10) are in `beforeEach` hooks, not actual test logic
2. **Test Isolation**: Project.create failures suggest test database not properly seeded or isolated
3. **Authorization Changes**: changeOrders test expects 400, gets 403 - permission model may have tightened

### Recommended Fixes

#### Immediate (Day 1)
1. **ordersQuotesEvents.test.ts & workOrders.test.ts**:
   - Add User.create in beforeEach before Project.create
   - Ensure userId: 1 exists in test database
   - Or update to use test helper that creates user+project together

#### Day 2 (After JWT Security Fix)
2. **changeOrders.test.ts**:
   - Review authorization middleware changes
   - Update test expectations OR fix middleware if overly restrictive
   - Verify CSRF token + JWT permissions

#### Week 2 (Cache/Performance Sprint)
3. **analyticsInvalidation.test.ts**:
   - Debug cache.invalidateByTag implementation
   - Verify ETag generation includes timestamp or cache version
   - May need to add delay or cache.clear() between requests

### Test Infrastructure Grade: A-
Despite 10 failures:
- ✅ 91.8% pass rate is excellent
- ✅ Migration verification working
- ✅ Test execution fast (~74s for 122 tests)
- ⚠️ Test setup isolation needs improvement
- ⚠️ Foreign key constraint handling in test data

### Next Steps
1. Fix Project.create test setup (add User creation)
2. Verify changeOrders authorization expectations
3. Re-run tests and update this document
4. Target: 95%+ pass rate (117/122 tests)
