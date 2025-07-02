'use client';

import { VariantProps } from 'class-variance-authority';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useUserContext } from '@/contexts/userContext';
import { createStatement } from '@/lib/actions/statementActions';

import { buttonVariants } from '../ui/button';
import { ButtonLoadingState, LoadingButton } from '../ui/loading-button';
export default function CreatePostButton({
  classNames,
  variant,
  size,
  text,
  loadingText,
  successText,
  errorText
}: {
  classNames?: string;
  variant?: VariantProps<typeof buttonVariants>['variant'];
  size?: VariantProps<typeof buttonVariants>['size'];
  text: string;
  loadingText: string;
  successText?: string;
  errorText?: string;
}) {
  const [buttonState, setButtonState] = useState<ButtonLoadingState>('default');
  const { currentUserSlug, userId } = useUserContext();
  const router = useRouter();
  const handleClick = async () => {
    setButtonState('loading');
    try {
      if (!currentUserSlug || !userId) {
        throw new Error('User not found');
      }
      const result = await createStatement({
        creatorSlug: currentUserSlug,
        creatorId: userId
      });
      if (result?.url) {
        router.push(result.url);
        return;
      }
      setButtonState('success');
    } catch (error) {
      console.error(error);
      setButtonState('error');
    }
  };
  return (
    <LoadingButton
      onClick={handleClick}
      buttonState={buttonState}
      text={text}
      loadingText={loadingText}
      successText={successText}
      errorText={errorText}
      className={classNames}
      variant={variant}
      size={size}
    />
  );
}
