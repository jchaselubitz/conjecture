import 'katex/dist/katex.min.css';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { Step } from '@tiptap/pm/transform';
import { EditorContent, FloatingMenu, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { AnnotationWithComments, DraftWithAnnotations, NewStatementCitation } from 'kysely-codegen';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { useWindowSize } from 'react-use';
import { useStatementContext } from '@/contexts/statementContext';
import { deleteCitation } from '@/lib/actions/citationActions';
import { deleteStatementImage } from '@/lib/actions/statementActions';
import {
  createQuoteHighlight,
  ensureAnnotationMarks,
  ensureCitations,
  getMarks,
  getNodes,
  openCitationPopover,
  openImageLightbox,
  openImagePopover,
  openLatexPopover,
} from '@/lib/helpers/helpersStatements';

import { AnnotationMenu } from './annotation_menu';
import { BlockTypeChooser } from './block_type_chooser';
import { CitationNodeEditor } from './citation_node_editor';
import { AnnotationHighlight } from './custom_extensions/annotation_highlight';
import { BlockImage } from './custom_extensions/block_image';
import { BlockLatex } from './custom_extensions/block_latex';
import { Citation } from './custom_extensions/citation';
import { InlineLatex } from './custom_extensions/inline_latex';
import { handleCitationPaste } from './custom_extensions/quote_paste_handler';
import { QuotePasteHandler } from './custom_extensions/quote_paste_handler';
import { ImageNodeEditor } from './image_node_editor';
import { LatexNodeEditor } from './latex_node_editor';
import { EditorMenu } from './editor_menu';
import { cn } from '@/lib/utils';

interface HTMLSuperEditorProps {
  statement: DraftWithAnnotations;
  existingAnnotations: AnnotationWithComments[];
  userId: string | undefined;
  onAnnotationClick?: (id: string) => void;
  style?: React.CSSProperties;
  className?: string;
  placeholder?: string;
  annotatable?: boolean;
  editMode: boolean;
  selectedAnnotationId: string | undefined;
  setSelectedAnnotationId: (id: string | undefined) => void;
  showAuthorComments: boolean;
  showReaderComments: boolean;
  setFootnoteIds: (ids: string[]) => void;
}

const HTMLSuperEditor = ({
  existingAnnotations,
  userId,
  statement,
  onAnnotationClick,
  style,
  className,
  placeholder,
  annotatable,
  editMode,
  selectedAnnotationId,
  setSelectedAnnotationId,
  showAuthorComments,
  showReaderComments,
  setFootnoteIds,
}: HTMLSuperEditorProps) => {
  const {
    setSelectedNodePosition,
    setCurrentLatex,
    setInitialImageData,
    setCitationData,
    setIsBlock,
    annotations,
    setAnnotations,
    setDebouncedContent,
    setSelectedLatexId,
    setCitationPopoverOpen,
    setImagePopoverOpen,
    setImageLightboxOpen,
    setLatexPopoverOpen,
    latexPopoverOpen,
    imagePopoverOpen,
    debouncedContent,

    visualViewport,
  } = useStatementContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useWindowSize().width < 768;
  const htmlContent = debouncedContent ?? statement.content;
  const draftId = statement.id;
  const statementId = statement.statementId;
  const statementCreatorId = statement.creatorId;
  const citations = statement.citations;

  useEffect(() => {
    setAnnotations(existingAnnotations);
  }, [existingAnnotations, setAnnotations]);

  useEffect(() => {
    const annotationId = searchParams.get('annotation-id');
    if (annotationId && setSelectedAnnotationId) {
      setSelectedAnnotationId(annotationId);

      // Wait for the DOM to update before scrolling
      setTimeout(() => {
        const annotationElement = document.querySelector(`[data-annotation-id="${annotationId}"]`);
        if (annotationElement) {
          annotationElement.scrollIntoView({
            behavior: 'smooth',
            block: isMobile ? 'start' : 'center',
          });
        }
        //
      }, 100);
    }
  }, [searchParams, setSelectedAnnotationId, isMobile]);

  const QuoteHighlight = createQuoteHighlight(() => searchParams);

  // Initialize the Tiptap editor for rich text editing
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {},
        blockquote: {
          HTMLAttributes: {
            class: 'custom-blockquote',
          },
        },
      }),
      Typography,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'prose-link',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      InlineLatex,
      BlockLatex.configure({
        HTMLAttributes: {
          class: 'latex-popover-editor',
        },
      }),
      BlockImage.configure({
        HTMLAttributes: {
          class: 'block-image',
        },
        userId,
        statementId,
        editMode,
        onDelete: async (imageId: string) => {
          try {
            await deleteStatementImage(imageId, statementId, statementCreatorId, {
              path: pathname,
              type: 'layout',
            });
          } catch (error) {
            console.error('Failed to delete image:', error);
          }
        },
      }),
      AnnotationHighlight.configure({
        HTMLAttributes: {
          class: 'annotation',
        },
      }),
      Citation.configure({
        onDelete: async (citationId: string) => {
          try {
            await deleteCitation(citationId, statementCreatorId);
          } catch (error) {
            console.error('Failed to delete citation:', error);
          }
        },
      }),
      QuoteHighlight,
      QuotePasteHandler.configure({
        creatorId: statementCreatorId,
        currentStatementId: statementId,
        handleCitationPaste,
      }),
    ],
    immediatelyRender: false,
    content: htmlContent,
    editable: true,
    onCreate: ({ editor }) => {
      const annotationMarks = getMarks(editor, ['annotationHighlight']);
      const citationNodes = getNodes(editor, ['citation', 'citation-block']);
      const latexNodes = getNodes(editor, ['latex', 'latex-block']);
      const blockImageNodes = getNodes(editor, ['block-image']);

      //  ensure we have DB records for all annotation marks

      ensureAnnotationMarks({
        marks: annotationMarks,
        editor,
        annotations,
        draftId,
        setAnnotations,
      });

      const citationIds = citationNodes.map((node) => node.node.attrs.citationId);
      setFootnoteIds(citationIds);

      // remove any citations from the db that are not in the citationIds array

      if (citations.length > 0 && editMode) {
        ensureCitations({
          citations,
          nodeIds: citationIds,
          statementCreatorId,
        });
      }
    },
    onUpdate: ({ editor, transaction }) => {
      // Only block content updates if they're not annotation-related
      if (transaction.docChanged) {
        const hasAnnotationChanges = transaction.steps.some((step: Step) => {
          const mark = (step as any).mark;
          const annotationId = mark?.attrs?.annotationId;
          if (!annotationId) return false;
          return mark.type.name === 'annotationHighlight';
        });
        if (!editMode && !hasAnnotationChanges) {
          editor.commands.setContent(htmlContent);
          return;
        }

        if (editor.getHTML()) {
          const citationNodes = getNodes(editor, ['citation', 'citation-block']);
          const citationIds = citationNodes.map((node) => node.node.attrs.citationId);
          setFootnoteIds(citationIds);
          const currentHTML = editor.getHTML();

          setDebouncedContent(currentHTML);
        }
      }
    },
    onSelectionUpdate: ({ editor }) => {
      if (!annotatable || !userId) return;
    },
    onDrop: (view, event) => {
      return true;
    },
    onDestroy: () => {
      const container = containerRef.current;
      if (container) {
        container.innerHTML = '';
      }
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        // Block all keyboard input in non-editMode mode except selection shortcuts
        if (!editMode) {
          const isSelectionKey =
            event.key === 'ArrowLeft' ||
            event.key === 'ArrowRight' ||
            event.key === 'ArrowUp' ||
            event.key === 'ArrowDown' ||
            ((event.metaKey || event.ctrlKey) && event.key === 'a') ||
            event.key === 'Home' ||
            event.key === 'End' ||
            event.key === 'PageUp' ||
            event.key === 'PageDown';

          if (isSelectionKey) {
            return false; // Allow selection keys
          }

          event.preventDefault();
          return true; // Block all other keys
        }
        return false;
      },
      handleClick: (view, pos, event) => {
        // Allow clicks for selection in both modes
        return false;
      },
      transformPastedText: (text) => {
        // Prevent pasting in non-editMode mode
        return editMode ? text : '';
      },
      handleDrop: (view, event) => {
        // Block drag and drop in non-editMode mode
        if (!editMode) {
          event?.preventDefault();
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        // Block paste in non-editMode mode
        if (!editMode) {
          event?.preventDefault();
          return true;
        }
        return false;
      },
      attributes: {
        // Add a class to indicate non-editMode mode
        class: !editMode ? 'pseudo-readonly' : '',
      },
      handleDOMEvents: {
        click: (view, event) => {
          const element = event.target as HTMLElement;

          const imageNode = element.closest('img[data-type="block-image"]');
          const citationNode = element.closest(
            '[data-type="citation"], [data-type="citation-block"]'
          );
          let latexNode = element.closest(
            '[data-type="latex"], [data-type="latex-block"], .inline-latex, .latex-block'
          );

          if (!latexNode) {
            const katexElement = element.closest('.katex, .katex-html, .katex-rendered');
            if (katexElement) {
              latexNode = katexElement.closest(
                '[data-type="latex"], [data-type="latex-block"], .inline-latex, .latex-block'
              );
            }
          }

          if (imageNode) {
            if (editMode) {
              const rect = imageNode.getBoundingClientRect();
              openImagePopover({
                src: imageNode.getAttribute('src') || '',
                alt: imageNode.getAttribute('alt') || '',
                id: imageNode.getAttribute('data-image-id') ?? undefined,
                position: {
                  x: rect.left,
                  y: rect.top,
                  width: rect.width,
                  height: rect.height,
                },
                statementImages: statement.images,
                setInitialImageData,
                setSelectedNodePosition,
                setImagePopoverOpen,
                statementId,
              });

              event.preventDefault();
              event.stopPropagation();
              return true;
            } else {
              const id = imageNode.getAttribute('data-image-id');
              if (id) {
                openImageLightbox({
                  id,
                  statementImages: statement.images,
                  setInitialImageData,
                  setImageLightboxOpen,
                });
              }
              event.preventDefault();
              event.stopPropagation();
              return true;
            }
          }

          if (citationNode) {
            const rect = citationNode.getBoundingClientRect();

            const position = {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
            };

            const id = citationNode.getAttribute('data-citation-id');

            if (!id) {
              return;
            }

            const selectedCitation = statement.citations.find(
              (c) => c.id.toString() === id.toString()
            );

            if (!selectedCitation) {
              return;
            }
            const citationData: NewStatementCitation = {
              statementId: selectedCitation.statementId,
              id: selectedCitation.id,
              title: selectedCitation.title,
              url: selectedCitation.url,
              date: selectedCitation.date,
              year: selectedCitation.year,
              month: selectedCitation.month,
              day: selectedCitation.day,
              authorNames: selectedCitation.authorNames,
              issue: selectedCitation.issue,
              pageEnd: selectedCitation.pageEnd,
              pageStart: selectedCitation.pageStart,
              publisher: selectedCitation.publisher,
              titlePublication: selectedCitation.titlePublication,
              volume: selectedCitation.volume,
            };
            openCitationPopover({
              citationData,
              position,
              setCitationData,
              setSelectedNodePosition,
              setCitationPopoverOpen,
            });
            event.preventDefault();
            event.stopPropagation();
            return true;
          }

          // Handle LaTeX clicks only in editMode mode

          if (latexNode && editMode) {
            let id = latexNode.getAttribute('data-id');
            let latex = latexNode.getAttribute('data-latex');

            if (!latex) {
              latex = latexNode.getAttribute('data-original-content');
            }

            if (!latex) {
              const katexWrapper = latexNode.querySelector('.katex-rendered, .katex');
              if (katexWrapper) {
                latex = '';
              } else {
                latex = latexNode.textContent || '';
              }
            }

            const displayMode =
              latexNode.getAttribute('data-display-mode') === 'true' ||
              latexNode.classList.contains('latex-block');

            const rect = latexNode.getBoundingClientRect();
            setSelectedNodePosition({
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
            });

            openLatexPopover({
              latex,
              displayMode,
              latexId: id,
              setCurrentLatex,
              setIsBlock,
              setSelectedLatexId,
              setSelectedNodePosition,
              setLatexPopoverOpen,
            });

            event.preventDefault();
            event.stopPropagation();
            return true;
          }

          // Handle annotation clicks
          const annotationElement = element.closest('.annotation');
          if (annotationElement && onAnnotationClick) {
            const id = annotationElement.getAttribute('data-annotation-id');

            if (id) {
              onAnnotationClick(id);
              event.preventDefault();
              event.stopPropagation();
              return true;
            }
          }

          return false;
        },
      },
    },
  });

  useEffect(() => {
    if (!editor?.isEditable) return;

    const applyAnnotations = () => {
      editor.commands.unsetAnnotationHighlight();
      annotations.forEach((annotation) => {
        if (!annotation.id || !annotation.userId || annotation.start < 0 || annotation.end < 0)
          return;
        editor
          .chain()
          .setTextSelection({ from: annotation.start, to: annotation.end })
          .setAnnotationHighlight({
            annotationId: annotation.id,
            userId: annotation.userId,
            isAuthor: annotation.userId === statementCreatorId,
            createdAt:
              annotation.createdAt instanceof Date
                ? annotation.createdAt.toISOString()
                : String(annotation.createdAt),
            tag: annotation.tag || null,
            selected: annotation.id === selectedAnnotationId,
          })
          .run();
      });
    };

    applyAnnotations();
    editor.commands.setTextSelection({ from: 0, to: 0 });
  }, [editor, annotations, selectedAnnotationId, statementCreatorId]);

  // Add a new effect to update selection state when selectedAnnotationId changes
  useEffect(() => {
    if (!editor) return;

    // Update all annotations to reflect new selection state
    editor.state.doc.descendants((node, pos) => {
      const annotationMark = node.marks.find((mark) => mark.type.name === 'annotationHighlight');

      if (annotationMark) {
        const isSelected = annotationMark.attrs.annotationId === selectedAnnotationId;
        if (isSelected !== annotationMark.attrs.selected) {
          editor
            .chain()
            .setTextSelection({ from: pos, to: pos + node.nodeSize })
            .setAnnotationHighlight({
              ...(annotationMark.attrs as {
                annotationId: string;
                isAuthor: boolean;
                userId: string;
                createdAt?: string | null;
                tag?: string | null;
              }),
              selected: isSelected,
            })
            .run();

          // If this is the selected annotation, scroll it into view
          if (isSelected) {
            // Use setTimeout to ensure the DOM has updated
            setTimeout(() => {
              const annotationElement = document.querySelector(
                `[data-annotation-id="${selectedAnnotationId}"]`
              );
              if (annotationElement) {
                annotationElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });
              }
            }, 100);
          }
        }
      }
      return true;
    });

    // Reset selection after updating
    editor.commands.setTextSelection({ from: 0, to: 0 });
  }, [editor, selectedAnnotationId]);

  useEffect(() => {
    if (!editor) return;
    // Only set content if editor is not editMode or if it's the initial content set
    if (!editor.isEditable || editor.isEmpty) {
      editor.commands.setContent(htmlContent);
    }
  }, [htmlContent, editor]);

  // Reset the editor completely when edit mode changes
  useEffect(() => {
    if (editor) {
      return () => {
        if (editor) {
          // Clean up any pending operations
          editor.commands.clearContent();
        }
      };
    }
  }, [editor, editMode]);

  useEffect(() => {
    if (selectedAnnotationId === undefined) return;

    const params = new URLSearchParams(window.location.search);
    if (selectedAnnotationId) {
      params.set('annotation-id', selectedAnnotationId);
    } else {
      params.delete('annotation-id');
    }

    router.push(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    });
  }, [selectedAnnotationId, router]);

  // Update the location parameter handling effect
  useEffect(() => {
    if (!editor) return;

    const location = searchParams.get('location');
    if (location) {
      const [start, end] = location.split('-').map((pos) => parseInt(pos, 10));
      if (!isNaN(start) && !isNaN(end)) {
        try {
          // Create a decoration for the quoted text
          const view = editor.view;
          const domAtPos = view.domAtPos(start);

          if (domAtPos.node instanceof Node) {
            // Find the closest parent element that we can scroll
            let currentNode: Node | null = domAtPos.node;
            while (currentNode && currentNode.nodeType === Node.TEXT_NODE) {
              currentNode = currentNode.parentElement;
            }

            if (currentNode instanceof HTMLElement) {
              // Scroll into view
              currentNode.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
            }
          }

          // Force a re-render to apply the decoration
          editor.view.dispatch(editor.view.state.tr);

          // Remove the decoration and location parameter after 3 seconds
          setTimeout(() => {
            // Remove the decoration by forcing a re-render
            editor.view.dispatch(editor.view.state.tr);

            // Remove the location parameter from the URL without a page reload
            const newParams = new URLSearchParams(window.location.search);
            newParams.delete('location');
            const newUrl = `${window.location.pathname}${newParams.toString() ? `?${newParams.toString()}` : ''}`;
            window.history.replaceState({}, '', newUrl);
          }, 3000);
        } catch (error) {
          console.error('Error scrolling to location:', error);
        }
      }
    }
  }, [editor, searchParams]);

  return (
    <>
      <div
        className={`mx-auto ${editMode ? 'editMode-container' : 'annotator-container'} ${
          showAuthorComments ? 'show-author-comments' : ''
        } ${showReaderComments ? 'show-reader-comments' : ''} ${className || ''}`}
        style={style}
      >
        <EditorContent
          editor={editor}
          className={`ProseMirror ${annotatable ? 'annotator-container' : ''} 
          ${!editMode ? 'pseudo-readonly' : ''}`}
          spellCheck={editMode}
          inputMode={editMode ? 'text' : 'none'}
          readOnly={!editMode}
        />
        {editor && (
          <>
            <div>
              <CitationNodeEditor
                statementId={statementId}
                creatorId={statementCreatorId}
                editMode={editMode}
                editor={editor}
              />
            </div>
            <AnnotationMenu
              editMode={editMode ?? false}
              draftId={draftId}
              statementCreatorId={statementCreatorId}
              showAuthorComments={showAuthorComments}
              showReaderComments={showReaderComments}
              canAnnotate={annotatable && !!userId}
              setSelectedAnnotationId={setSelectedAnnotationId}
              statementId={statementId}
            />

            {editMode && !latexPopoverOpen && !imagePopoverOpen && (
              <div>
                <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
                  <BlockTypeChooser statementId={statementId} />
                </FloatingMenu>
              </div>
            )}
          </>
        )}
        {editMode && editor && (
          <>
            <div
              className="z-50 mx-auto max-w-full px-2 "
              style={{
                bottom: '1rem',
                height: 'fit-content',
                position: 'fixed',
                ...(visualViewport && {
                  bottom: `${Math.max(16, window.innerHeight - visualViewport)}px`,
                }),
              }}
            >
              <EditorMenu statementId={statementId} editor={editor} />
            </div>
            <LatexNodeEditor />
            <ImageNodeEditor statementId={statementId} statementCreatorId={statementCreatorId} />
          </>
        )}{' '}
      </div>
    </>
  );
};

export default HTMLSuperEditor;
