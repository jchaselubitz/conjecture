"use client";

import { VariantProps } from "class-variance-authority";
import { useState } from "react";
import { createDraft } from "@/lib/actions/statementActions";
import { generateStatementId } from "@/lib/helpers/helpersStatements";

import { buttonVariants } from "../ui/button";
import { ButtonLoadingState, LoadingButton } from "../ui/loading-button";
export default function CreatePostButton({
  classNames,
  variant,
  size,
  text,
  loadingText,
  successText,
  errorText,
}: {
  classNames?: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  text: string;
  loadingText: string;
  successText?: string;
  errorText?: string;
}) {
  const [buttonState, setButtonState] = useState<ButtonLoadingState>("default");

  const handleClick = async () => {
    const statementId = generateStatementId();
    setButtonState("loading");
    try {
      await createDraft({
        statementId,
      });
      setButtonState("success");
    } catch (error) {
      console.error(error);
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
