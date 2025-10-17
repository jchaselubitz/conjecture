import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Editor, Extension } from '@tiptap/react';
import {
  BaseStatementCitation,
  BaseStatementImage,
  NewStatementCitation,
  StatementWithDraft,
  StatementWithDraftAndCollaborators
} from 'kysely-codegen';
import { AnnotationWithComments } from 'kysely-codegen';

import { createAnnotation } from '../actions/annotationActions';
import { UpsertImageDataType } from '../actions/statementActions';
import { uploadStatementImage } from '../actions/storageActions';

import { handleHeaderImageCompression, handleImageCompression } from './helpersImages';
export type PositionParams = {
  x: number;
  y: number;
  width: number;
  height: number;
};

import * as Sentry from '@sentry/nextjs';
import { Node as ProsemirrorNode } from '@tiptap/pm/model';
import { RevalidationPath } from 'kysely-codegen';
import { nanoid } from 'nanoid';
import { Dispatch, SetStateAction } from 'react';

import { deleteCitations } from '../actions/citationActions';

export const generateStatementId = (): string => {
  return nanoid(10); // 10 chars, URL-safe, good collision resistance
};

// Define the return type for getMarks
type MarkInfo = {
  node: ProsemirrorNode;
  pos: number;
  end: number; // Position after the node
};

export const getMarks = (editor: Editor, markTypes: string[]): MarkInfo[] => {
  const marks: MarkInfo[] = [];
  editor.state.doc.descendants((node, pos) => {
    // Ensure we are dealing with a ProsemirrorNode, not any node
    const prosemirrorNode = node as ProsemirrorNode;
    if (prosemirrorNode.marks?.some(mark => markTypes.includes(mark.type.name))) {
      marks.push({
        node: prosemirrorNode,
        pos,
        end: pos + prosemirrorNode.nodeSize
      });
    }
  });
  return marks;
};

export const getNodes = (editor: Editor, nodeTypes: string[]) => {
  const nodes: { node: any }[] = [];
  editor.state.doc.descendants(node => {
    if (nodeTypes.includes(node.type.name)) {
      nodes.push({ node });
    }
  });
  return nodes;
};

// HTML-first approach: This function is now just for validation/debugging
// HTML is the source of truth, so we just validate consistency
type EnsureAnnotationMarksProps = {
  annotations: AnnotationWithComments[];
  marks: MarkInfo[];
};

export const ensureAnnotationMarks = async ({ annotations, marks }: EnsureAnnotationMarksProps) => {
  // HTML-first approach: HTML marks are the source of truth
  // This function just validates consistency for debugging

  if (marks.length === 0 && annotations.length > 0) {
    console.warn(
      `[ensureAnnotationMarks] HTML-first validation: Found ${annotations.length} annotations in DB but no marks in HTML. HTML is the source of truth.`
    );
  }

  // Check if any DB annotations don't have corresponding HTML marks
  const htmlAnnotationIds = new Set<string>();
  marks.forEach(markInfo => {
    const annotationMark = markInfo.node.marks.find(
      (mark: any) => mark.type.name === 'annotationHighlight'
    );
    if (annotationMark?.attrs?.annotationId) {
      htmlAnnotationIds.add(annotationMark.attrs.annotationId);
    }
  });

  const dbOnlyAnnotations = annotations.filter(a => !htmlAnnotationIds.has(a.id));
  if (dbOnlyAnnotations.length > 0) {
    console.warn(
      `[ensureAnnotationMarks] HTML-first validation: ${dbOnlyAnnotations.length} annotations exist in DB but not in HTML. HTML is the source of truth. DB IDs:`,
      dbOnlyAnnotations.map(a => a.id)
    );
  }

  // No state updates or mark reapplication - HTML is already correct
};

export const ensureCitations = async ({
  citations,
  nodeIds,
  statementCreatorId
}: {
  citations: BaseStatementCitation[];
  nodeIds: string[];
  statementCreatorId: string;
}) => {
  // here we want to delete any citations in the DB that do not exist in the editor
  const citationsToDelete = citations
    .filter(citation => !nodeIds.includes(citation.id))
    .map(citation => citation.id);
  if (citationsToDelete.length > 0) {
    await deleteCitations(citationsToDelete, statementCreatorId);
  }
};

