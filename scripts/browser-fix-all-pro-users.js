/**
 * Browser Console Script - Fix All Broken PRO Subscriptions
 *
 * USAGE:
 * 1. Log in to your app as a SUPER_ADMIN user
 * 2. Open browser DevTools console (F12)
 * 3. Copy and paste this entire script
 * 4. Run: await fixAllProSubscriptions(true)  // Dry run first
 * 5. Review the results
 * 6. Run: await fixAllProSubscriptions(false) // Actually fix them
 */

async function fixAllProSubscriptions(dryRun = true) {
    console.log('\n=== Fix All Broken PRO Subscriptions ===\n');
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will fix)'}\n`);

    if (!dryRun) {
        const confirmed = confirm(
            'This will UPDATE all broken PRO subscriptions in the database.\n\n' +
            'Are you sure you want to proceed?'
        );
        if (!confirmed) {
            console.log('❌ Cancelled by user');
            return;
        }
    }

    try {
        const response = await fetch('/api/admin/fix-all-pro-subscriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dryRun })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('❌ Request failed:', error);
            return;
        }

        const result = await response.json();

        console.log('✅ Success!\n');
        console.log(`Found: ${result.results.found} broken PRO subscriptions`);
        console.log(`Fixed: ${result.results.fixed}`);
        console.log(`Skipped: ${result.results.skipped}`);
        console.log(`\nMessage: ${result.message}\n`);

        if (result.results.users.length > 0) {
            console.log('Affected Users:');
            console.table(result.results.users.map(u => ({
                'Email': u.email,
                'Name': u.name || '(no name)',
                'Created': new Date(u.createdAt).toLocaleDateString(),
                'Old Status': u.oldStatus,
                'Old Period End': u.oldPeriodEnd ? new Date(u.oldPeriodEnd).toLocaleDateString() : 'null',
                'Action': u.action
            })));
        }

        if (dryRun && result.results.found > 0) {
            console.log('\n💡 To actually fix these subscriptions, run:');
            console.log('   await fixAllProSubscriptions(false)');
        } else if (!dryRun && result.results.fixed > 0) {
            console.log('\n✅ All broken PRO subscriptions have been fixed!');
            console.log('\nNext steps:');
            console.log('1. Test logging in as one of the affected users');
            console.log('2. Navigate to /dashboard/talent-pool');
            console.log('3. Verify they can now join the Talent Pool');
        } else if (result.results.found === 0) {
            console.log('\n✅ No broken PRO subscriptions found - all good!');
        }

        console.log('\n=== Done ===\n');
        return result;

    } catch (error) {
        console.error('\n❌ Error:', error);
        throw error;
    }
}

// Display usage instructions
console.log('%c=== Fix All PRO Subscriptions Tool Loaded ===', 'color: green; font-weight: bold; font-size: 14px');
console.log('\nUsage:');
console.log('  await fixAllProSubscriptions(true)   // Dry run - see what would be fixed');
console.log('  await fixAllProSubscriptions(false)  // Actually fix them');
console.log('\nMake sure you are logged in as a SUPER_ADMIN user!');
console.log('');
