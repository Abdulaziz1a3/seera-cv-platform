/**
 * Browser Console Script - Debug and Fix Subscription
 *
 * USAGE:
 * 1. Log in to your app as a SUPER_ADMIN user
 * 2. Open browser DevTools console (F12)
 * 3. Copy and paste this entire script
 * 4. Run: await debugAndFixSubscription('abdulaziz1a3@gmail.com')
 */

async function debugAndFixSubscription(email) {
    console.log('\n=== Subscription Diagnostic & Fix Tool ===\n');
    console.log(`Target Email: ${email}\n`);

    try {
        // Step 1: Run diagnostic
        console.log('Step 1: Running diagnostic...');
        const debugResponse = await fetch('/api/admin/debug-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (!debugResponse.ok) {
            const error = await debugResponse.json();
            console.error('❌ Diagnostic failed:', error);
            return;
        }

        const diagnostic = await debugResponse.json();

        // Display diagnostic results
        console.log('✅ Diagnostic complete\n');
        console.log('User Info:');
        console.log(`  Email: ${diagnostic.email}`);
        console.log(`  User ID: ${diagnostic.userId}`);
        console.log(`  Role: ${diagnostic.role}`);
        console.log(`  Has Talent Profile: ${diagnostic.hasTalentProfile}`);
        console.log(`  Resume Count: ${diagnostic.resumeCount}`);

        console.log('\nSubscription Info:');
        if (diagnostic.subscription) {
            console.log(`  Plan: ${diagnostic.subscription.plan}`);
            console.log(`  Status: ${diagnostic.subscription.status}`);
            console.log(`  Period Start: ${diagnostic.subscription.currentPeriodStart || 'null'}`);
            console.log(`  Period End: ${diagnostic.subscription.currentPeriodEnd || 'null'}`);
        } else {
            console.log('  ❌ No subscription record');
        }

        console.log('\nSubscription Checks:');
        console.log(`  ✓ Is Super Admin: ${diagnostic.checks.isSuperAdmin ? '✅' : '❌'}`);
        console.log(`  ✓ Plan Not Free: ${diagnostic.checks.planNotFree ? '✅' : '❌'}`);
        console.log(`  ✓ Status Active: ${diagnostic.checks.statusActive ? '✅' : '❌'}`);
        console.log(`  ✓ Not Expired: ${diagnostic.checks.notExpired ? '✅' : '❌'}`);

        console.log(`\nFinal Result: hasActiveSubscription = ${diagnostic.hasActiveSubscription ? '✅ TRUE' : '❌ FALSE'}`);

        if (diagnostic.failureReason && diagnostic.failureReason.length > 0) {
            console.log('\n❌ Failure Reasons:');
            diagnostic.failureReason.forEach(reason => console.log(`  - ${reason}`));
        }

        // Step 2: Fix if needed
        if (!diagnostic.hasActiveSubscription && !diagnostic.checks.isSuperAdmin) {
            console.log('\n' + diagnostic.recommendedFix);
            console.log('\nStep 2: Fixing subscription...');

            const fixResponse = await fetch('/api/admin/fix-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!fixResponse.ok) {
                const error = await fixResponse.json();
                console.error('❌ Fix failed:', error);
                return;
            }

            const fixResult = await fixResponse.json();
            console.log('✅ Subscription fixed successfully!\n');
            console.log('New Subscription:');
            console.log(`  Plan: ${fixResult.subscription.plan}`);
            console.log(`  Valid Until: ${fixResult.subscription.validUntil}`);

            // Step 3: Verify fix
            console.log('\nStep 3: Verifying fix...');
            const verifyResponse = await fetch('/api/admin/debug-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const verifyDiagnostic = await verifyResponse.json();
            console.log(`hasActiveSubscription: ${verifyDiagnostic.hasActiveSubscription ? '✅ TRUE' : '❌ FALSE'}`);

            if (verifyDiagnostic.hasActiveSubscription) {
                console.log('\n✅ SUCCESS! User can now join Talent Pool');
                console.log('\nNext steps:');
                console.log('1. Log in as ' + email);
                console.log('2. Navigate to /dashboard/talent-pool');
                console.log('3. Select a resume');
                console.log('4. Click "Join for Free"');
                console.log('5. Verify successful join');
            } else {
                console.log('\n❌ WARNING: Fix may not have worked correctly');
                console.log('Failure reasons:', verifyDiagnostic.failureReason);
            }
        } else {
            console.log('\n✅ Subscription check PASSED - No fix needed');
        }

        console.log('\n=== Done ===\n');
        return diagnostic;

    } catch (error) {
        console.error('\n❌ Error:', error);
        throw error;
    }
}

// Display usage instructions
console.log('%c=== Subscription Debug & Fix Tool Loaded ===', 'color: green; font-weight: bold; font-size: 14px');
console.log('\nUsage:');
console.log('  await debugAndFixSubscription("abdulaziz1a3@gmail.com")');
console.log('\nMake sure you are logged in as a SUPER_ADMIN user!');
console.log('');
