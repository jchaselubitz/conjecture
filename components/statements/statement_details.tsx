import { BaseStatementCitation, StatementWithUser } from 'kysely-codegen';
import { ArrowLeftToLineIcon, ChevronLeft, Loader2, Sidebar, Upload } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { RefObject, useEffect, useMemo, useRef } from 'react';
import { useState } from 'react';
import { useFixedStyleWithIOsKeyboard } from 'react-ios-keyboard-viewport';
import { ImperativePanelGroupHandle } from 'react-resizable-panels';
import TextareaAutosize from 'react-textarea-autosize';
import { toast } from 'sonner';

import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useStatementToolsContext } from '@/contexts/StatementToolsContext';
import { useUserContext } from '@/contexts/userContext';
import { updateStatementHeaderImageUrl } from '@/lib/actions/statementActions';
import { getPanelState, setPanelState } from '@/lib/helpers/helpersLayout';
import { headerImageChange } from '@/lib/helpers/helpersStatements';
import { generateStatementId } from '@/lib/helpers/helpersStatements';
import { cn } from '@/lib/utils';

import InlineCardStack from '../card_stacks/inline_card_stack';
import ReadNav from '../navigation/read_nav';
import { AspectRatio } from '../ui/aspect-ratio';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

import { EditorMenu } from './custom_editor/editor_menu';
import HTMLSuperEditor from './custom_editor/html_super_editor';
import { ImageLightbox } from './custom_editor/image_lightbox';
import { ImageNodeEditor } from './custom_editor/image_node_editor';
import { LatexNodeEditor } from './custom_editor/latex_node_editor';
import { FootnoteList } from './footnote/footnote_list';
import Byline from './byline';
import StatementOptions from './statement_options';

export interface StatementDetailsProps {
  editMode: boolean;
  showAuthorComments: boolean;
  showReaderComments: boolean;
  handleOpenComments?: () => void;
  onShowAuthorCommentsChange: (checked: boolean) => void;
  onShowReaderCommentsChange: (checked: boolean) => void;
  panelGroupRef: RefObject<ImperativePanelGroupHandle | null>;
  parentStatement: StatementWithUser | null | undefined;
  familyTree: {
    precedingPosts: StatementWithUser[];
    followingPosts: StatementWithUser[];
  };
  annotationMode: boolean;
  setAnnotationMode: (annotationMode: boolean) => void;
}

