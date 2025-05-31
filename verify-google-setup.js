#!/usr/bin/env node

console.log('Gmail Integration Verification Script');
console.log('====================================');
console.log('');

console.log('1. VERIFY THESE REDIRECT URIS ARE IN GOOGLE CLOUD CONSOLE:');
console.log('   - http://localhost:8080/auth/callback/gmail');
console.log('   - http://localhost:8080/auth-callback.html');
console.log('');

console.log('2. VERIFY ENVIRONMENT VARIABLES:');
console.log('   The following environment variables should be set in your Supabase project:');
console.log('   - GOOGLE_CLIENT_ID');
console.log('   - GOOGLE_CLIENT_SECRET');
console.log('   - GMAIL_REDIRECT_URI (set to http://localhost:8080/auth/callback/gmail)');
console.log('');

console.log('3. STEPS TO FIX THE 500 ERROR:');
console.log('   1. Make sure you\'ve added http://localhost:8080/auth/callback/gmail to Google Cloud Console');
console.log('   2. Verify your OAuth consent screen is properly configured');
console.log('   3. Make sure you\'re running your app on port 8080');
console.log('      - Use "npm run dev -- --port 8080" if needed');
console.log('');

console.log('4. TO VERIFY THE CHANGES:');
console.log('   1. Restart your app running on port 8080');
console.log('   2. Go to Settings > Integrations');
console.log('   3. Try connecting Gmail again');
console.log('');

console.log('If you still see the 500 error, check the Edge Function logs in the Supabase dashboard');
console.log('for more detailed error messages.');
console.log('');

// Log Google Cloud Console direct link
console.log('QUICK LINKS:');
console.log('Google Cloud Console OAuth Credentials: https://console.cloud.google.com/apis/credentials');
console.log('Supabase Dashboard: https://app.supabase.com/project/bujaaqjxrvntcneoarkj/functions'); 