'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { confirmEmailUpdate } from '@/lib/actions/userActions';
import { getUser } from '@/lib/actions/baseActions';

export default function ConfirmedEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'success' | 'first_confirmation' | 'error'>(
    'pending'
  );

  useEffect(() => {
    (async () => {
      try {
        const user = await getUser();
        const newEmail = user?.new_email;
        console.log(newEmail);
        if (newEmail) {
          setStatus('first_confirmation');
          return;
        }
        const result = await confirmEmailUpdate();
        if (result) {
          setStatus('success');
          setTimeout(() => {
            router.push('/feed');
          }, 2000);
        } else {
          setStatus('error');
        }
      } catch {
        setStatus('error');
      }
    })();
  }, [router]);

  return (
    <div className="flex items-center justify-center w-screen h-screen">
      <div className="flex flex-col items-center w-80 md:w-96 text-center p-6 rounded-lg bg-zinc-100 shadow">
        {status === 'pending' && (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500 mb-4" />
            <h1 className="text-lg font-semibold mb-2">Confirming your email…</h1>
            <p className="mb-2">
              Please wait while we confirm your email address. You will be redirected shortly.
            </p>
            <p className="text-xs text-zinc-500">
              If you are not redirected, click the button below.
            </p>
            <button
              className="mt-4 px-4 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700"
              onClick={() => router.push('/feed')}
            >
              Go to Feed
            </button>
          </>
        )}
        {status === 'first_confirmation' && (
          <>
            <h1 className="text-lg font-semibold mb-2">Awaiting second confirmation</h1>
            <p className="mb-2">
              Please click the link in the other email to confirm your email change.
            </p>
          </>
        )}
        {status === 'success' && (
          <>
            <h1 className="text-lg font-semibold mb-2">Email confirmed!</h1>
            <p className="mb-2">You are being redirected to your feed.</p>
            <button
              className="mt-4 px-4 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700"
              onClick={() => router.push('/feed')}
            >
              Go to Feed
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-lg font-semibold mb-2 text-red-600">Something went wrong</h1>
            <p className="mb-2">
              We could not confirm your email. Please try again or contact support.
            </p>
            <button
              className="mt-4 px-4 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700"
              onClick={() => router.push('/feed')}
            >
              Go to Feed
            </button>
          </>
        )}
      </div>
    </div>
  );
}
