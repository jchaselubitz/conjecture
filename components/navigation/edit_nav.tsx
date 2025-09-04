'use client';

import { ChevronDown, MoreVertical } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useWindowSize } from 'react-use';

import { ButtonLoadingState, LoadingButton } from '@/components/ui/loading-button';
import { useEditModeContext } from '@/contexts/EditModeContext';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useStatementUpdateContext } from '@/contexts/StatementUpdateProvider';
import { sendNewsletterEmail } from '@/lib/actions/notificationActions';
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
  const { setEditMode, editMode } = useEditModeContext();
  const {
    versionOptions,
    saveStatementDraft,
    togglePublish,
    nextVersionNumber,
    currentVersion,
    statement,
    writerUserSlug
  } = useStatementContext();

  const { updateStatementDraft, isUpdating } = useStatementUpdateContext();

  const currentDraftIsPublished = statement?.draft.publishedAt;
  const [saveButtonState, setSaveButtonState] = useState<ButtonLoadingState>('default');
  const [updateButtonState, setUpdateButtonState] = useState<ButtonLoadingState>('default');
  const [publishButtonState, setPublishButtonState] = useState<ButtonLoadingState>('default');
  const [sendToSubscribersButtonState, setSendToSubscribersButtonState] =
    useState<ButtonLoadingState>('default');

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
      await updateStatementDraft();
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

  const handleSendToSubscribers = async () => {
    try {
      setSendToSubscribersButtonState('loading');
      await sendNewsletterEmail({
        statement: statement,
        authorNames: statement.authors.map(author => author.name || author.username || '')
      });
      setSendToSubscribersButtonState('success');
    } catch (error) {
      console.error(error);
      setSendToSubscribersButtonState('error');
    }
  };

  const changeVersion = (newVersion: number) => {
    router.push(`/${writerUserSlug}/${statement.slug}/${newVersion}?edit=${editMode}`);
  };

  const isPublished = statement?.draft.publishedAt;

  const versionMenu = () => {
    if (!statement) return null;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            {`v${statement.draft.versionNumber}`} <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuGroup>
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
            <DropdownMenuItem>
              <Select
                value={statement?.draft.versionNumber.toString()}
                onValueChange={value => changeVersion(parseInt(value, 10))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a version" />
                </SelectTrigger>
                <SelectContent>
                  {versionOptions.map(v => (
                    <SelectItem key={v.versionNumber} value={v.versionNumber.toString()}>
                      v{v.versionNumber} -{' '}
                      <span className="text-sm text-zinc-500">
                        {formatDate({ date: v.createdAt })}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const mobileMenu = () => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Link
                href={`/${statement.creatorSlug}/${statement.slug}/${currentVersion}/newsletter`}
                className="w-full"
              >
                <Button variant="outline" size="sm" className="w-full ">
                  Preview newsletter
                </Button>
              </Link>
            </DropdownMenuItem>
            {isPublished && (
              <DropdownMenuItem>
                <LoadingButton
                  onClick={handleSendToSubscribers}
                  buttonState={sendToSubscribersButtonState}
                  variant="outline"
                  text="Send to subscribers"
                  loadingText="Sending..."
                  setButtonState={setSendToSubscribersButtonState}
                  className="w-full"
                />
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <LoadingButton
                onClick={handlePublish}
                buttonState={publishButtonState}
                text={isPublished ? `Hide Post` : `Publish v${currentVersion}`}
                loadingText={isPublished ? 'Hiding...' : 'Publishing...'}
                setButtonState={setPublishButtonState}
                reset
                successText={isPublished ? 'Hidden' : 'Published'}
                errorText="Failed to publish"
                className="w-full"
              />
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <header className="h-14">
      <div className="nav-fixed z-50 top-0 left-0 right-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <Button variant="ghost" size="icon" onClick={() => setEditMode(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            {statement && (
              <>
                {versionMenu()}
                <LoadingButton
                  variant="outline"
                  onClick={handleUpdate}
                  buttonState={updateButtonState}
                  text={currentDraftIsPublished ? `Update` : `Save`}
                  loadingText={currentDraftIsPublished ? 'Updating...' : 'Saving...'}
                  successText={currentDraftIsPublished ? 'Updated' : 'Saved'}
                  setButtonState={setUpdateButtonState}
                  reset
                  errorText={currentDraftIsPublished ? 'Failed to update' : 'Failed to save'}
                />
                {!isPublished && (
                  <LoadingButton
                    onClick={handlePublish}
                    buttonState={publishButtonState}
                    text={isPublished ? `Hide` : `Publish v${currentVersion}`}
                    loadingText={isPublished ? 'Hiding...' : 'Publishing...'}
                    setButtonState={setPublishButtonState}
                    reset
                    successText={isPublished ? 'Hidden' : 'Published'}
                    errorText="Failed to publish"
                  />
                )}

                <ViewModeButton iconOnly={isMobile} variant="default" />
                <div className="flex gap-3">{mobileMenu()}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