export const headerImageChange = async ({
  event,
  userId,
  statementId,
  headerImg,
  updateStatementHeaderImageUrl,
  statementSlug
}: {
  event: React.ChangeEvent<HTMLInputElement>;
  userId: string;
  statementId: string;
  headerImg: string;
  statementSlug: string;
  updateStatementHeaderImageUrl: ({
    statementId,
    imageUrl,
    creatorId,
    revalidationPath
  }: {
    statementId: string;
    imageUrl: string;
    creatorId: string;
    revalidationPath: RevalidationPath;
  }) => Promise<void>;
}): Promise<string | undefined> => {
  try {
    const files = event.target.files?.length ? Array.from(event.target.files) : null;
    if (files && files.length > 0) {
      const imageUrl = await Promise.all(
        files.map(async file => {
          const compressedFile = await handleHeaderImageCompression(file);
          if (!compressedFile) return;

          const fileFormData = new FormData();
          fileFormData.append('image', compressedFile);
          if (!userId) {
            alert('Please set your profile name first.');
            return;
          }
          const imageUrl = await uploadStatementImage({
            file: fileFormData,
            creatorId: userId,
            statementId,
            fileName: compressedFile.name,
            oldImageUrl: headerImg ?? null
          });
          if (!imageUrl) throw new Error('Failed to upload image');
          try {
            await updateStatementHeaderImageUrl({
              statementId,
              imageUrl,
              creatorId: userId,
              revalidationPath: {
                path: `/${userId}/${statementSlug}`,
                type: 'layout'
              }
            });
          } catch (error) {
            throw Error('Failed to update statement header image');
          }
          return imageUrl;
        })
      );
      return imageUrl[0];
    }
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
  }
};

const quoteHighlightKey = new PluginKey('quoteHighlight');

export const createQuoteHighlight = (searchParamsGetter: () => URLSearchParams) => {
  return Extension.create({
    name: 'quoteHighlight',

    addProseMirrorPlugins() {
      let decorationSet = DecorationSet.empty;

      return [
        new Plugin({
          key: quoteHighlightKey,
          props: {
            decorations(state) {
              const location = searchParamsGetter().get('location');
              if (!location) return DecorationSet.empty;

              const [start, end] = location.split('-').map((pos: string) => parseInt(pos, 10));
              if (isNaN(start) || isNaN(end)) return DecorationSet.empty;

              // Create a decoration that adds the quoted-text class
              const decoration = Decoration.inline(start, end, {
                class: 'referenced-text'
              });

              decorationSet = DecorationSet.create(state.doc, [decoration]);
              return decorationSet;
            }
          }
        })
      ];
    }
  });
};

export type LatexPopoverProps = {
  latex?: string;
  displayMode?: boolean;
  latexId?: string | null;
  position?: { x: number; y: number; width: number; height: number } | null;
  setCurrentLatex: (latex: string) => void;
  setIsBlock: (displayMode: boolean) => void;
  setSelectedLatexId: (latexId: string | null) => void;
  setSelectedNodePosition: (
    position: { x: number; y: number; width: number; height: number } | null
  ) => void;
  setLatexPopoverOpen: (open: boolean) => void;
};
export const openLatexPopover = ({
  latex = '',
  displayMode = true,
  latexId = null,
  position = null,
  setCurrentLatex,
  setIsBlock,
  setSelectedLatexId,
  setSelectedNodePosition,
  setLatexPopoverOpen
}: LatexPopoverProps) => {
  setCurrentLatex(latex);
  setIsBlock(displayMode);
  setSelectedLatexId(latexId);
  if (position) {
    setSelectedNodePosition(position);
  }
  setLatexPopoverOpen(true);
};

export type ImageLightboxProps = {
  id: string;
  statementImages: BaseStatementImage[];
  setInitialImageData: Dispatch<SetStateAction<UpsertImageDataType>>;
  setImageLightboxOpen: (open: boolean) => void;
};

export const openImageLightbox = ({
  id,
  statementImages,
  setInitialImageData,
  setImageLightboxOpen
}: ImageLightboxProps) => {
  if (id) {
    const existingImage = statementImages.find(image => image.id === id);
    setInitialImageData({
      src: existingImage?.src ?? '',
      alt: existingImage?.alt ?? '',
      id: existingImage?.id ?? '',
      statementId: existingImage?.statementId ?? ''
    });
    setImageLightboxOpen(true);
  }
};

export type ImagePopoverProps = {
  src?: string;
  alt?: string;
  id?: string;
  caption?: string;
  position?: { x: number; y: number; width: number; height: number } | null;
  statementImages?: BaseStatementImage[];
  setInitialImageData: Dispatch<SetStateAction<UpsertImageDataType>>;
  setSelectedNodePosition: (
    position: { x: number; y: number; width: number; height: number } | null
  ) => void;
  setImagePopoverOpen: (open: boolean) => void;
  statementId: string;
};

export const openImagePopover = ({
  src = '',
  alt = '',
  id = '',
  caption = '',
  position = null,
  statementImages = [],
  setInitialImageData,
  setSelectedNodePosition,
  setImagePopoverOpen,
  statementId
}: ImagePopoverProps) => {
  const existingImage = statementImages.find(image => image.id === id);
  if (existingImage) {
    setInitialImageData({
      src: existingImage.src ?? src ?? '',
      alt: existingImage.alt ?? alt ?? '',
      caption: existingImage.caption ?? caption ?? '',
      statementId,
      id
    });
  }
  if (position) {
    setSelectedNodePosition(position);
  }
  setImagePopoverOpen(true);
};

export type CitationPopoverProps = {
  citationData: NewStatementCitation;
  position?: { x: number; y: number; width: number; height: number } | null;
  setCitationData: (data: NewStatementCitation) => void;
  setSelectedNodePosition: (
    position: { x: number; y: number; width: number; height: number } | null
  ) => void;
  setCitationPopoverOpen: (open: boolean) => void;
};

