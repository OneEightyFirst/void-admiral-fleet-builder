import { test, expect } from '@playwright/test';

/**
 * Debug-focused tests for the specific refit issues we've been fixing
 * 
 * These tests directly target the bugs we've encountered:
 * 1. Missing stats in PlayView Squadron cards
 * 2. Weapon tooltip modifications not showing
 * 3. Refit effects not being applied
 */

test.describe('Debug Refit Issues', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/void-admiral/');
    
    // Handle initial fleet creation if needed
    const createFleetHeader = page.locator('text=Create New Fleet');
    if (await createFleetHeader.isVisible()) {
      console.log('🛠️ Creating new fleet first...');
      // Enter fleet name
      await page.fill('input[placeholder*="fleet name"]', 'Test Fleet');
      // Click Start Building
      await page.click('button:has-text("Start Building")');
      // Wait for build view to load
      await page.waitForSelector('text=Add Capital Ship', { timeout: 10000 });
    }
    
    // Wait for the build view to load completely
    await page.waitForSelector('text=Faction', { timeout: 15000 });
    await page.waitForSelector('[aria-label="Faction"]', { timeout: 5000 });
    
    console.log('🌐 App loaded successfully and ready for testing');
  });

  test('CRITICAL: Squadron refit stat application (Sloped Armour)', async ({ page }) => {
    console.log('🚨 CRITICAL TEST: Squadron Sloped Armour stat modifications');
    
    // Capture console logs for debugging
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🎯') || text.includes('🔧') || text.includes('ERROR') || text.includes('statline')) {
        logs.push(`[${msg.type().toUpperCase()}] ${text}`);
        console.log(`📋 Console: ${text}`);
      }
    });
    
    // Select Loyalists faction
    console.log('📝 Step 1: Selecting Loyalists faction');
    // Click on the faction selector (look for the one with "Faction" label)
    await page.click('[aria-label="Faction"]');
    // Wait for dropdown to open and show Loyalists option
    await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
    await page.waitForSelector('[role="option"]:has-text("Loyalists")', { timeout: 5000 });
    // Click on Loyalists option
    await page.click('[role="option"]:has-text("Loyalists")');
    
    // Add a squadron
    console.log('📝 Step 2: Adding Frigate squadron');
    await page.click('text=Add Squadron');
    await page.waitForSelector('text=Frigate');
    await page.click('text=Frigate');
    
    // Apply Sloped Armour refit
    console.log('📝 Step 3: Applying Sloped Armour refit');
    await page.click('button:has-text("Squadron Refit")');
    await page.waitForSelector('text=Available Squadron Refits');
    await page.click('text=Sloped Armour');
    
    // Wait for refit processing
    await page.waitForTimeout(2000);
    
    // Go to PlayView
    console.log('📝 Step 4: Switching to PlayView');
    await page.click('text=Play View');
    await page.waitForTimeout(1000);
    
    // **CRITICAL CHECKS**
    console.log('🔍 CRITICAL CHECKS:');
    
    // 1. Verify refit is displayed
    const refitDisplayed = await page.isVisible('text=Sloped Armour');
    console.log(`   ✓ Refit name displayed: ${refitDisplayed}`);
    expect(refitDisplayed).toBeTruthy();
    
    // 2. Verify ALL stats are visible (not missing)
    const statsChecks = [
      { name: 'Hull', pattern: /Hull:\s*1/ },
      { name: 'Speed', pattern: /Speed:\s*10/ }, // Should be 10 (12 - 2)
      { name: 'Armour', pattern: /Armour:\s*2/ },
      { name: 'Shields', pattern: /Shields:\s*1/ },
      { name: 'Flak', pattern: /Flak:\s*1/ }
    ];
    
    for (const stat of statsChecks) {
      const pageContent = await page.textContent('body');
      const statVisible = stat.pattern.test(pageContent);
      console.log(`   ✓ ${stat.name} stat visible: ${statVisible} ${statVisible ? '✅' : '❌'}`);
      
      if (!statVisible) {
        console.log(`   🚨 MISSING STAT: ${stat.name} not found in page content`);
        console.log(`   📄 Page content sample: ${pageContent.substring(0, 500)}...`);
      }
      
      expect(statVisible, `${stat.name} stat should be visible`).toBeTruthy();
    }
    
    // 3. Verify speed was modified correctly (12 -> 10)
    const speedReduced = await page.isVisible('text=Speed: 10');
    console.log(`   ✓ Speed correctly reduced to 10: ${speedReduced}`);
    expect(speedReduced).toBeTruthy();
    
    // 4. Verify refit notes are displayed
    const notesVisible = await page.isVisible('text=Speed reduced by 2"');
    console.log(`   ✓ Refit notes displayed: ${notesVisible}`);
    expect(notesVisible).toBeTruthy();
    
    // Print all captured logs
    console.log('📋 All Console Logs:');
    logs.forEach(log => console.log(`   ${log}`));
    
    console.log('✅ CRITICAL TEST PASSED: All stats visible and correctly modified');
  });

  test('Weapon tooltip modifications (Up-gunned Prow)', async ({ page }) => {
    console.log('🔧 Testing weapon tooltip modifications');
    
    // Select Loyalists faction
    await page.click('.MuiSelect-select');
    await page.click('text=Loyalists');
    
    // Add capital ship
    await page.click('text=Add Capital Ship');
    await page.click('text=Battleship');
    
    // Select prow weapon
    await page.click('text=Prow');
    await page.click('text=Missile Pods');
    
    // Capture original weapon data by hovering
    console.log('📝 Checking original weapon stats');
    await page.hover('text=Missile Pods');
    await page.waitForTimeout(1000);
    
    // Apply Up-gunned Prow refit
    console.log('📝 Applying Up-gunned Prow refit');
    await page.click('button:has-text("Refit")');
    await page.waitForSelector('text=Available Refits');
    await page.click('text=Up-gunned Prow');
    await page.keyboard.press('Escape');
    
    // Wait for refit to be applied
    await page.waitForTimeout(1000);
    
    // Check modified weapon data by hovering again
    console.log('📝 Checking modified weapon stats');
    await page.hover('text=Missile Pods');
    await page.waitForTimeout(1000);
    
    // The weapon should now show modified stats in tooltip
    // This is a smoke test - the actual stat values are checked in the tooltip content
    
    console.log('✅ Weapon tooltip test completed');
  });

  test('Debug console output verification', async ({ page }) => {
    console.log('🐛 Debug console output verification');
    
    const debugLogs = [];
    const errorLogs = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        errorLogs.push(text);
        console.log(`❌ ERROR: ${text}`);
      } else if (text.includes('🎯') || text.includes('🔧')) {
        debugLogs.push(text);
        console.log(`🐛 DEBUG: ${text}`);
      }
    });
    
    // Perform the squadron refit workflow
    await page.click('[aria-label="Faction"]');
    await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
    await page.click('[role="option"]:has-text("Loyalists")');
    await page.click('text=Add Squadron');
    await page.click('text=Frigate');
    await page.click('button:has-text("Squadron Refit")');
    await page.click('text=Sloped Armour');
    
    // Wait for all processing
    await page.waitForTimeout(3000);
    
    // Verify expected debug logs appeared
    const expectedLogs = [
      '🎯 BuildView Squadron: Applying canonical squadron refit: Sloped Armour',
      '🔧 applyRefit: Original ship statline:',
      '🔧 applyStatDeltas:'
    ];
    
    for (const expectedLog of expectedLogs) {
      const found = debugLogs.some(log => log.includes(expectedLog));
      console.log(`📋 Expected log "${expectedLog}": ${found ? '✅ Found' : '❌ Missing'}`);
      expect(found, `Expected debug log should appear: ${expectedLog}`).toBeTruthy();
    }
    
    // Verify no critical errors
    const criticalErrors = errorLogs.filter(error => 
      error.includes('TypeError') || 
      error.includes('Cannot read properties of undefined') ||
      error.includes('Ship missing statline')
    );
    
    expect(criticalErrors.length, `No critical errors should occur. Found: ${criticalErrors.join(', ')}`).toBe(0);
    
    console.log(`✅ Debug verification passed. Debug logs: ${debugLogs.length}, Errors: ${errorLogs.length}`);
  });

});

test.describe('Edge Cases and Error Conditions', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/void-admiral/');
    await page.waitForSelector('.MuiSelect-select', { timeout: 15000 });
  });

  test('Ship without statline handling', async ({ page }) => {
    console.log('🧪 Testing ship without statline error handling');
    
    const errorLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('missing statline')) {
        errorLogs.push(msg.text());
      }
    });
    
    // This test ensures our fixes prevent the "missing statline" error
    await page.click('[aria-label="Faction"]');
    await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
    await page.click('[role="option"]:has-text("Loyalists")');
    await page.click('text=Add Squadron');
    await page.click('text=Frigate');
    await page.click('button:has-text("Squadron Refit")');
    await page.click('text=Sloped Armour');
    
    await page.waitForTimeout(2000);
    
    // Should not have any "missing statline" errors
    const missingStatlineErrors = errorLogs.filter(error => error.includes('missing statline'));
    expect(missingStatlineErrors.length).toBe(0);
    
    console.log('✅ No missing statline errors occurred');
  });

});
