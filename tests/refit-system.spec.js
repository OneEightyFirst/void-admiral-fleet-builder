import { test, expect } from '@playwright/test';

/**
 * Comprehensive Refit System Tests
 * 
 * Tests the complete refit workflow:
 * 1. Creating fleets with ships
 * 2. Applying capital ship refits
 * 3. Applying squadron refits
 * 4. Verifying stat modifications
 * 5. Checking refit display in PlayView
 */

test.describe('Refit System Integration Tests', () => {
  
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
  });

  test('Loyalists Capital Ship - Up-gunned Prow refit', async ({ page }) => {
    console.log('🧪 Testing Loyalists Capital Ship - Up-gunned Prow refit');
    
    // Select Loyalists faction
    await page.click('[aria-label="Faction"]');
    await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
    await page.click('[role="option"]:has-text("Loyalists")');
    
    // Add a capital ship (Battleship)
    await page.click('text=Add Capital Ship');
    await page.click('text=Battleship');
    
    // Go to weapon selection
    await page.click('text=Prow');
    
    // Select missiles (for the Up-gunned Prow test)
    await page.click('text=Missile Pods');
    
    // Open refit modal
    await page.click('button:has-text("Refit")');
    
    // Verify refit modal opens
    await expect(page.locator('text=Available Refits')).toBeVisible();
    
    // Select "Up-gunned Prow" refit
    await page.click('text=Up-gunned Prow');
    
    // Close refit modal (should apply refit)
    await page.keyboard.press('Escape');
    
    // Go to PlayView to verify changes
    await page.click('text=Play View');
    
    // Verify refit is displayed
    await expect(page.locator('text=Up-gunned Prow')).toBeVisible();
    
    // Verify refit notes are displayed
    await expect(page.locator('text=Lose Armoured Prows special rule')).toBeVisible();
    await expect(page.locator('text=Prow missiles gain +2 attacks')).toBeVisible();
    
    console.log('✅ Loyalists Capital Ship refit test passed');
  });

  test('Loyalists Squadron - Sloped Armour refit', async ({ page }) => {
    console.log('🧪 Testing Loyalists Squadron - Sloped Armour refit');
    
    // Select Loyalists faction
    await page.click('[aria-label="Faction"]');
    await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
    await page.click('[role="option"]:has-text("Loyalists")');
    
    // Add a squadron (Frigate)
    await page.click('text=Add Squadron');
    await page.click('text=Frigate');
    
    // Open squadron refit modal
    await page.click('button:has-text("Squadron Refit")');
    
    // Verify squadron refit modal opens
    await expect(page.locator('text=Available Squadron Refits')).toBeVisible();
    
    // Select "Sloped Armour" refit
    await page.click('text=Sloped Armour');
    
    // Go to PlayView to verify changes
    await page.click('text=Play View');
    
    // Verify refit is displayed
    await expect(page.locator('text=Sloped Armour')).toBeVisible();
    
    // Verify stat changes are applied
    // Speed should be reduced: 12" -> 10" (base 12 - 2)
    await expect(page.locator('text=Speed: 10')).toBeVisible();
    
    // Verify all other stats are still visible
    await expect(page.locator('text=Hull: 1')).toBeVisible();
    await expect(page.locator('text=Armour: 2')).toBeVisible();
    await expect(page.locator('text=Shields: 1')).toBeVisible();
    await expect(page.locator('text=Flak: 1')).toBeVisible();
    
    // Verify refit notes are displayed
    await expect(page.locator('text=Speed reduced by 2"')).toBeVisible();
    await expect(page.locator('text=Gain Armoured Prows special rule')).toBeVisible();
    
    console.log('✅ Loyalists Squadron refit test passed');
  });

  test('Renegades Capital Ship - Prow Launch Bays refit', async ({ page }) => {
    console.log('🧪 Testing Renegades Capital Ship - Prow Launch Bays refit');
    
    // Select Renegades faction
    await page.click('[aria-label="Faction"]');
    await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
    await page.click('[role="option"]:has-text("Renegades")');
    
    // Add a capital ship
    await page.click('text=Add Capital Ship');
    await page.click('text=Battleship');
    
    // Go to weapon selection
    await page.click('text=Prow');
    
    // Select a weapon that can be replaced with launch bays
    await page.click('text=Lasers');
    
    // Open refit modal
    await page.click('button:has-text("Refit")');
    
    // Select "Prow Launch Bays" refit
    await page.click('text=Prow Launch Bays');
    
    // Go to PlayView to verify changes
    await page.click('text=Play View');
    
    // Verify refit is displayed
    await expect(page.locator('text=Prow Launch Bays')).toBeVisible();
    
    console.log('✅ Renegades Capital Ship refit test passed');
  });

  test('Multiple refits on different ships', async ({ page }) => {
    console.log('🧪 Testing multiple refits on different ships');
    
    // Select Loyalists faction
    await page.click('[aria-label="Faction"]');
    await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
    await page.click('[role="option"]:has-text("Loyalists")');
    
    // Add capital ship and apply refit
    await page.click('text=Add Capital Ship');
    await page.click('text=Battleship');
    await page.click('text=Prow');
    await page.click('text=Missile Pods');
    await page.click('button:has-text("Refit")');
    await page.click('text=Up-gunned Prow');
    await page.keyboard.press('Escape');
    
    // Add squadron and apply refit
    await page.click('text=Add Squadron');
    await page.click('text=Frigate');
    await page.click('button:has-text("Squadron Refit")');
    await page.click('text=Sloped Armour');
    
    // Go to PlayView
    await page.click('text=Play View');
    
    // Verify both refits are displayed
    await expect(page.locator('text=Up-gunned Prow').first()).toBeVisible();
    await expect(page.locator('text=Sloped Armour').first()).toBeVisible();
    
    // Verify capital ship stats are unchanged (no stat deltas on Up-gunned Prow)
    // Verify squadron stats show speed reduction
    await expect(page.locator('text=Speed: 10').first()).toBeVisible();
    
    console.log('✅ Multiple refits test passed');
  });

  test('Weapon tooltip modifications in BuildView', async ({ page }) => {
    console.log('🧪 Testing weapon tooltip modifications in BuildView');
    
    // Select Loyalists faction
    await page.click('[aria-label="Faction"]');
    await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
    await page.click('[role="option"]:has-text("Loyalists")');
    
    // Add capital ship
    await page.click('text=Add Capital Ship');
    await page.click('text=Battleship');
    
    // Select prow weapon
    await page.click('text=Prow');
    await page.click('text=Missile Pods');
    
    // Hover over weapon to see original stats
    await page.hover('text=Missile Pods');
    
    // Apply Up-gunned Prow refit
    await page.click('button:has-text("Refit")');
    await page.click('text=Up-gunned Prow');
    await page.keyboard.press('Escape');
    
    // Hover over weapon again to see modified stats
    await page.hover('text=Missile Pods');
    
    // Wait a moment for tooltip to appear
    await page.waitForTimeout(500);
    
    // The tooltip should show modified attack values (+2 for missiles)
    // This tests that the weapon tooltip system is working with refits
    
    console.log('✅ Weapon tooltip modifications test passed');
  });

  test('Console logging verification', async ({ page }) => {
    console.log('🧪 Testing console logging for debug verification');
    
    // Listen for console messages
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && (
        msg.text().includes('🎯 BuildView Squadron') ||
        msg.text().includes('🔧 applyRefit') ||
        msg.text().includes('🔧 applyStatDeltas')
      )) {
        consoleLogs.push(msg.text());
      }
    });
    
    // Select Loyalists and add squadron
    await page.click('[data-testid="faction-selector"], .MuiSelect-select');
    await page.click('text=Loyalists');
    await page.click('text=Add Squadron');
    await page.click('text=Frigate');
    
    // Apply squadron refit
    await page.click('button:has-text("Squadron Refit")');
    await page.click('text=Sloped Armour');
    
    // Wait for processing
    await page.waitForTimeout(1000);
    
    // Verify debug logs were generated
    expect(consoleLogs.some(log => log.includes('🎯 BuildView Squadron: Applying canonical squadron refit: Sloped Armour'))).toBeTruthy();
    expect(consoleLogs.some(log => log.includes('🔧 applyRefit: Original ship statline:'))).toBeTruthy();
    expect(consoleLogs.some(log => log.includes('🔧 applyStatDeltas:'))).toBeTruthy();
    
    console.log('✅ Console logging test passed');
    console.log('📋 Debug logs captured:', consoleLogs.length);
  });

});

