# Subscription Issue Fix - Complete Guide

## Problem Summary

Users created **before January 20, 2026** were given PRO subscriptions with:
- `plan: 'PRO'`
- `status: 'UNPAID'`
- `currentPeriodEnd: null`

This causes them to **fail the subscription check** when trying to access Pro features like Talent Pool, because:
- ❌ Status is `UNPAID` (must be `ACTIVE` or `TRIALING`)
- ❌ No expiration date set (fails the `currentPeriodEnd > now` check)

### Root Cause

**Commit `383e08a` (Jan 20, 2026)**: Changed new user registration from PRO/UNPAID to FREE/ACTIVE

**Before this fix:**
```typescript
subscription: {
  create: {
    plan: 'PRO',      // ❌ PRO without payment
    status: 'UNPAID', // ❌ Fails subscription check
  }
}
```

**After this fix:**
```typescript
subscription: {
  create: {
    plan: 'FREE',     // ✅ Correct default
    status: 'ACTIVE', // ✅ Works correctly
  }
}
```

**Result:** New users created after Jan 20 work fine, but **old users are stuck** with broken Pro subscriptions.

---

## Solutions

### Solution 1: Fix Individual User (Quick Fix)

Use this to fix a specific test account like `abdulaziz1a3@gmail.com`:

**Option A - Browser Console (Easiest):**

1. Log in as SUPER_ADMIN
2. Open browser console (F12)
3. Run:
   ```javascript
   await fetch('/api/admin/fix-subscription', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: 'abdulaziz1a3@gmail.com' })
   }).then(r => r.json()).then(console.log)
   ```

**Option B - Use Helper Script:**

1. Open `scripts/browser-fix-subscription.js` in code editor
2. Copy entire contents
3. Paste into browser console
4. Run: `await debugAndFixSubscription('abdulaziz1a3@gmail.com')`

**What it does:**
- Sets `plan: 'PRO'`
- Sets `status: 'ACTIVE'`
- Sets `currentPeriodEnd: now + 1 year`
- Sets `cancelAtPeriodEnd: false`

---

### Solution 2: Fix ALL Broken Pro Users (Recommended)

Use this to fix **all users** with broken Pro subscriptions in one operation:

**Step 1 - Dry Run (see what would be fixed):**

```javascript
// In browser console (logged in as SUPER_ADMIN):
await fetch('/api/admin/fix-all-pro-subscriptions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ dryRun: true })
}).then(r => r.json()).then(console.log)
```

**Step 2 - Review Results:**

The response will show:
- How many broken Pro subscriptions were found
- Email, name, creation date of each affected user
- What would be changed for each

**Step 3 - Actually Fix Them:**

```javascript
await fetch('/api/admin/fix-all-pro-subscriptions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ dryRun: false })
}).then(r => r.json()).then(console.log)
```

**Option B - Use Helper Script:**

1. Open `scripts/browser-fix-all-pro-users.js`
2. Copy entire contents
3. Paste into browser console
4. Run: `await fixAllProSubscriptions(true)`  // Dry run first
5. Review results
6. Run: `await fixAllProSubscriptions(false)` // Actually fix

---

## What Gets Fixed

The fix updates subscriptions matching these criteria:

```sql
WHERE plan = 'PRO' AND (
  status = 'UNPAID'                          -- Old bug
  OR (status = 'ACTIVE' AND currentPeriodEnd IS NULL)  -- Missing expiration
  OR (status = 'ACTIVE' AND currentPeriodEnd < NOW())  -- Expired
)
```

**Changes applied:**
- `status` → `'ACTIVE'`
- `currentPeriodEnd` → `now + 1 year`
- `currentPeriodStart` → `now` (if null)
- `cancelAtPeriodEnd` → `false`

---

## Verification

### Test Individual User:

1. Log in as the fixed user (e.g., `abdulaziz1a3@gmail.com`)
2. Go to `/dashboard/talent-pool`
3. Select a resume
4. Click "Join for Free"
5. Should see: ✅ "Joined the Talent Pool!"

### Verify Subscription Status:

```javascript
// In browser console (as SUPER_ADMIN):
await fetch('/api/admin/debug-subscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'abdulaziz1a3@gmail.com' })
}).then(r => r.json()).then(console.log)
```

**Expected result:**
```json
{
  "hasActiveSubscription": true,
  "checks": {
    "planNotFree": true,
    "statusActive": true,
    "notExpired": true
  }
}
```

---

## Files Created

### API Endpoints (already existed):
- `src/app/api/admin/debug-subscription/route.ts` - Diagnostic tool
- `src/app/api/admin/fix-subscription/route.ts` - Fix single user

### API Endpoints (NEW):
- `src/app/api/admin/fix-all-pro-subscriptions/route.ts` - **Fix all broken Pro users**

### Helper Scripts:
- `scripts/browser-fix-subscription.js` - Browser console helper (single user)
- `scripts/browser-fix-all-pro-users.js` - **Browser console helper (all users)**
- `scripts/debug-and-fix-subscription.ts` - CLI version (requires npm install)

### Documentation:
- `docs/SUBSCRIPTION-FIX-README.md` - This file

---

## Future Prevention

### Current State (✅ Fixed)

**File:** `src/app/api/auth/register/route.ts:101-104`

New users now get:
```typescript
subscription: {
  create: {
    plan: 'FREE',
    status: 'ACTIVE',
  }
}
```

This is correct - new users:
- Start with FREE plan
- Have ACTIVE status (passes subscription check)
- Can upgrade to Pro via payment

### Subscription Check Logic

**File:** `src/lib/subscription.ts:5-42`

```typescript
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  // 1. Get user with subscription
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // 2. SUPER_ADMIN bypass
  if (user.role === 'SUPER_ADMIN') return true;

  // 3. Check plan is PRO or ENTERPRISE
  if (subscription.plan === 'FREE') return false;

  // 4. Check status is ACTIVE or TRIALING
  if (!['ACTIVE', 'TRIALING'].includes(subscription.status)) return false;

  // 5. Check not expired
  if (subscription.currentPeriodEnd < new Date()) return false;

  return true;
}
```

**This logic is correct** - it properly validates:
- ✅ Paid plan (PRO/ENTERPRISE)
- ✅ Active status
- ✅ Not expired

---

## Timeline of Events

| Date | Event | Impact |
|------|-------|--------|
| Before Jan 20 | New users get PRO/UNPAID | ❌ Users can't access Pro features |
| Jan 20, 2026 | Commit `383e08a` fixes registration | ✅ New users get FREE/ACTIVE |
| Jan 22, 2026 | This fix | ✅ Old users fixed retroactively |

---

## Summary

### What happened:
- Old bug gave new users broken Pro subscriptions
- Bug was fixed on Jan 20, but old users still broken
- Users with broken subscriptions can't join Talent Pool

### What we did:
1. Created diagnostic endpoint to identify broken subscriptions
2. Created fix endpoint for individual users
3. Created bulk fix endpoint for all affected users
4. Created browser console helpers for easy execution
5. Documented everything

### What you should do:
1. **Run the bulk fix**: `await fixAllProSubscriptions(false)` in browser console
2. **Verify it worked**: Test Talent Pool join with a fixed user
3. **Monitor**: Check if any new broken subscriptions appear (shouldn't happen)

### Going forward:
- ✅ New users get correct FREE/ACTIVE subscription
- ✅ Pro upgrades go through payment flow
- ✅ All subscription checks work correctly
- ✅ No more PRO/UNPAID subscriptions created
