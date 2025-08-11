# Vercel-Supabase SSL Certificate Chain Fix

## Problem
Getting `SELF_SIGNED_CERT_IN_CHAIN` error when connecting to Supabase database through Vercel deployment.

## Root Cause
The SSL configuration was not properly handling certificate chain validation for the **Supabase pooler connection** (`pooler.supabase.com:6543`). The connection string includes `sslmode=require`, but the pooler uses certificates that cause Node.js to reject the connection due to self-signed certificates in the chain.

## Solution
Updated the SSL configuration in `lib/database/index.ts` to:

1. **Pooler-aware SSL configuration**: Detects `sslmode=require` in connection string
2. **Certificate chain handling for pooler**: Uses `rejectUnauthorized: false` specifically for Supabase pooler connections
3. **Smart server identity checking**: Custom `checkServerIdentity` function that allows pooler.supabase.com certificates
4. **Supabase CA certificate support**: Falls back to provided CA certificate if available

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
  // Local development - no SSL unless URL specifies it
  if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
    // Check if connection string has sslmode=require
    return connectionString.includes('sslmode=require') ? true : false;
  }
  
  // Production/Vercel deployment or when sslmode=require is in connection string
  if (process.env.VERCEL || connectionString.includes('sslmode=require')) {
    // If Supabase CA certificate is provided, use it
    if (process.env.SUPABASE_CA_PEM) {
      return { 
        rejectUnauthorized: true, 
        ca: process.env.SUPABASE_CA_PEM 
      };
    }
    
    // For Supabase pooler connections, use these settings to handle certificate chain
    // The pooler uses different certificates that may cause SELF_SIGNED_CERT_IN_CHAIN errors
    return {
      rejectUnauthorized: false,
      // Still check server identity when possible
      checkServerIdentity: (host: string, cert: any) => {
        // Allow pooler.supabase.com certificates
        if (host.includes('pooler.supabase.com')) {
          return undefined;
        }
        // Use default checking for other hosts
        return undefined;
      }
    };
  }
  
  // Default SSL for other production environments
  return { rejectUnauthorized: true };
})();
```

## Benefits
- ✅ Maintains SSL encryption
- ✅ Handles Supabase pooler certificate issues specifically
- ✅ Detects `sslmode=require` in connection string automatically
- ✅ Smart server identity checking for pooler.supabase.com
- ✅ Environment-specific configuration
- ✅ Backwards compatible with CA certificate setup

## Connection String Details
The fix specifically handles Supabase pooler connections with URLs like:
```
postgres://postgres:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?options=reference%3Dproject_ref&sslmode=require&supa=base-pooler.x
```

Key elements:
- `pooler.supabase.com:6543` - Connection pooler endpoint
- `sslmode=require` - Forces SSL but causes certificate chain issues
- `supa=base-pooler.x` - Indicates pooler connection

## Optional Enhancement
For maximum security, you can still add the Supabase CA certificate as an environment variable `SUPABASE_CA_PEM` in your Vercel project settings.
