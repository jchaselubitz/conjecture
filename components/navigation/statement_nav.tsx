"use client";

import { Settings } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ButtonLoadingState,
  LoadingButton,
} from "@/components/ui/loading-button";
import { useStatementContext } from "@/contexts/statementContext";

import { Button } from "../ui/button";

export default function StatementNav() {
  const {
    statement,
    saveStatementDraft,
    updateStatementDraft,
    togglePublish,
    newStatement,
  } = useStatementContext();
  const [saveButtonState, setSaveButtonState] =
    useState<ButtonLoadingState>("default");
  const [updateButtonState, setUpdateButtonState] =
    useState<ButtonLoadingState>("default");
  const [publishButtonState, setPublishButtonState] =
    useState<ButtonLoadingState>("default");

  const router = useRouter();

  const handleUpdate = async () => {
    if (!statement) return;

    try {
      setUpdateButtonState("loading");
      await updateStatementDraft();
      setUpdateButtonState("success");
    } catch (error) {
      console.error(error);
      setUpdateButtonState("error");
    }
  };

  const handleSaveDraft = async () => {
    if (!newStatement?.content) return;

    setSaveButtonState("loading");

    try {
      await saveStatementDraft();
      setSaveButtonState("success");
    } catch (error) {
      console.error(error);
      setSaveButtonState("error");
    }
  };

  const handlePublish = async () => {
    if (!statement) return;
    try {
      setPublishButtonState("loading");
      await togglePublish();
      setPublishButtonState("success");
    } catch (error) {
      console.error(error);
      setPublishButtonState("error");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          {newStatement && (
            <LoadingButton
              variant="outline"
              onClick={handleSaveDraft}
              buttonState={saveButtonState}
              text={statement ? "Save new draft" : "Save draft"}
              loadingText="Saving..."
              successText="Saved"
              errorText="Failed to save"
            />
          )}
          {statement && (
            <>
              <LoadingButton
                variant="outline"
                onClick={handleUpdate}
                buttonState={updateButtonState}
                text="Update"
                loadingText="Updating..."
                successText="Updated"
                errorText="Failed to update"
              />

              <LoadingButton
                onClick={handlePublish}
                buttonState={publishButtonState}
                text={statement.isPublished ? "Unpublish" : "Publish"}
                loadingText={
                  statement.isPublished ? "Hiding..." : "Publishing..."
                }
                successText={statement.isPublished ? "Hidden" : "Published"}
                errorText="Failed to publish"
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
