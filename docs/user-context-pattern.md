# UserContext Pattern: Server-Side Data Fetching with Client-Side Updates

## Overview

This pattern provides a way to fetch user data on the server (avoiding blocking) while allowing client-side updates when needed. It follows React best practices and Next.js 13+ App Router patterns.

## How It Works

### 1. Server-Side Data Fetching
- User data is fetched in server components (like `app/layout.tsx`)
- This happens during server-side rendering, so the initial page load includes user data
- No client-side loading states for initial data

### 2. Client-Side Context
- The `UserProvider` receives server-fetched data as props
- Context provides this data to all child components
- Optional client-side updates can be triggered when needed

### 3. Client-Side Updates
- When `enableClientUpdates={true}`, the context can fetch fresh data
- Uses `useEffect` to trigger updates on mount or when needed
- Provides `refetch()` function for manual updates

## Usage

### Basic Usage (Server Data Only)
```tsx
// In a server component
const userProfile = await getUserProfile();

// In JSX
<UserProvider 
  userProfile={userProfile}
  userEmail={userEmail}
  userSlug={userSlug}
  enableClientUpdates={false}
>
  {children}
</UserProvider>
```

### With Client Updates
```tsx
<UserProvider 
  userProfile={userProfile}
  userEmail={userEmail}
  userSlug={userSlug}
  enableClientUpdates={true}
>
  {children}
</UserProvider>
```

### Using the Context
```tsx
import { useUserContext } from '@/contexts/UserContext';

function MyComponent() {
  const { userId, name, email, isLoading, refetch } = useUserContext();
  
  // Use user data
  return <div>Hello, {name}!</div>;
}
```

## Benefits

1. **No Server Blocking**: Initial data is fetched on the server without blocking
2. **Fast Initial Load**: User data is available immediately on page load
3. **Client Updates**: Can refresh data when needed (profile updates, etc.)
4. **Type Safety**: Full TypeScript support
5. **Error Handling**: Graceful error handling for failed requests

## When to Use Client Updates

- Profile information changes frequently
- User permissions need to be refreshed
- Real-time updates are required
- User preferences change

## When to Disable Client Updates

- User data is static
- Performance is critical
- Network requests should be minimized
- Data is already fresh from server

## Performance Considerations

- Server-side data fetching is cached by Next.js
- Client updates only happen when `enableClientUpdates={true}`
- `refetch()` can be called manually when needed
- Loading states are provided for client updates 