export default function StatementDetails({
  editMode,
  showAuthorComments,
  showReaderComments,
  handleOpenComments,
  onShowAuthorCommentsChange,
  onShowReaderCommentsChange,
  panelGroupRef,
  parentStatement,
  familyTree,
  annotationMode,
  setAnnotationMode
}: StatementDetailsProps) {
  const { userId, currentUserSlug } = useUserContext();
  const { editor, setUpdatedStatement, updatedStatement } = useStatementContext();
  const { selectedAnnotationId, setSelectedAnnotationId } = useStatementAnnotationContext();
  const { initialImageData, setInitialImageData, setImageLightboxOpen, citations } =
    useStatementToolsContext();

  const router = useRouter();
  const pathname = usePathname();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [footnoteIds, setFootnoteIds] = useState<string[]>([]);
  const { statementId, title, subtitle, headerImg, draft } = updatedStatement;
  const annotations = draft.annotations;

  const orderedFootnotes = useMemo(() => {
    const footnotes: BaseStatementCitation[] = [];
    footnoteIds.forEach(id => {
      const footnote = citations.find(citation => citation.id === id);
      if (footnote) {
        footnotes.push(footnote);
      }
    });
    return footnotes;
  }, [citations, footnoteIds]);

  const prepStatementId = statementId ? statementId : generateStatementId();

  const handleEditModeToggle = () => {
    setSelectedAnnotationId(undefined);
    if (!editMode) {
      router.push(`${pathname}?version=${updatedStatement.draft.versionNumber}&edit=true`);
    } else {
      router.push(pathname);
    }
  };

  const handleAnnotationClick = async (annotationId: string) => {
    setSelectedAnnotationId(annotationId);
    handleOpenComments?.();
  };

  const handlePhotoButtonClick = () => {
    if (photoInputRef.current !== null) {
      photoInputRef.current.click();
    }
  };

  const handleHeaderImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId) {
      alert('You must be logged in to upload an image.');
      return;
    }
    setIsUploading(true);
    try {
      const imageUrl = await headerImageChange({
        event,
        userId,
        statementId: prepStatementId,
        headerImg: headerImg ?? '',
        updateStatementHeaderImageUrl
      });
      if (imageUrl) {
        setUpdatedStatement({
          ...updatedStatement,
          headerImg: imageUrl
        });
        setIsUploading(false);
      }
      toast('Success', {
        description: 'Profile picture updated successfully!'
      });
      setIsUploading(false);
    } catch (error) {
      console.error(error);
      toast('Error', {
        description: 'Failed to upload image. Please try again.'
      });
      setIsUploading(false);
    }
  };

  const isStatementCreator = useMemo(() => {
    return userId === updatedStatement?.creatorId;
  }, [userId, updatedStatement]);

  const authorCanAnnotate = useMemo(() => {
    return (isStatementCreator && showAuthorComments) || !userId;
  }, [isStatementCreator, showAuthorComments, userId]);

  const readerCanAnnotate = useMemo(() => {
    return (!isStatementCreator && showReaderComments) || !userId;
  }, [isStatementCreator, showReaderComments, userId]);

  const annotatable = useMemo(() => {
    return !!userId && !editMode && (authorCanAnnotate || readerCanAnnotate);
  }, [userId, editMode, authorCanAnnotate, readerCanAnnotate]);

  const prevEditModeRef = useRef(editMode);

  const { fixedBottom } = useFixedStyleWithIOsKeyboard();

  useEffect(() => {
    if (prevEditModeRef.current && !editMode) {
      //
      return;
    }
    prevEditModeRef.current = editMode;
  }, [editMode]);

  if (!updatedStatement) return null;

  const displayStyle = {
    ...fixedBottom,
    height: 'fit-content',
    marginBottom: '10px',
    maxWidth: '95%'
  };

  return (
    <div className="overflow-y-auto h-full">
      {/* <div className="hidden md:flex justify-between items-center  sticky top-0">
        {handleToggleStack && (
          <Button variant="ghost" size="icon" className=" z-50 mt-1 " onClick={handleToggleStack}>
            <Sidebar className="w-4 h-4" />
          </Button>
        )}
        {handleOpenComments && !editMode && (
          <Button variant="ghost" size="icon" className="z-50 mt-1" onClick={handleOpenComments}>
            <ArrowLeftToLineIcon className="w-4 h-4" />
          </Button>
        )}
      </div> */}
      <div className="flex flex-col md:mt-12 md:mx-auto w-full max-w-screen md:max-w-3xl  ">
        {headerImg ? (
          <div className="relative group md:px-4">
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-md">
              <Image
                src={headerImg ?? ''}
                alt="Statement cover image"
                fill
                className="h-full w-full md:rounded-md object-cover"
                priority
              />
              {updatedStatement.creatorId === userId && editMode && (
                <div
                  className={cn(
                    'absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center',
                    isUploading && 'opacity-100'
                  )}
                >
                  <Button variant="outline" className="gap-2" onClick={handlePhotoButtonClick}>
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span className="text-sm">Change cover image</span>
                  </Button>
                </div>
              )}
            </AspectRatio>
          </div>
        ) : editMode ? (
          <div className="flex items-center justify-center w-full my-14 md:px-4">
            <Button variant="outline" className="gap-2" onClick={handlePhotoButtonClick}>
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span className="text-sm text-muted-foreground">
                Choose or drag and drop a cover image
              </span>
            </Button>
          </div>
        ) : (
          <></>
        )}

        <div className="flex flex-col px-4 gap-6 ">
          <Input
            type="file"
            ref={photoInputRef}
            accept="image/*"
            className="hidden"
            id="avatar-upload"
            onChange={e => {
              handleHeaderImageChange(e);
            }}
            disabled={isUploading || !editMode}
          />
          <div className="flex flex-col gap-1 mt-6 md:mt-10 md:mb-5 ">
            {updatedStatement.parentStatementId && (
              <Link href={`/${parentStatement?.creatorSlug}/${parentStatement?.slug}`}>
                <p className="bg-yellow-50 text-lg text-yellow-900 px-2 py-1 rounded-md flex items-center gap-2 w-fit hover:bg-yellow-100 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                  Response to: {parentStatement?.title}
                </p>
              </Link>
            )}
            <div className="flex justify-between items-center">
              {editMode ? (
                <TextareaAutosize
                  name="title"
                  disabled={!editMode}
                  placeholder="Give it a title..."
                  className="shadow-none rounded-none border-0 border-b py-4 md:text-5xl text-3xl font-bold h-fit focus:outline-none focus:border-zinc-500 focus-visible:ring-0 w-full resize-none bg-transparent"
                  defaultValue={updatedStatement?.title || ''}
                  minRows={1}
                  maxRows={2}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setUpdatedStatement({
                      ...updatedStatement,
                      title: e.target.value,
                      statementId: prepStatementId
                    })
                  }
                />
              ) : (
                <h1 className="md:text-5xl text-3xl font-bold py-1">
                  {updatedStatement?.title ?? title}
                </h1>
              )}
            </div>
            <div className="flex justify-between items-center">
              {editMode ? (
                <TextareaAutosize
                  name="subtitle"
                  disabled={!editMode}
                  placeholder="Give it a subtitle..."
                  className="shadow-none rounded-none border-0 border-b py-4 font-medium focus:outline-none focus:border-zinc-500 focus-visible:ring-0 w-full text-zinc-700 md:text-xl resize-none bg-transparent"
                  defaultValue={updatedStatement?.subtitle || ''}
                  minRows={1}
                  maxRows={2}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setUpdatedStatement({
                      ...updatedStatement,
                      subtitle: e.target.value,
                      statementId: prepStatementId
                    })
                  }
                />
              ) : (
                <h2 className="font-medium py-1 md:text-xl text-zinc-500">
                  {updatedStatement?.subtitle ?? subtitle}
                </h2>
              )}
            </div>
          </div>
          <div className="md:hidden">
            <InlineCardStack familyTree={familyTree} currentTitle={updatedStatement?.title || ''} />
          </div>
          <div className="flex items-center justify-between mb-5">
            <StatementOptions
              className="mb-0 w-full"
              statement={updatedStatement}
              editMode={editMode}
              showAuthorComments={showAuthorComments}
              showReaderComments={showReaderComments}
              handleEditModeToggle={handleEditModeToggle}
              onShowAuthorCommentsChange={onShowAuthorCommentsChange}
              onShowReaderCommentsChange={onShowReaderCommentsChange}
            />
          </div>

          <Byline statement={updatedStatement} />

          <div className="rounded-lg overflow-hidden bg-background ">
            <HTMLSuperEditor
              key={`editor-content-${editMode}`}
              statement={updatedStatement}
              style={{ minHeight: '40px' }}
              existingAnnotations={annotations}
              userId={userId}
              onAnnotationClick={handleAnnotationClick}
              placeholder="Start typing or paste content here..."
              annotatable={annotatable}
              selectedAnnotationId={selectedAnnotationId}
              setSelectedAnnotationId={setSelectedAnnotationId}
              showAuthorComments={showAuthorComments}
              showReaderComments={showReaderComments}
              editMode={editMode}
              setFootnoteIds={setFootnoteIds}
              panelGroupRef={panelGroupRef}
            />
          </div>
          {!editMode ? (
            <ImageLightbox
              src={initialImageData.src}
              alt={initialImageData.alt ?? ''}
              id={initialImageData.id}
              statementId={statementId}
              setInitialImageData={setInitialImageData}
              setImageLightboxOpen={setImageLightboxOpen}
            />
          ) : (
            <>
              <LatexNodeEditor />
              <ImageNodeEditor
                statementId={statementId}
                statementCreatorId={updatedStatement.creatorId}
              />
            </>
          )}
          {editor && (
            <div
              className="md:fixed flex z-50 md:bottom-10 left-0 right-0 mx-auto md:left-auto md:right-auto md:mx-auto md:ml-20 px-2 justify-center max-w-full "
              style={displayStyle}
            >
              <EditorMenu
                statementId={statementId}
                editor={editor}
                editMode={editMode}
                userSlug={currentUserSlug ?? ''}
                statementSlug={updatedStatement.slug ?? ''}
              />
            </div>
          )}

          <FootnoteList citations={orderedFootnotes} />
          {!editMode && (
            <ReadNav annotationMode={annotationMode} setAnnotationMode={setAnnotationMode} />
          )}
          <div className="h-14" />
        </div>
      </div>
    </div>
  );
}
