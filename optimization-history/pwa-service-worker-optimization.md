# PWA Service Worker Optimization

## Issue
Lighthouse was reporting: "Does not register a service worker that controls page and start_url"

## Root Cause Analysis
1. **Missing manifest.json in public directory**: The manifest.json was located in `app/` but needed to be in `public/` for Next.js to serve it properly
2. **Service worker not being generated**: The next-pwa configuration was correct but the service worker files weren't being generated
3. **Missing service worker registration**: No explicit service worker registration was happening

## Changes Made

### 1. Moved manifest.json to public directory
```bash
cp app/manifest.json public/manifest.json
```

### 2. Added manifest link to layout.tsx
```tsx
<link rel="manifest" href="/manifest.json" />
```

### 3. Created basic service worker file
Created `app/sw.js` with basic service worker functionality that will be enhanced by next-pwa.

### 4. Updated PWA configuration in next.config.ts
- Changed `skipWaiting: false` to `skipWaiting: true`
- Added `sw: "/sw.js"` to specify the service worker file
- Kept runtime caching configuration for offline functionality

### 5. Added service worker registration script
Added inline script to layout.tsx to ensure service worker registration:
```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
              console.log('SW registered: ', registration);
            })
            .catch(function(registrationError) {
              console.log('SW registration failed: ', registrationError);
            });
        });
      }
    `,
  }}
/>
```

## Expected Results
- Lighthouse should no longer report the service worker error
- PWA functionality should work properly in production
- Offline caching should be available
- App should be installable on mobile devices

## Next Steps
1. Build and deploy the application
2. Test PWA functionality in production
3. Verify Lighthouse scores improve
4. Test offline functionality 