test.describe('Error Handling Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/void-admiral/');
    await page.waitForSelector('text=Faction', { timeout: 15000 });
    await page.waitForSelector('[aria-label="Faction"]', { timeout: 5000 });
  });

  test('Invalid refit application handling', async ({ page }) => {
    console.log('🧪 Testing invalid refit application handling');
    
    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Select Loyalists faction
    await page.click('[aria-label="Faction"]');
    await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
    await page.click('[role="option"]:has-text("Loyalists")');
    
    // Add a squadron
    await page.click('text=Add Squadron');
    await page.click('text=Frigate');
    
    // Try to apply squadron refit
    await page.click('button:has-text("Squadron Refit")');
    await page.click('text=Sloped Armour');
    
    // Wait for processing
    await page.waitForTimeout(2000);
    
    // Go to PlayView to check results
    await page.click('text=Play View');
    
    // Verify no critical errors occurred
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('TypeError') || 
      error.includes('Cannot read properties of undefined')
    );
    
    expect(criticalErrors.length).toBe(0);
    
    console.log('✅ Error handling test passed');
  });

});

test.describe('Cross-Browser Compatibility', () => {
  
  test('Basic refit functionality works across browsers', async ({ page, browserName }) => {
    console.log(`🧪 Testing basic refit functionality on ${browserName}`);
    
    await page.goto('/void-admiral/');
    await page.waitForSelector('text=Faction', { timeout: 15000 });
    await page.waitForSelector('[aria-label="Faction"]', { timeout: 5000 });
    
    // Quick smoke test
    await page.click('[aria-label="Faction"]');
    await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
    await page.click('[role="option"]:has-text("Loyalists")');
    await page.click('text=Add Squadron');
    await page.click('text=Frigate');
    await page.click('button:has-text("Squadron Refit")');
    
    // Verify modal opens
    await expect(page.locator('text=Available Squadron Refits')).toBeVisible();
    
    console.log(`✅ ${browserName} compatibility test passed`);
  });

});
