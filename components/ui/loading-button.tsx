import { type VariantProps } from 'class-variance-authority';
import { Check, Loader2Icon } from 'lucide-react';
import * as React from 'react';

import { Button, buttonVariants } from './button';

export type ButtonLoadingState = 'default' | 'disabled' | 'loading' | 'success' | 'error';
export interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  buttonState: ButtonLoadingState;
  text: string | React.ReactNode;
  loadingText?: string | React.ReactNode;
  successText?: string | React.ReactNode;
  errorText?: string;
  reset?: boolean;
  setButtonState?: (state: ButtonLoadingState) => void;
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild,
      text,
      loadingText,
      successText,
      errorText,
      buttonState = 'default',
      reset = false,
      setButtonState,
      ...props
    },
    ref
  ) => {
    if (reset && !setButtonState) {
      throw new Error('setButtonState must be provided when reset is true');
    }

    const isString = (value: any): value is string => {
      return typeof value === 'string';
    };

    React.useEffect(() => {
      if (reset && setButtonState && buttonState === 'success') {
        const timeout = setTimeout(() => {
          if (buttonState === 'success') {
            setButtonState('default');
          }
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }, [buttonState, reset, setButtonState]);

    return (
      <Button
        disabled={buttonState === 'loading' || buttonState === 'disabled'}
        variant={variant}
        size={size}
        className={className}
        ref={ref}
        asChild={asChild}
        {...props}
      >
        {buttonState === 'loading' ? (
          <span className="flex gap-2 items-center">
            {(isString(loadingText) || !loadingText) && (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            )}
            {loadingText}
          </span>
        ) : buttonState === 'success' ? (
          <span className="flex gap-2 justify-between items-center">
            {successText}
            {(isString(successText) || !successText) && <Check className="ml-2 h-4 w-4" />}
          </span>
        ) : buttonState === 'error' ? (
          <span className="flex gap-2 items-center">{errorText}</span>
        ) : (
          text
        )}{' '}
      </Button>
    );
  }
);
LoadingButton.displayName = 'LoadingButton';

export { LoadingButton };
