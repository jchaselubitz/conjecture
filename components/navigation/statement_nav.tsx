"use client";

import { Settings } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  ButtonLoadingState,
  LoadingButton,
} from "@/components/ui/loading-button";
import { useStatementContext } from "@/contexts/statementContext";

import { Button } from "../ui/button";

export default function StatementNav() {
  const { statement, saveStatementDraft, updateStatementDraft, togglePublish } =
    useStatementContext();
  const [buttonState, setButtonState] = useState<ButtonLoadingState>("default");

  const handleUpdate = async () => {
    if (!statement) return;

    try {
      setButtonState("loading");
      await updateStatementDraft();
      setButtonState("success");
    } catch (error) {
      console.error(error);
      setButtonState("error");
    }
  };

  const handleSaveDraft = async () => {
    await saveStatementDraft();
  };

  const handlePublish = async () => {
    if (!statement) return;
    await togglePublish();
  };

  return (
    <header className="fixed top-0 left-0 right-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <LoadingButton
            onClick={handleSaveDraft}
            buttonState={buttonState}
            text={statement ? "Save new draft" : "Save draft"}
            loadingText="Saving..."
            successText="Saved"
            errorText="Failed to save"
          />
          {statement && (
            <>
              <LoadingButton
                onClick={handleUpdate}
                buttonState={buttonState}
                text="Update"
                loadingText="Updating..."
                successText="Updated"
                errorText="Failed to update"
              />
              <LoadingButton
                onClick={handlePublish}
                buttonState={buttonState}
                text="Publish"
                loadingText="Publishing..."
                successText="Published"
                errorText="Failed to publish"
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
