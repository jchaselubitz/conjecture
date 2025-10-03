import { ButtonLoadingState, LoadingButton } from '@/components/ui/loading-button';
import { createClient } from '@/supabase/client';
import { useState } from 'react';
import Image from 'next/image';

export const signInWithGoogle = async ({ redirectTo }: { redirectTo?: string }) => {
  const supabase = createClient();
  const nextPath = redirectTo ?? '/feed';
  const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  const { error, data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      scopes: 'email profile',
      queryParams: {
        prompt: 'consent',
        include_granted_scopes: 'true'
      }
    }
  });

  if (error) {
    // Sentry.captureException(error);
    return (window.location.href = '/login?message=Could not authenticate with Google');
  }
};

export const GoogleButton = ({ redirectTo }: { redirectTo?: string }) => {
  const [buttonState, setButtonState] = useState<ButtonLoadingState>('default');
  return (
    <LoadingButton
      type="button"
      className="w-full"
      onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault(); // if inside a form
        setButtonState('loading');
        try {
          await signInWithGoogle({ redirectTo: redirectTo ?? undefined });
        } catch (e) {
          setButtonState('error');
        }
      }}
      buttonState={buttonState}
      setButtonState={setButtonState}
      text={
        <>
          <Image src="/icons/google.png" alt="Google" width={20} height={20} /> Login with Google
        </>
      }
      loadingText="Redirecting to Google..."
      successText="Redirecting..."
      errorText="Google sign-in failed"
      variant="outline"
    />
  );
};
