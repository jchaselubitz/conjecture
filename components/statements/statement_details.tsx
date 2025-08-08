import { BaseStatementCitation, StatementWithDraft } from 'kysely-codegen';
import { ChevronLeft, Loader2, Upload } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
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
import {
  updateStatementHeaderImageUrl,
  updateStatementSubtitle,
  updateStatementTitle
} from '@/lib/actions/statementActions';
import { headerImageChange } from '@/lib/helpers/helpersStatements';
import { generateStatementId } from '@/lib/helpers/helpersStatements';
import { cn } from '@/lib/utils';

import InlineCardStack from '../card_stacks/inline_card_stack';
import CommentSwitch from '../navigation/comment_switch';
import { AspectRatio } from '../ui/aspect-ratio';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const EditorMenu = dynamic(
  () => import('./custom_editor/editor_menu').then(mod => mod.EditorMenu),
  { ssr: false }
);
const HTMLSuperEditor = dynamic(() => import('./custom_editor/html_super_editor'), {
  ssr: false
});
import { ImageLightbox } from './custom_editor/image_lightbox';
const ImageNodeEditor = dynamic(
  () => import('./custom_editor/image_node_editor').then(mod => mod.ImageNodeEditor),
  { ssr: false }
);
const LatexNodeEditor = dynamic(
  () => import('./custom_editor/latex_node_editor').then(mod => mod.LatexNodeEditor),
  { ssr: false }
);
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
  parentStatement: StatementWithDraft | null | undefined;
  familyTree: {
    precedingPosts: StatementWithDraft[];
    followingPosts: StatementWithDraft[];
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
  const { editor, updatedDraft, statement, annotations, citations, images } = useStatementContext();
  const { selectedAnnotationId, setSelectedAnnotationId } = useStatementAnnotationContext();
  const { initialImageData, setInitialImageData, setImageLightboxOpen } =
    useStatementToolsContext();

  const isPublished = !!statement?.draft.publishedAt;
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [footnoteIds, setFootnoteIds] = useState<string[]>([]);

  const { statementId, title, subtitle, headerImg } = statement;

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
        updateStatementHeaderImageUrl,
        statementSlug: statement.slug ?? ''
      });
      if (imageUrl) {
        // setUpdatedDraft({
        //   ...updatedDraft,
        //   headerImg: imageUrl
        // });
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
    return userId === statement?.creatorId;
  }, [userId, statement]);

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

  if (!updatedDraft) return null;

  const displayStyle = {
    ...fixedBottom,
    height: 'fit-content',
    marginBottom: '10px',
    maxWidth: '95%'
  };

  return (
    <div className={cn('h-full md:pb-2')}>
      <div className="flex justify-center">
        {!isPublished && (
          <div className="text-center bg-amber-100 bg-opacity-20 rounded-md py-1 text-lg uppercase text-amber-700 border border-amber-300 font-semibold md:max-w-3xl w-full  px-4 ">
            Draft
          </div>
        )}
      </div>
      <div className="flex flex-col md:mt-12 md:mx-auto w-full max-w-screen md:max-w-3xl bg-white">
        {headerImg ? (
          <div className="relative group md:px-4">
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-md">
              <Image
                src={headerImg ?? ''}
                alt="Statement cover image"
                fill
                className="h-full w-full md:rounded-md object-cover"
                priority={true}
                sizes="(max-width: 768px) 600px, (max-width: 1200px) 768px, 1200px"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                quality={75}
                loading="eager"
                decoding="async"
              />
              {isStatementCreator && editMode && (
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
            {statement.parentStatementId && (
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
                  defaultValue={statement?.title || ''}
                  minRows={1}
                  maxRows={2}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    updateStatementTitle({
                      title: e.target.value,
                      statementId: prepStatementId,
                      creatorId: statement.creatorId,
                      statementSlug: statement.slug
                    })
                  }
                />
              ) : (
                <h1 className="md:text-5xl text-3xl font-bold py-1">{statement?.title ?? title}</h1>
              )}
            </div>
            <div className="flex justify-between items-center">
              {editMode ? (
                <TextareaAutosize
                  name="subtitle"
                  disabled={!editMode}
                  placeholder="Give it a subtitle..."
                  className="shadow-none rounded-none border-0 border-b py-4 font-medium focus:outline-none focus:border-zinc-500 focus-visible:ring-0 w-full text-zinc-700 md:text-xl resize-none bg-transparent"
                  defaultValue={statement?.subtitle || ''}
                  minRows={1}
                  maxRows={2}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    updateStatementSubtitle({
                      subtitle: e.target.value,
                      statementId: prepStatementId,
                      creatorId: statement.creatorId,
                      statementSlug: statement.slug
                    })
                  }
                />
              ) : (
                <h2 className="font-medium py-1 md:text-xl text-zinc-500">
                  {statement?.subtitle ?? subtitle}
                </h2>
              )}
            </div>
          </div>
          <div className="md:hidden">
            <InlineCardStack familyTree={familyTree} currentTitle={statement?.title || ''} />
          </div>
          <div className="flex items-center justify-between mb-5">
            <StatementOptions
              className="mb-0 w-full"
              statement={statement}
              showAuthorComments={showAuthorComments}
              showReaderComments={showReaderComments}
              onShowAuthorCommentsChange={onShowAuthorCommentsChange}
              onShowReaderCommentsChange={onShowReaderCommentsChange}
            />
          </div>

          <Byline statement={statement} />

          <div className="pb-6 overflow-hidden bg-background ">
            <HTMLSuperEditor
              key={`editor-content-${editMode}`}
              draft={updatedDraft}
              style={{ minHeight: '40px' }}
              existingAnnotations={annotations}
              statementCreatorId={statement.creatorId}
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
              <ImageNodeEditor statementId={statementId} statementCreatorId={statement.creatorId} />
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
                statementSlug={updatedDraft.slug ?? ''}
              />
            </div>
          )}

          <FootnoteList citations={orderedFootnotes} />
          {!editMode && (
            <CommentSwitch annotationMode={annotationMode} setAnnotationMode={setAnnotationMode} />
          )}
          <div className="h-14" />
        </div>
      </div>
    </div>
  );
}
