// Reset Gmail Integration State

console.log(`
=======================================================
         GMAIL INTEGRATION RESET INSTRUCTIONS
=======================================================

The Gmail integration is showing inconsistent state between
your browser's localStorage and the database.

Follow these steps to completely reset the state:

1. CLEAR BROWSER LOCAL STORAGE:
   - Open your browser's Developer Tools (F12)
   - Go to "Application" > "Local Storage"
   - Find and delete the "gmail_integration" item

2. CLEAR SUPABASE DATABASE ENTRY:
   - Run this SQL in the Supabase SQL Editor:
   
   DELETE FROM user_integrations 
   WHERE provider = 'gmail';

3. RESTART THE APPLICATION:
   - Restart your development server (npm run dev)
   - Reload the browser page

4. RECONNECT GMAIL:
   - Go to the Integrations page
   - Use the Debug panel to verify clean state
   - Try connecting Gmail again

=======================================================
`);

// Instructions for running in browser console to clear localStorage
console.log(`
FOR CLEARING LOCALSTORAGE DIRECTLY FROM CONSOLE:

// Paste this into your browser console:
localStorage.removeItem('gmail_integration');
console.log('Gmail integration data cleared from localStorage');
`); 