export const openCitationPopover = ({
  citationData,
  position = null,
  setCitationData,
  setSelectedNodePosition,
  setCitationPopoverOpen
}: CitationPopoverProps) => {
  if (!citationData) return;

  setCitationData(citationData);
  if (position) {
    setSelectedNodePosition(position);
  }
  setCitationPopoverOpen(true);
};

export type CreateAnnotationProps = {
  userId: string | undefined;
  editor: Editor | null;
  draftId: string;
  annotations: AnnotationWithComments[];
  statementCreatorId: string;
  showAuthorComments: boolean;
  showReaderComments: boolean;
  setSelectedAnnotationId: (id: string) => void | undefined;
  setAnnotations: Dispatch<SetStateAction<AnnotationWithComments[]>>;
};

export const createStatementAnnotation = async ({
  userId,
  editor,
  draftId,
  annotations,
  statementCreatorId,
  showAuthorComments,
  showReaderComments,
  setSelectedAnnotationId,
  setAnnotations
}: CreateAnnotationProps) => {
  if (!userId || !editor || !setSelectedAnnotationId || !setAnnotations) return;
  // Check if text is actually selected
  const { from, to } = editor.state.selection;
  if (from === to) {
    return;
  }
  // Check if the user is allowed to create annotations based on their role
  const isAuthor = userId === statementCreatorId;
  if ((isAuthor && !showAuthorComments) || (!isAuthor && !showReaderComments)) {
    return;
  }

  try {
    // HTML-first approach: Apply mark to HTML first, then save to DB as reference
    const annotationId = nanoid();
    const createdAt = new Date();

    // Step 1: Apply the mark to the HTML FIRST
    editor
      .chain()
      .setTextSelection({ from, to })
      .setMark('annotationHighlight', {
        annotationId,
        userId,
        isAuthor,
        createdAt: createdAt.toISOString(),
        tag: null
      })
      .run();

    // Step 2: Get the updated HTML content (now contains the annotation mark)
    const newContent = editor.getHTML();
    const newContentJson = editor.getJSON();
    const newPlainText = editor.getText();

    // Step 3: Save the HTML with the mark to the database
    // Note: This requires access to the draft object with versionNumber
    // The onUpdate handler in useHtmlSuperEditor will handle this automatically
    // So we just need to trigger an update

    const newAnnotation: AnnotationWithComments = {
      id: annotationId,
      text: editor.state.doc.textBetween(from, to),
      userId,
      draftId,
      start: from,
      end: to,
      tag: '',
      isPublic: true,
      createdAt,
      updatedAt: createdAt,
      comments: [],
      userName: '',
      userImageUrl: ''
    };

    // Step 4: Update local state (this will trigger onUpdate which saves HTML)
    setSelectedAnnotationId(annotationId);
    setAnnotations([...annotations, newAnnotation]);

    // Step 5: THEN save the position to DB as a reference for other features
    await createAnnotation({
      annotation: {
        id: annotationId,
        tag: null,
        text: newAnnotation.text,
        start: from,
        end: to,
        userId,
        draftId: draftId.toString()
      },
      statementId: draftId
    });

    // Note: HTML is now the source of truth. The DB positions are just references.
  } catch (error) {
    console.error('Error creating annotation:', error);
  }
};

export const checkValidStatementSlug = (slug: string) => {
  return slug.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
};

export const groupThreadsByParentId = ({
  threads,
  statement
}: {
  threads: StatementWithDraft[];
  statement: StatementWithDraftAndCollaborators;
}): {
  precedingPosts: StatementWithDraft[];
  followingPosts: StatementWithDraft[];
  hasPosts: boolean;
} => {
  let hasPosts = true;
  if (threads.length === 0) {
    hasPosts = false;
  }
  const precedingPostsRecursive = (
    precedingDraft: StatementWithDraft,
    precedingPosts: StatementWithDraft[]
  ) => {
    const precedingPost = threads.find(
      draft => draft.statementId === precedingDraft.parentStatementId
    );
    if (precedingPost) {
      precedingPosts.push(precedingPost);
      precedingPostsRecursive(precedingPost, precedingPosts);
    }
    return precedingPosts.sort(
      (a, b) => (a.publishedAt?.getTime() ?? 0) - (b.publishedAt?.getTime() ?? 0)
    );
  };

  const statementWithDraft = {
    ...statement,
    publishedAt: statement.draft.publishedAt,
    versionNumber: statement.draft.versionNumber,
    content: statement.draft.content,
    contentPlainText: statement.draft.contentPlainText,
    draftId: statement.draft.id
  } as StatementWithDraft;

  const precedingPosts = precedingPostsRecursive(statementWithDraft, []);

  const followingPosts: StatementWithDraft[] = threads.filter(draft => {
    if (draft.statementId !== statement.statementId) {
      if (draft.parentStatementId === statement.statementId) {
        return draft;
      }
    }
  });

  return {
    precedingPosts,
    followingPosts,
    hasPosts
  };
};
