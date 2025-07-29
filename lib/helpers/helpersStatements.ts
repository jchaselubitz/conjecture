import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Editor, Extension } from '@tiptap/react';
import crypto from 'crypto';
import {
  BaseStatementCitation,
  BaseStatementImage,
  NewStatementCitation,
  StatementWithUser
} from 'kysely-codegen';
import { AnnotationWithComments } from 'kysely-codegen';

import { createAnnotation } from '../actions/annotationActions';
import { UpsertImageDataType } from '../actions/statementActions';
import { uploadStatementImage } from '../actions/storageActions';

import { handleImageCompression } from './helpersImages';
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
  const randomNumber = Math.floor(Math.random() * 100000);
  const currentDatetime = new Date().toISOString();
  const hash = crypto
    .createHash('sha256')
    .update(currentDatetime + randomNumber.toString())
    .digest('hex');

  return hash.slice(0, 10);
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

// Update the type definition for marks parameter in ensureAnnotationMarks
type EnsureAnnotationMarksProps = {
  annotations: AnnotationWithComments[];
  marks: MarkInfo[];
};

// This function now primarily serves to check consistency on load, not modify state.
export const ensureAnnotationMarks = async ({
  annotations, // The initial annotations from props
  marks
}: EnsureAnnotationMarksProps) => {
  marks.forEach(markInfo => {
    const { node, pos } = markInfo;
    const annotationMark = node.marks.find((mark: any) => mark.type.name === 'annotationHighlight');

    if (annotationMark) {
      const annotationId = annotationMark.attrs.annotationId;
      // Check against the *initial* annotations passed in
      const existsInInitialState = annotations.some(a => a.id === annotationId);

      if (!existsInInitialState) {
        // Log a warning if a mark exists in HTML but not in the initial annotation data.
        // This indicates a potential data inconsistency.
        console.warn(
          `[ensureAnnotationMarks] Annotation mark found in initial HTML for ID [${annotationId}] at position ${pos}, but no corresponding annotation was provided in initial props. The mark might be drawn later by useEffect if state changes, but check for data inconsistency.`,
          { markAttributes: annotationMark.attrs }
        );
      }

      // No need to check start/end validity or create/add annotations here.
      // The useEffect hook handles drawing marks based on the authoritative state.
    }
  });

  // No state updates or DB calls from this function anymore.
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
          const compressedFile = await handleImageCompression(file);
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
                class: 'quoted-text'
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
    // Create a new annotation
    const annotationId = nanoid();
    const newAnnotation: AnnotationWithComments = {
      id: annotationId,
      text: editor.state.doc.textBetween(from, to),
      userId,
      draftId,
      start: editor.state.selection.from,
      end: editor.state.selection.to,
      tag: '',
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: [],
      userName: '',
      userImageUrl: ''
    };
    setAnnotations([...annotations, newAnnotation]);

    await createAnnotation({
      annotation: {
        id: newAnnotation.id,
        tag: newAnnotation.tag || null,
        text: newAnnotation.text,
        start: newAnnotation.start,
        end: newAnnotation.end,
        userId: newAnnotation.userId,
        draftId: newAnnotation.draftId.toString()
      },
      statementId: draftId
    });

    // Apply the highlight mark
    if (!newAnnotation.id || !newAnnotation.userId) {
      return;
    }

    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .setAnnotationHighlight({
        annotationId: newAnnotation.id,
        userId: newAnnotation.userId,
        isAuthor: newAnnotation.userId === statementCreatorId,
        createdAt:
          newAnnotation.createdAt instanceof Date
            ? newAnnotation.createdAt.toISOString()
            : new Date().toISOString(),
        tag: newAnnotation.tag || null
      })
      .run();

    setSelectedAnnotationId(newAnnotation.id);
  } catch (error) {
    // Handle error silently
  }
};

export const checkValidStatementSlug = (slug: string) => {
  return slug.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
};

export const groupThreadsByParentId = (
  threads: StatementWithUser[],
  currentDraft: StatementWithUser
): {
  precedingPosts: StatementWithUser[];
  followingPosts: StatementWithUser[];
  hasPosts: boolean;
} => {
  let hasPosts = true;
  if (threads.length === 0) {
    hasPosts = false;
  }
  const precedingPostsRecursive = (
    precedingDraft: StatementWithUser,
    precedingPosts: StatementWithUser[]
  ) => {
    const precedingPost = threads.find(
      draft => draft.statementId === precedingDraft.parentStatementId
    );
    if (precedingPost) {
      precedingPosts.push(precedingPost);
      precedingPostsRecursive(precedingPost, precedingPosts);
    }
    return precedingPosts.sort(
      (a, b) => (a.draft.publishedAt?.getTime() ?? 0) - (b.draft.publishedAt?.getTime() ?? 0)
    );
  };

  const precedingPosts = precedingPostsRecursive(currentDraft, []);

  const followingPosts: StatementWithUser[] = threads.filter(draft => {
    if (draft.statementId !== currentDraft.statementId) {
      if (draft.parentStatementId === currentDraft.statementId) {
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
