// This is a test file to validate the Supabase key

// Test both the anon key and service_role key
// Sometimes what's labeled as "anon key" in the Supabase dashboard is actually the service_role key
export const keys = {
  // Current anon key we're using
  current: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTA5ODY1NjcsImV4cCI6MjAyNjU2MjU2N30.jRxHhvMxDLR3k0Ol7nBREyQEKFzfDu7HpzXWbWvpJ1Q',
  
  // Try another format/version of anon key
  alternateAnon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTEzNzY0NzYsImV4cCI6MjAyNjk1MjQ3Nn0.dR8sLLZhFrj75a3T0GrdLsHK2uh6D1nMpAkBRQpgGl0',
  
  // Try using service_role key (if that's what you actually have)
  // WARNING: Only use this for testing, never in production client-side code
  serviceRole: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMTM3NjQ3NiwiZXhwIjoyMDI2OTUyNDc2fQ.pZvYGMhDK0E-OZMJKQ0fSZd1P2q_vVRtJQKF_3W5U8Y',
  
  // A newly generated JWT with same structure but different signature
  // This is an example only and won't work
  newlyGenerated: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amFhcWp4cnZudGNuZW9hcmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTEzNzYwMDAsImV4cCI6MjAyNjk1MjAwMH0.kDvSWh7hhcHlwQq0tJzAGkO3Ddsfj8AaJJX3GH3Oxyg'
}; 