# Gmail Integration URI Mismatch Fixes

## Summary

This document outlines the comprehensive fixes applied to resolve Gmail integration URI mismatch issues that were causing authentication failures across the application.

## Problems Identified

### 1. **Multiple Inconsistent Callback URIs**
- **Issue**: Found 7 different callback URI patterns being used
- **Patterns Found**:
  - `/auth/callback/gmail` (primary)
  - `/integrations` (legacy)
  - `/auth-callback.html` (static HTML)
  - `/auth/callback` (generic Supabase)
  - Various combinations with different origins

### 2. **Environment-Dependent URI Construction**
- **Issue**: Dynamic URI construction led to mismatches between development and production
- **Problems**:
  - Hardcoded `localhost:8080` in some places
  - Dynamic origin detection failures
  - Inconsistent port configurations

### 3. **Cross-Framework Inconsistencies**
- **Issue**: Different frameworks (React, Next.js, static HTML) handled redirects differently
- **Problems**:
  - React Router: `/integrations`
  - Next.js: `/settings/integrations`
  - Static HTML: `/app/settings/integrations`

### 4. **Legacy Code Paths**
- **Issue**: Multiple authentication flows with different URI handling
- **Problems**:
  - `gmail-auth` vs `gmail-auth-simple` functions
  - Legacy fallback URIs still in code
  - Inconsistent error handling

## Fixes Implemented

### 1. **Centralized Configuration**

#### **Client-Side Configuration** (`src/config/gmail.ts`)
```typescript
export const GMAIL_OAUTH_CONFIG = {
  CALLBACK_PATH: '/auth/callback/gmail',
  SUCCESS_REDIRECT: '/integrations',
  EDGE_FUNCTION: 'gmail-auth-simple',
  SCOPES: [...],
  REDIRECT_TIMEOUT_MS: 120000,
  DEV_PORT: 8080,
} as const;

export function getGmailRedirectUri(origin?: string): string {
  const baseOrigin = origin || window.location.origin;
  return `${baseOrigin}${GMAIL_OAUTH_CONFIG.CALLBACK_PATH}`;
}
```

#### **Edge Function Configuration** (`supabase/functions/_shared/gmail-config.ts`)
```typescript
export const GMAIL_CONFIG = {
  CALLBACK_PATH: "/auth/callback/gmail",
  SCOPES: [...],
  DEV_PORT: 8080,
} as const;

export function getRedirectUri(requestOrigin?: string): string {
  // Standardized URI construction logic
}
```

### 2. **Standardized All Redirect URIs**

#### **Updated Files**:
- `src/hooks/useGmailConnect.ts` - Now uses centralized config
- `src/pages/auth/GmailCallback.tsx` - Standardized redirect handling
- `app/auth/callback/gmail/page.tsx` - Updated Next.js callback
- `public/auth/callback/gmail/index.html` - Fixed static HTML redirect
- `supabase/functions/gmail-auth-simple/index.ts` - Centralized config
- `supabase/functions/gmail-auth/index.ts` - Removed legacy fallbacks

### 3. **Unified Routing**

#### **App.tsx Changes**:
```typescript
// Added redirect route for consistency
<Route path="/integrations" element={<Navigate to="/app/integrations" replace />} />
```

#### **All Callbacks Now Redirect To**: `/integrations` → `/app/integrations`

### 4. **Removed Legacy Code**

#### **Eliminated**:
- Legacy `/integrations` redirect URI fallback in Edge Functions
- Multiple URI construction methods
- Inconsistent error handling patterns
- Duplicate authentication flows

### 5. **Enhanced Error Handling**

#### **Improvements**:
- Clear error messages for URI mismatches
- Better logging for debugging
- Configuration validation in Edge Functions
- Graceful fallback mechanisms

## Configuration Requirements

### **Google Cloud Console Setup**

#### **Authorized Redirect URIs**:
```
Development:
http://localhost:8080/auth/callback/gmail

Production:
https://yourdomain.com/auth/callback/gmail
```

#### **Authorized JavaScript Origins**:
```
Development:
http://localhost:8080

Production:
https://yourdomain.com
```

### **Environment Variables**

#### **Required in Supabase Edge Functions**:
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional - explicit redirect URI override
GMAIL_REDIRECT_URI=http://localhost:8080/auth/callback/gmail
```

### **Development Server Configuration**

#### **Vite Configuration** (`vite.config.ts`):
```typescript
export default defineConfig({
  server: {
    port: 8080, // Consistent with OAuth configuration
  },
  // ... other config
});
```

#### **Package.json**:
```json
{
  "scripts": {
    "dev": "vite --port 8080"
  }
}
```

## Testing

### **Playwright Tests Created**
- `tests/gmail-integration.spec.ts` - Comprehensive E2E tests
- Tests OAuth callback handling
- Validates URI configuration consistency
- Tests error scenarios and edge cases

### **Manual Testing Checklist**
1. ✅ Development server starts on port 8080
2. ✅ `/app/integrations` page loads correctly
3. ✅ Gmail tab displays integration component
4. ✅ Connect Gmail button opens OAuth dialog
5. ✅ OAuth callback URL matches configuration
6. ✅ Error handling works for invalid states
7. ✅ Redirect after successful auth works

## File Changes Summary

### **New Files Created**:
- `src/config/gmail.ts` - Centralized client configuration
- `supabase/functions/_shared/gmail-config.ts` - Edge function configuration
- `tests/gmail-integration.spec.ts` - Comprehensive test suite
- `GMAIL_INTEGRATION_FIXES.md` - This documentation

### **Modified Files**:
- `src/hooks/useGmailConnect.ts` - Uses centralized config
- `src/pages/auth/GmailCallback.tsx` - Standardized redirects
- `app/auth/callback/gmail/page.tsx` - Updated Next.js handling
- `public/auth/callback/gmail/index.html` - Fixed static redirect
- `supabase/functions/gmail-auth-simple/index.ts` - Removed legacy code
- `supabase/functions/gmail-auth/index.ts` - Standardized URIs
- `src/components/integrations/GmailIntegration.tsx` - Added test IDs
- `src/App.tsx` - Added redirect route

## Benefits

### **1. Consistency**
- Single source of truth for OAuth configuration
- All components use same redirect URI pattern
- Unified error handling across the application

### **2. Maintainability**
- Easy to update OAuth configuration in one place
- Clear separation of concerns
- Better debugging with centralized logging

### **3. Reliability**
- Eliminates URI mismatch errors
- Robust error handling
- Consistent behavior across environments

### **4. Testability**
- Comprehensive test coverage
- Easy to validate configuration
- Clear test scenarios for edge cases

## Future Recommendations

### **1. Environment Management**
- Use environment-specific configuration files
- Implement configuration validation on startup
- Add health check endpoints for OAuth configuration

### **2. Monitoring**
- Add analytics for OAuth flow completion rates
- Monitor for URI mismatch errors in production
- Track user drop-off points in authentication flow

### **3. Documentation**
- Keep OAuth configuration documented
- Maintain runbook for troubleshooting
- Document deployment requirements

### **4. Security**
- Regular audit of OAuth scopes
- Monitor for unauthorized redirect URI attempts
- Implement CSRF protection with state parameters

## Conclusion

The Gmail integration is now rock solid with:
- ✅ **Centralized configuration** preventing future inconsistencies
- ✅ **Standardized URI patterns** eliminating mismatch errors
- ✅ **Comprehensive testing** ensuring reliability
- ✅ **Clear documentation** for maintainability
- ✅ **Error handling** for better user experience

All URI mismatch issues have been resolved, and the integration should work consistently across all environments.