// Gmail Integration Environment Check
// This script helps verify that the Gmail integration environment variables are set correctly

import { execSync } from 'child_process';

async function checkGmailEnv() {
  console.log('✅ Gmail Integration Environment Check');
  console.log('-------------------------------------');
  
  try {
    // Get the redirect URI from Supabase environment
    console.log('Checking GMAIL_REDIRECT_URI environment variable:');
    try {
      const redirectUriValue = execSync('supabase secrets list | grep GMAIL_REDIRECT_URI').toString();
      if (redirectUriValue.includes('localhost:8080')) {
        console.log('✅ GMAIL_REDIRECT_URI is set and contains port 8080');
        console.log(`   ${redirectUriValue.trim()}`);
      } else {
        console.log('❌ GMAIL_REDIRECT_URI is set but does not contain port 8080');
        console.log(`   Current value: ${redirectUriValue.trim()}`);
        console.log('   Run: supabase secrets set GMAIL_REDIRECT_URI=http://localhost:8080/auth/callback/gmail');
      }
    } catch (error) {
      console.log('❌ GMAIL_REDIRECT_URI not found in environment variables');
      console.log('   Run: supabase secrets set GMAIL_REDIRECT_URI=http://localhost:8080/auth/callback/gmail');
    }
    
    // Check other required environment variables
    console.log('\nChecking other required environment variables:');
    const requiredVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
    
    for (const varName of requiredVars) {
      try {
        const value = execSync(`supabase secrets list | grep ${varName}`).toString();
        if (value) {
          console.log(`✅ ${varName} is set`);
        }
      } catch (error) {
        console.log(`❌ ${varName} not found`);
        console.log(`   Run: supabase secrets set ${varName}=your-value-here`);
      }
    }
    
    console.log('\n📋 Google OAuth Configuration Checklist:');
    console.log('1. Ensure these redirect URIs are in Google Cloud Console:');
    console.log('   - http://localhost:8080/auth/callback/gmail');
    console.log('   - http://localhost:8080/auth-callback.html');
    console.log('2. Check that all required scopes are allowed in your OAuth consent screen');
    console.log('3. Make sure the app is properly configured (check both client ID and secret)');
    
  } catch (error) {
    console.error('Error checking environment:', error);
  }
}

checkGmailEnv(); 