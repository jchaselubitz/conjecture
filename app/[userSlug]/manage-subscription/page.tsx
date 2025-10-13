'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type ButtonLoadingState, LoadingButton } from '@/components/ui/loading-button';
import { useUserContext } from '@/contexts/userContext';
import {
  isSubscribed as checkIsSubscribed,
  subscribe,
  unsubscribe
} from '@/lib/actions/notificationActions';
import { getUserByEmail, getUserProfile } from '@/lib/actions/userActions';

export default function UnsubscribePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const userSlug = params.userSlug as string;
  const subscriberEmailFromParams = searchParams.get('email');
  const { email } = useUserContext();

  const [emailInput, setEmailInput] = useState<string>('');
  const [unsubscribeButtonState, setUnsubscribeButtonState] =
    useState<ButtonLoadingState>('default');
  const [subscribeButtonState, setSubscribeButtonState] = useState<ButtonLoadingState>('default');
  const [checkEmailButtonState, setCheckEmailButtonState] = useState<ButtonLoadingState>('default');
  const [authorName, setAuthorName] = useState<string>('');
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');
  const [hasCheckedEmail, setHasCheckedEmail] = useState<boolean>(false);

  // Pre-populate email input with available email
  useEffect(() => {
    const availableEmail = subscriberEmailFromParams ?? email;
    if (availableEmail && !emailInput) {
      setEmailInput(availableEmail);
      setHasCheckedEmail(true);
    }
  }, [subscriberEmailFromParams, email, emailInput]);

  // Use the email input as the source of truth
  const subscriberEmail = hasCheckedEmail ? emailInput : null;

  useEffect(() => {
    const loadAuthorData = async () => {
      try {
        // Always load author info from userSlug
        const author = await getUserProfile(userSlug);
        if (!author) {
          setError('Author not found');
          return;
        }
        setAuthorName(author.name || author.username || 'Unknown');
      } catch (err) {
        setError('Failed to load author information');
      }
    };

    loadAuthorData();
  }, [userSlug]);

  useEffect(() => {
    if (!subscriberEmail) {
      return;
    }

    const loadSubscriptionData = async () => {
      try {
        // Get subscriber info from email
        const subscriber = await getUserByEmail(subscriberEmail);
        if (!subscriber) {
          setError('Subscriber not found');
          return;
        }

        // Get author info again
        const author = await getUserProfile(userSlug);
        if (!author) {
          setError('Author not found');
          return;
        }

        // Check if currently subscribed
        const subscribed = await checkIsSubscribed(author.id, subscriber.id);
        setIsSubscribed(subscribed);
        setError(''); // Clear any previous errors
      } catch (err) {
        setError('Failed to load subscription information');
      }
    };

    loadSubscriptionData();
  }, [subscriberEmail, userSlug]);

  const handleUnsubscribe = async () => {
    if (!subscriberEmail) return;

    setUnsubscribeButtonState('loading');
    try {
      const author = await getUserProfile(userSlug);
      const subscriber = await getUserByEmail(subscriberEmail);

      if (!author || !subscriber) {
        throw new Error('User information not found');
      }

      await unsubscribe(author.id, subscriber.id);
      setIsSubscribed(false);
      setUnsubscribeButtonState('success');
      toast('Successfully unsubscribed from ' + authorName);
    } catch (err) {
      setUnsubscribeButtonState('error');
      toast('Failed to unsubscribe. Please try again.');
    }
  };

  const handleSubscribe = async () => {
    if (!subscriberEmail) return;

    setSubscribeButtonState('loading');
    try {
      const author = await getUserProfile(userSlug);
      const subscriber = await getUserByEmail(subscriberEmail);

      if (!author || !subscriber) {
        throw new Error('User information not found');
      }

      await subscribe(author.id, subscriber.id, subscriberEmail);
      setIsSubscribed(true);
      setSubscribeButtonState('success');
      toast('Successfully subscribed to ' + authorName);
    } catch (err) {
      setSubscribeButtonState('error');
      toast('Failed to subscribe. Please try again.');
    }
  };

  const handleCheckEmail = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setCheckEmailButtonState('loading');
    setError('');
    try {
      // Get subscriber info from email
      const subscriber = await getUserByEmail(emailInput);
      if (!subscriber) {
        setError('No account found with this email address');
        setCheckEmailButtonState('error');
        return;
      }

      // Get author info
      const author = await getUserProfile(userSlug);
      if (!author) {
        setError('Author not found');
        setCheckEmailButtonState('error');
        return;
      }

      // Check if currently subscribed
      const subscribed = await checkIsSubscribed(author.id, subscriber.id);
      setIsSubscribed(subscribed);
      setHasCheckedEmail(true);
      setCheckEmailButtonState('success');
    } catch (err) {
      setError('Failed to check subscription status');
      setCheckEmailButtonState('error');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-base text-muted-foreground leading-relaxed">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-2xl">Newsletter Subscription</CardTitle>
          <CardDescription className="text-base mt-2">
            {authorName ? `Manage your subscription to ${authorName}'s newsletter` : 'Loading...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Always show email input */}
          <div className="space-y-3">
            <Label htmlFor="email" className="text-base font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={emailInput}
              onChange={e => {
                setEmailInput(e.target.value);
                setHasCheckedEmail(false);
                setIsSubscribed(null);
                setError('');
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleCheckEmail();
                }
              }}
              className="text-base py-3"
            />
          </div>

          {!hasCheckedEmail && emailInput && (
            <LoadingButton
              className="w-full text-base py-3 h-12"
              buttonState={checkEmailButtonState}
              setButtonState={setCheckEmailButtonState}
              text="Check Subscription Status"
              loadingText="Checking..."
              successText="Found"
              errorText="Try Again"
              reset={true}
              onClick={handleCheckEmail}
              disabled={!emailInput}
            />
          )}

          {/* Show subscription management when email has been checked */}
          {subscriberEmail && (
            <div className="space-y-4">
              {isSubscribed === true && (
                <div className="space-y-4">
                  <p className="text-lg leading-relaxed">
                    {`You are currently subscribed to ${authorName}'s newsletter.`}
                  </p>
                  <LoadingButton
                    className="w-full text-base py-3 h-12"
                    variant="destructive"
                    buttonState={unsubscribeButtonState}
                    setButtonState={setUnsubscribeButtonState}
                    text="Unsubscribe"
                    loadingText="Unsubscribing..."
                    successText="Unsubscribed"
                    errorText="Failed to unsubscribe"
                    reset={true}
                    onClick={handleUnsubscribe}
                  />
                </div>
              )}

              {isSubscribed === false && (
                <div className="space-y-4">
                  <p className="text-lg leading-relaxed">
                    {`You are not currently subscribed to ${authorName}'s newsletter.`}
                  </p>
                  <LoadingButton
                    className="w-full text-base py-3 h-12"
                    buttonState={subscribeButtonState}
                    setButtonState={setSubscribeButtonState}
                    text="Subscribe"
                    loadingText="Subscribing..."
                    successText="Subscribed"
                    errorText="Failed to subscribe"
                    reset={true}
                    onClick={handleSubscribe}
                  />
                </div>
              )}

              {isSubscribed === null && subscriberEmail && (
                <div className="space-y-4">
                  <p className="text-base text-muted-foreground">Loading subscription status...</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
