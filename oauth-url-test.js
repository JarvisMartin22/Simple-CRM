// OAuth URL Tester
// This script tests the Gmail authentication flow with port 8080

import fetch from 'node-fetch';

async function testOAuthURL() {
  console.log('OAuth URL Test - Starting');
  
  try {
    // Replace with your actual Supabase URL if different
    const supabaseUrl = 'http://localhost:54321';
    
    const response = await fetch(`${supabaseUrl}/functions/v1/gmail-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: You'll need to add actual auth token for full test
        // 'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ test: true })
    });
    
    if (response.status === 401) {
      console.log('❌ ERROR: Authentication required (401 Unauthorized)');
      console.log('  You need to provide a valid authentication token.');
      console.log('  Sign in to your app and run the test from there, or:');
      console.log('  1. Get a token from your app');
      console.log('  2. Update this script with your token');
      console.log('  3. Run the script again');
      
      // Still try to verify environment variable using our check script
      console.log('\nChecking environment variables instead:');
      try {
        const { execSync } = await import('child_process');
        const redirectUriValue = execSync('supabase secrets list | grep GMAIL_REDIRECT_URI').toString();
        
        if (redirectUriValue.includes('localhost:8080')) {
          console.log('✅ GMAIL_REDIRECT_URI is correctly set to use port 8080');
          console.log(`   ${redirectUriValue.trim()}`);
        } else {
          console.log('❌ GMAIL_REDIRECT_URI is not using port 8080');
          console.log(`   Current value: ${redirectUriValue.trim()}`);
        }
      } catch (e) {
        console.log('❌ Could not check GMAIL_REDIRECT_URI');
      }
      
      return;
    }
    
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Auth URL Generated:', data.url);
    
    // Check that the URL contains localhost:8080
    if (data.url && data.url.includes('localhost:8080')) {
      console.log('✅ SUCCESS: URL contains correct port (8080)');
    } else {
      console.log('❌ ERROR: URL does not contain expected port');
      console.log('  Check GMAIL_REDIRECT_URI environment variable');
    }
    
    console.log('\nNext steps:');
    console.log('1. Verify this URL in your browser');
    console.log('2. Check Google Cloud Console has the following redirect URI:');
    console.log('   http://localhost:8080/auth/callback/gmail');
    console.log('3. Make sure both the legacy and new redirect URIs are configured:');
    console.log('   - http://localhost:8080/auth/callback/gmail');
    console.log('   - http://localhost:8080/auth-callback.html');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testOAuthURL(); 