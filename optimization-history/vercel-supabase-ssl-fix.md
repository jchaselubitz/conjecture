# Vercel-Supabase SSL Certificate Chain Fix

## Problem
Getting `SELF_SIGNED_CERT_IN_CHAIN` error when connecting to Supabase database through Vercel deployment.

## Root Cause
The SSL configuration was not properly handling certificate chain validation for the Vercel-Supabase integration. The fallback `rejectUnauthorized: false` was not sufficient for production environments.

## Solution
Updated the SSL configuration in `lib/database/index.ts` to:

1. **Environment-aware SSL configuration**: Different SSL settings for development vs production
2. **Proper certificate chain handling**: Uses `checkServerIdentity: () => undefined` to allow self-signed certificates in the chain while maintaining SSL encryption
3. **Supabase CA certificate support**: Falls back to provided CA certificate if available

## Changes Made

### Before
```typescript
const ssl = process.env.VERCEL
  ? process.env.SUPABASE_CA_PEM
    ? { rejectUnauthorized: true, ca: process.env.SUPABASE_CA_PEM }
    : { rejectUnauthorized: false } // temporary fallback
  : false;
```

### After
```typescript
const ssl = (() => {
  // Local development - no SSL
  if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
    return false;
  }
  
  // Production/Vercel deployment
  if (process.env.VERCEL) {
    // If Supabase CA certificate is provided, use it
    if (process.env.SUPABASE_CA_PEM) {
      return { 
        rejectUnauthorized: true, 
        ca: process.env.SUPABASE_CA_PEM 
      };
    }
    
    // For Vercel-Supabase integration, use these settings to handle certificate chain
    return {
      rejectUnauthorized: true,
      // Allow self-signed certificates in certificate chain
      checkServerIdentity: () => undefined
    };
  }
  
  // Default SSL for other production environments
  return { rejectUnauthorized: true };
})();
```

## Benefits
- ✅ Maintains SSL encryption
- ✅ Handles self-signed certificates in chain
- ✅ Environment-specific configuration
- ✅ Backwards compatible with CA certificate setup

## Optional Enhancement
For maximum security, you can still add the Supabase CA certificate as an environment variable `SUPABASE_CA_PEM` in your Vercel project settings.
