import { test, expect } from '@playwright/test';

/**
 * Console debugging test - captures ALL browser console output
 * This gives us direct access to debug logs without screenshots
 */
test.describe('Console Debug', () => {
  
  test('Capture refit console logs', async ({ page }) => {
    console.log('🚨 STARTING CONSOLE CAPTURE TEST');
    
    // Capture ALL console messages with color coding
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      // Color code the output
      const colors = {
        log: '\x1b[37m',      // white
        info: '\x1b[36m',     // cyan  
        warn: '\x1b[33m',     // yellow
        error: '\x1b[31m',    // red
        debug: '\x1b[35m'     // magenta
      };
      
      const color = colors[type] || '\x1b[37m';
      const reset = '\x1b[0m';
      
      // Only show our debug messages and errors
      if (text.includes('🚨') || text.includes('🎯') || text.includes('🔧') || 
          text.includes('ERROR') || text.includes('undefined') || type === 'error') {
        console.log(`${color}[BROWSER ${type.toUpperCase()}]${reset} ${text}`);
      }
    });
    
    // Navigate to the app
    await page.goto('http://localhost:5174/void-admiral/');
    
    // Handle create fleet screen if needed
    const createFleetButton = page.locator('button:has-text("Start Building")');
    if (await createFleetButton.isVisible()) {
      await page.fill('input[placeholder*="fleet name" i]', 'Debug Test Fleet');
      await createFleetButton.click();
      await page.waitForSelector('[aria-label="Faction"]', { timeout: 10000 });
    }
    
    console.log('🌐 App loaded, starting refit test...');
    
    // Select Loyalists faction
    await page.click('[aria-label="Faction"]');
    await page.waitForSelector('[role="listbox"]');
    await page.click('[role="option"]:has-text("Loyalists")');
    
    // Add a capital ship
    console.log('📝 Adding Battleship...');
    await page.click('text=Add Capital Ship');
    await page.waitForSelector('text=Battleship');
    await page.click('text=Battleship');
    
    // Select prow weapon first
    console.log('📝 Selecting prow weapon...');
    await page.click('text=Prow');
    await page.waitForSelector('text=Missile Pods');
    await page.click('text=Missile Pods');
    
    // Wait for weapon to be selected
    await page.waitForTimeout(1000);
    
    // Now click the refit button
    console.log('📝 Opening refit modal...');
    await page.click('button:has-text("Refit")');
    await page.waitForSelector('text=Available Refits');
    
    // Click on Up-gunned Prow refit
    console.log('📝 Clicking Up-gunned Prow refit...');
    await page.click('text=Up-gunned Prow');
    
    // Wait for any console output to appear
    await page.waitForTimeout(3000);
    
    console.log('✅ Refit test completed - check console output above');
  });

  test('Quick squadron refit console test', async ({ page }) => {
    console.log('🚨 SQUADRON REFIT CONSOLE TEST');
    
    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🚨') || text.includes('🎯') || text.includes('ERROR') || msg.type() === 'error') {
        console.log(`[BROWSER] ${text}`);
      }
    });
    
    await page.goto('http://localhost:5174/void-admiral/');
    
    // Handle create fleet screen
    const createFleetButton = page.locator('button:has-text("Start Building")');
    if (await createFleetButton.isVisible()) {
      await page.fill('input[placeholder*="fleet name" i]', 'Squadron Test');
      await createFleetButton.click();
      await page.waitForSelector('[aria-label="Faction"]', { timeout: 10000 });
    }
    
    // Select faction and add squadron
    await page.click('[aria-label="Faction"]');
    await page.waitForSelector('[role="listbox"]');
    await page.click('[role="option"]:has-text("Loyalists")');
    
    await page.click('text=Add Squadron');
    await page.waitForSelector('text=Frigate');
    await page.click('text=Frigate');
    
    // Apply squadron refit
    await page.click('button:has-text("Squadron Refit")');
    await page.waitForSelector('text=Sloped Armour');
    await page.click('text=Sloped Armour');
    
    await page.waitForTimeout(2000);
    console.log('✅ Squadron refit test completed');
  });

});
