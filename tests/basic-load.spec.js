import { test, expect } from '@playwright/test';

test('Basic app loading test', async ({ page }) => {
  console.log('🚨 TESTING BASIC APP LOAD');
  
  // Capture ALL console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[BROWSER ${type.toUpperCase()}] ${text}`);
  });
  
  // Capture page errors
  page.on('pageerror', (error) => {
    console.log(`[PAGE ERROR] ${error.toString()}`);
  });
  
  try {
    await page.goto('http://localhost:5174/void-admiral/');
    console.log('✅ Page loaded successfully');
    
    // Wait a bit to see console output
    await page.waitForTimeout(3000);
    
    // Check if faction selector appears
    const factionSelector = page.locator('[aria-label="Faction"]');
    const isVisible = await factionSelector.isVisible();
    console.log(`📋 Faction selector visible: ${isVisible}`);
    
  } catch (error) {
    console.log(`❌ Error during test: ${error.message}`);
  }
});
