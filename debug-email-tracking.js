import { chromium } from 'playwright';

async function debugEmailTracking() {
  console.log('🔍 Starting Email Tracking Debug with Playwright...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Navigate to CRM app
    console.log('📱 Navigating to CRM app...');
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'debug-01-homepage.png', fullPage: true });
    console.log('✅ Homepage loaded - screenshot saved');

    // 2. Check if user is logged in
    console.log('\n🔐 Checking authentication status...');
    const isLoggedIn = await page.locator('text=Dashboard').isVisible().catch(() => false);
    
    if (!isLoggedIn) {
      console.log('❌ User not logged in, attempting login...');
      
      // Try to find login form
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      
      if (await emailInput.isVisible() && await passwordInput.isVisible()) {
        await emailInput.fill('jarvistest@jarvis.com');
        await passwordInput.fill('password123');
        
        const loginButton = page.locator('button:has-text("Sign in"), button:has-text("Login"), button[type="submit"]').first();
        await loginButton.click();
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: 'debug-02-after-login.png', fullPage: true });
        console.log('✅ Login attempted - screenshot saved');
      }
    } else {
      console.log('✅ User already logged in');
    }

    // 3. Navigate to campaigns
    console.log('\n📧 Navigating to campaigns...');
    await page.goto('http://localhost:8080/app/campaigns');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'debug-03-campaigns.png', fullPage: true });
    
    // 4. Look for existing campaign or test data
    console.log('\n🎯 Looking for campaign f4690d47-2d77-4f88-ab21-fe5ab268eb35...');
    const campaignExists = await page.locator('text=f4690d47').isVisible().catch(() => false);
    
    if (campaignExists) {
      console.log('✅ Campaign found, clicking on it...');
      await page.locator('text=f4690d47').first().click();
      await page.waitForLoadState('networkidle');
    } else {
      console.log('❌ Campaign not found, checking for any campaigns...');
      const anyCampaign = await page.locator('[data-testid="campaign-item"], .campaign-item, tr').first();
      if (await anyCampaign.isVisible()) {
        await anyCampaign.click();
        await page.waitForLoadState('networkidle');
      }
    }
    
    await page.screenshot({ path: 'debug-04-campaign-details.png', fullPage: true });

    // 5. Check analytics/tracking data
    console.log('\n📊 Checking analytics data...');
    const analyticsSection = page.locator('text=Analytics, text=Opens, text=Clicks, [data-testid="analytics"]').first();
    
    if (await analyticsSection.isVisible()) {
      console.log('✅ Analytics section found');
      
      // Look for open counts
      const openCount = await page.locator('text=/Opens?.*[0-9]/, [data-testid="open-count"]').textContent().catch(() => 'Not found');
      const clickCount = await page.locator('text=/Clicks?.*[0-9]/, [data-testid="click-count"]').textContent().catch(() => 'Not found');
      
      console.log(`📈 Open Count: ${openCount}`);
      console.log(`📈 Click Count: ${clickCount}`);
    } else {
      console.log('❌ Analytics section not found');
    }

    // 6. Test the tracking pixel directly
    console.log('\n🎯 Testing tracking pixel directly...');
    const trackingPixelUrl = `https://bujaaqjxrvntcneoarkj.supabase.co/rest/v1/rpc/track_email_open`;
    
    // Use page.evaluate to make API call from browser context
    const trackingResult = await page.evaluate(async (url) => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6IkR3MUpKV0x3cmJOelgwUkUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2J1amFhcWp4cnZudGNuZW9hcmtqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmMGM0OTZiMi04MWFkLTRjOTYtYTE3MS0zYzRjMDEwNThjZWUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzQ4NjQzMDc0LCJpYXQiOjE3NDg2Mzk0NzQsImVtYWlsIjoiamFydmlzdGVzdEBqYXJ2aXMuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NDg2Mzk0NzR9XSwic2Vzc2lvbl9pZCI6IjYzYzk0Njc4LTM3MGYtNGUzZi04ZDNiLTAzMTg5MmRkNDlmYyIsImlzX2Fub255bW91cyI6ZmFsc2V9.QXrcpsOXOH86Y8trL1WtVSnNI7Ua2JOKSS9IIvSAEx0',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NTQwNzQsImV4cCI6MjA2MjEzMDA3NH0.cX-07WwAXeutGV1_lahlsloiu_KIPIy8SQXmHfrGKXw',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ tracking_id: 'bae94831-e3db-4594-aeba-51232295c2e1' })
        });
        
        const data = await response.text();
        return { status: response.status, data };
      } catch (error) {
        return { error: error.message };
      }
    }, trackingPixelUrl);
    
    console.log('🎯 Tracking API Result:', trackingResult);

    // 7. Check browser console for errors
    console.log('\n🔍 Checking browser console...');
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    page.on('pageerror', error => console.log(`PAGE ERROR: ${error}`));

    // 8. Check network requests
    console.log('\n🌐 Monitoring network requests...');
    page.on('request', request => {
      if (request.url().includes('track') || request.url().includes('email')) {
        console.log(`REQUEST: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('track') || response.url().includes('email')) {
        console.log(`RESPONSE: ${response.status()} ${response.url()}`);
      }
    });

    // 9. Final comprehensive screenshot
    await page.screenshot({ path: 'debug-05-final-state.png', fullPage: true });
    console.log('\n✅ Final screenshot saved');

    console.log('\n🎯 Debug session complete! Check the screenshots for visual confirmation.');

  } catch (error) {
    console.error('❌ Error during debugging:', error);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the debug
debugEmailTracking().catch(console.error); 