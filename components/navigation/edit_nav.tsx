'use client';

import { ChevronDown } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useWindowSize } from 'react-use';
import { ButtonLoadingState, LoadingButton } from '@/components/ui/loading-button';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { formatDate } from '@/lib/helpers/helpersDate';

import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import ViewModeButton from '../view_mode_button';
export default function EditNav() {
  const {
    versionOptions,
    updatedStatement,
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
  const isMobile = useWindowSize().width < 600;

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
      await updateStatementDraft(updatedStatement);
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

  const versionMenu = () => {
    if (!updatedStatement) return null;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            {`v${updatedStatement.versionNumber}`} <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Select
                value={updatedStatement?.versionNumber.toString()}
                onValueChange={(value) => changeVersion(parseInt(value, 10))}
              >
                <SelectTrigger className="w-full">
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
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LoadingButton
                className="w-full"
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
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <header className="h-14">
      <div className="fixed z-50 top-0 left-0 right-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/[userSlug]/${updatedStatement?.statementId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            {updatedStatement && (
              <>
                {versionMenu()}
                <LoadingButton
                  variant="outline"
                  onClick={handleUpdate}
                  buttonState={updateButtonState}
                  text={`Update`}
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
                    updatedStatement.publishedAt
                      ? `Hide`
                      : `Publish v${updatedStatement.versionNumber}`
                  }
                  loadingText={updatedStatement.publishedAt ? 'Hiding...' : 'Publishing...'}
                  setButtonState={setPublishButtonState}
                  reset
                  successText={updatedStatement.publishedAt ? 'Hidden' : 'Published'}
                  errorText="Failed to publish"
                />
                <ViewModeButton
                  handleEditModeToggle={() =>
                    router.push(`/[userSlug]/${updatedStatement?.statementId}`)
                  }
                  iconOnly={isMobile}
                  variant="default"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
