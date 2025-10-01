'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { redirect, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FieldErrors, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ButtonLoadingState, LoadingButton } from '@/components/ui/loading-button';
import { checkUsername, signIn, signUp } from '@/lib/actions/userActions';
import { cn } from '@/lib/utils';

import { FormField } from '../ui/form';
import { Separator } from '../ui/separator';
import { createClient } from '@/supabase/client';

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
    console.log('error', error);
    // Sentry.captureException(error);
    return (window.location.href = '/login?message=Could not authenticate with Google');
  }
};

export function LoginForm({
  className,
  isSignUp,
  message,
  ...props
}: React.ComponentPropsWithoutRef<'div'> & {
  isSignUp?: boolean;
  token?: string;
  inviteEmail?: string;
  message?: string;
}) {
  const [buttonState, setButtonState] = useState<ButtonLoadingState>('default');

  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  const zObject = {
    email: z.string().email(),
    password: z.string().min(8)
  } as { [key: string]: any };

  if (isSignUp) {
    zObject['username'] = z.string().min(1);
  }

  const loginSchema = z.object(zObject);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      ...(isSignUp && { username: '' })
    }
  });

  const [errors, setErrors] = useState<FieldErrors<{ [x: string]: any }> | null>(null);
  useEffect(() => {
    if (form.formState.errors) {
      setErrors(form.formState.errors);
    }
  }, [form.formState.errors]);

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setButtonState('loading');
    try {
      if (isSignUp) {
        const usernameAvailable = await checkUsername(data.username);
        if (!usernameAvailable) {
          form.setError('username', {
            message: 'Username is already taken'
          });
          setButtonState('default');
          return;
        }

        await signUp({
          email: data.email,
          password: data.password,
          username: data.username,
          token: null,
          redirectTo: redirectTo ?? undefined
        });
      } else {
        await signIn({
          email: data.email,
          password: data.password,
          redirectTo: redirectTo ?? undefined
        });
      }
      setButtonState('success');
    } catch (error) {
      console.error(error);
      setButtonState('error');
    } finally {
      setButtonState('default');
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{isSignUp ? 'Sign Up' : 'Login'}</CardTitle>
          <CardDescription>
            Choose a method below to {isSignUp ? 'sign up' : 'login'} to your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <LoadingButton
            type="button"
            className="w-full"
            onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault(); // if inside a form
              setButtonState('loading');
              try {
                await signInWithGoogle({ redirectTo: redirectTo ?? undefined });
                setButtonState('success');
              } catch (e) {
                setButtonState('error');
              } finally {
                setButtonState('default');
              }
            }}
            buttonState={buttonState}
            setButtonState={setButtonState}
            text="Continue with Google"
            loadingText="Redirecting to Google..."
            successText="Redirecting..."
            errorText="Google sign-in failed"
            variant="outline"
          />
          <div className="my-8 flex items-center gap-2">
            <Separator className="flex-1" />
            <div className="text-center text-sm">Or</div>
            <Separator className="flex-1" />
          </div>
          <Form {...form}>
            <form className="flex flex-col gap-4">
              {isSignUp && (
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <div className="grid gap-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" {...field} placeholder="Bobby" />
                      {errors?.username && (
                        <div className="text-red-500">{errors.username.message as string}</div>
                      )}
                    </div>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input {...field} placeholder="m@example.com" type="email" />
                    {errors?.email && (
                      <div className="text-red-500">{errors.email.message as string}</div>
                    )}
                  </div>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input {...field} placeholder="********" type="password" />
                    {errors?.password && (
                      <div className="text-red-500">{errors.password.message as string}</div>
                    )}
                  </div>
                )}
              />
              {/* error message */}

              <LoadingButton
                type="submit"
                className="w-full"
                onClick={form.handleSubmit(onSubmit)}
                buttonState={buttonState}
                setButtonState={setButtonState}
                text={isSignUp ? 'Sign Up' : 'Login'}
                loadingText={isSignUp ? 'Signing up...' : 'Logging in...'}
                successText={isSignUp ? 'Signed up!' : 'Logged in!'}
                errorText={isSignUp ? 'Sign up failed' : 'Login failed'}
              />

              <div className="mt-4 text-center text-sm">
                {isSignUp ? 'Already have an account?' : `Don't have an account?`}{' '}
                <a href={isSignUp ? '/login' : '/sign-up'} className="underline underline-offset-4">
                  {isSignUp ? 'Login' : 'Sign up'}
                </a>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      {message && <div className="mt-4 text-center font-medium text-red-500">{message}</div>}
    </div>
  );
}
