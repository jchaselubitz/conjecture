'use client';

import { Settings } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ButtonLoadingState, LoadingButton } from '@/components/ui/loading-button';
import { useStatementContext } from '@/contexts/statementContext';
import { formatDate } from '@/lib/helpers/helpersDate';

import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
export default function EditNav() {
  const {
    versionOptions,
    statement,
    saveStatementDraft,
    updateStatementDraft,
    togglePublish,
    isUpdating,
    nextVersionNumber,
    changeVersion
  } = useStatementContext();

  const [saveButtonState, setSaveButtonState] = useState<ButtonLoadingState>('default');
  const [updateButtonState, setUpdateButtonState] = useState<ButtonLoadingState>('default');
  const [publishButtonState, setPublishButtonState] = useState<ButtonLoadingState>('default');

  const router = useRouter();

  useEffect(() => {
    if (!isUpdating) {
      setUpdateButtonState('default');
    } else {
      setUpdateButtonState('loading');
    }
  }, [isUpdating]);

  const handleUpdate = async () => {
    try {
      setUpdateButtonState('loading');
      await updateStatementDraft(statement);
      setUpdateButtonState('success');
    } catch (error) {
      console.error(error);
      setUpdateButtonState('error');
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSaveButtonState('loading');
      await saveStatementDraft();
      setSaveButtonState('success');
    } catch (error) {
      console.error(error);
      setSaveButtonState('error');
    }
  };

  const handlePublish = async () => {
    try {
      setPublishButtonState('loading');
      await togglePublish();
      setPublishButtonState('success');
    } catch (error) {
      console.error(error);
      setPublishButtonState('error');
    }
  };

  return (
    <header className="h-16">
      <div className="fixed z-50 top-0 left-0 right-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/statements/${statement?.statementId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Select
              value={statement?.versionNumber.toString()}
              onValueChange={(value) => changeVersion(parseInt(value, 10))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a version" />
              </SelectTrigger>
              <SelectContent>
                {versionOptions.map((v) => (
                  <SelectItem key={v.versionNumber} value={v.versionNumber}>
                    v{v.versionNumber} -{' '}
                    <span className="text-sm text-zinc-500">
                      {formatDate({ date: v.createdAt })}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {statement && (
              <LoadingButton
                variant="outline"
                onClick={handleSaveDraft}
                buttonState={saveButtonState}
                text={`Start v${nextVersionNumber}`}
                loadingText="Saving..."
                successText="Saved"
                setButtonState={setSaveButtonState}
                reset
                errorText="Failed to save"
              />
            )}
            {statement && (
              <>
                <LoadingButton
                  variant="outline"
                  onClick={handleUpdate}
                  buttonState={updateButtonState}
                  text={`Update v${statement.versionNumber}`}
                  loadingText="Updating..."
                  successText="Updated"
                  setButtonState={setUpdateButtonState}
                  reset
                  errorText="Failed to update"
                />

                <LoadingButton
                  onClick={handlePublish}
                  buttonState={publishButtonState}
                  text={
                    statement.publishedAt
                      ? `Hide v${statement.versionNumber}`
                      : `Publish v${statement.versionNumber}`
                  }
                  loadingText={statement.publishedAt ? 'Hiding...' : 'Publishing...'}
                  setButtonState={setPublishButtonState}
                  reset
                  successText={statement.publishedAt ? 'Hidden' : 'Published'}
                  errorText="Failed to publish"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
