'use client';

import './prose.css';
import './table.css';

import * as Sentry from '@sentry/nextjs';
import { AnnotationWithComments } from 'kysely-codegen';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useWindowSize } from 'react-use';

import AnnotationPanel from '@/components/statements/annotation/annotation_panel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useEditModeContext } from '@/contexts/EditModeContext';
import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useStatementUpdateContext } from '@/contexts/StatementUpdateProvider';

import { deleteAnnotation } from '@/lib/actions/annotationActions';
import {
  getPanelState,
  minAnnotationPanelSize,
  minEditorPanelSize,
  minStackSize,
  setPanelSizes,
  setPanelState
} from '@/lib/helpers/helpersLayout';
import { groupThreadsByParentId } from '@/lib/helpers/helpersStatements';
import { cn } from '@/lib/utils';

import VerticalCardStack from '../card_stacks/vertical_card_stack';
import EditNav from '../navigation/edit_nav';

import AnnotationDrawer from './annotation/annotation_drawer';
import StatementDetails from './statement_details';
import StatementTopControls from './statement_top_controls';

interface StatementDetailsProps {
  authorCommentsEnabled: boolean;
  readerCommentsEnabled: boolean;
  editModeEnabled: boolean;
  startingPanelSizes: number[];
}

export default function StatementLayout({
  authorCommentsEnabled,
  readerCommentsEnabled,
  editModeEnabled,
  startingPanelSizes
}: StatementDetailsProps) {
  const { statement, parentStatement, thread, isCreator } = useStatementContext();

  const familyTree = groupThreadsByParentId(thread, statement);

  const {
    selectedAnnotationId,
    setSelectedAnnotationId,
    selectedAnnotation,
    setReplyToComment,
    setComments,
    annotations,
    setSelectedAnnotation,
    setAnnotations
  } = useStatementAnnotationContext();

  const router = useRouter();
  const [isMobile, setIsMobile] = useState(useWindowSize().width < 600);
  const [hasMounted, setHasMounted] = useState(false);
  const { editMode, setEditMode } = useEditModeContext();
  const { editor, updatedStatement } = useStatementContext();
  const { updateStatementDraft } = useStatementUpdateContext();

  const [showAnnotationDrawer, setShowAnnotationDrawer] = useState(false);
  const [showAuthorComments, setShowAuthorComments] = useState(authorCommentsEnabled);
  const [showReaderComments, setShowReaderComments] = useState(readerCommentsEnabled);
  const [annotationMode, setAnnotationMode] = useState<boolean>(true);
  const [showAnnotationsButton, setShowAnnotationsButton] = useState(
    !getPanelState('annotation_panel_size').isOpen
  );

  useEffect(() => {
    setIsMobile(window.innerWidth < 600);
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setAnnotationMode(!isMobile);
  }, [isMobile]);

  const handleDeleteAnnotation = async (annotation: AnnotationWithComments) => {
    if (!annotation) return;

    try {
      if (editor) {
        await deleteAnnotation({
          annotationId: annotation.id,
          statementCreatorId: updatedStatement?.creatorId,
          annotationCreatorId: annotation?.userId,
          statementId: updatedStatement.statementId
        });

        editor.commands.deleteAnnotationHighlight(annotation.id);
        setAnnotations((prevAnnotations: AnnotationWithComments[]) =>
          prevAnnotations.filter(a => a.id !== annotation.id)
        );
        await updateStatementDraft();
      } else {
        throw new Error('Editor not found');
      }
      setSelectedAnnotationId(undefined);
    } catch (error) {
      console.error('Error deleting annotation:', error);
      Sentry.captureException(error);
    }
  };

  useEffect(() => {
    setEditMode(editModeEnabled && isCreator);
  }, [editModeEnabled, setEditMode, isCreator]);

  useEffect(() => {
    if (!!editMode || !!annotationMode) {
      editor?.setEditable(true);
    }
  }, [editMode, annotationMode, editor]);

  useEffect(() => {
    if (selectedAnnotationId) {
      setShowAnnotationDrawer(true);
    }
  }, [selectedAnnotationId]);

  const panelGroupRef = useRef<React.ElementRef<typeof ResizablePanelGroup>>(null);

  useEffect(() => {
    setPanelSizes(panelGroupRef);
  });

  const handleCloseAnnotationPanel = () => {
    setSelectedAnnotationId(undefined);
    setReplyToComment(null);
    setComments([]);
    setSelectedAnnotation(null);
    setShowAnnotationsButton(true);
    setPanelState({
      target: 'annotation_panel_size',
      isOpen: false,
      panelGroupRef
    });
    const newUrl = `${window.location.pathname}`;
    router.replace(newUrl, { scroll: false });
  };

  const handleToggleStack = () => {
    const { size: savedStackSize, isOpen: savedStackOpen } = getPanelState('stack_panel_size');
    setPanelState({
      target: 'stack_panel_size',
      isOpen: !savedStackOpen,
      size: savedStackSize,
      panelGroupRef
    });
  };

  const handleOpenComments = () => {
    const { size: savedAnnotationPanelSize, isOpen: savedAnnotationPanelOpen } =
      getPanelState('annotation_panel_size');
    if (!savedAnnotationPanelOpen) {
      setShowAnnotationsButton(false);
      setPanelState({
        target: 'annotation_panel_size',
        isOpen: true,
        size: savedAnnotationPanelSize,
        panelGroupRef
      });
    }
  };

  const handleCloseAnnotationDrawer = () => {
    if (!!editMode || !!annotationMode) {
      editor?.setEditable(true);
    }
    setShowAnnotationDrawer(false);
    handleCloseAnnotationPanel();
  };

  const onLayout = (layout: number[]) => {
    if (layout[0] > 0) {
      setPanelState({ target: 'stack_panel_size', isOpen: true, size: layout[0], panelGroupRef });
    } else {
      setPanelState({ target: 'stack_panel_size', isOpen: false, panelGroupRef });
    }
    if (layout[2] > 0) {
      setPanelState({
        target: 'annotation_panel_size',
        isOpen: true,
        size: layout[2],
        panelGroupRef
      });
    } else {
      setPanelState({ target: 'annotation_panel_size', isOpen: false, panelGroupRef });
    }
  };

  const onShowAuthorCommentsChange = (checked: boolean) => {
    setShowAuthorComments(checked);
    if (!checked) {
      setSelectedAnnotationId(undefined);
    }
    document.cookie = `show_author_comments=${checked.toString()}`;
  };

  const onShowReaderCommentsChange = (checked: boolean) => {
    setShowReaderComments(checked);
    if (!checked) {
      setSelectedAnnotationId(undefined);
    }
    document.cookie = `show_reader_comments=${checked.toString()}`;
  };

  //useMemo ??

  const filteredAnnotations = annotations.filter(annotation => {
    if (showAuthorComments && showReaderComments) {
      return true;
    } else if (showAuthorComments) {
      return annotation.userId === updatedStatement.creatorId;
    } else if (showReaderComments) {
      return annotation.userId !== updatedStatement.creatorId;
    }
  }) as AnnotationWithComments[];

  const handleAnnotationSelection = (annotationId: string) => {
    setSelectedAnnotationId(annotationId);
    setReplyToComment(null);
    const params = new URLSearchParams(window.location.search);
    //create fresh params
    params.set('annotation-id', annotationId);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    // Use replaceState to avoid adding to history
    if (newUrl !== `${window.location.pathname}${window.location.search}`) {
      router.replace(newUrl, { scroll: false });
    }
  };

  const mobileLayout = (
    <div className="">
      <StatementDetails
        parentStatement={parentStatement}
        editMode={editMode && isCreator}
        showAuthorComments={showAuthorComments}
        showReaderComments={showReaderComments}
        handleOpenComments={handleOpenComments}
        onShowAuthorCommentsChange={onShowAuthorCommentsChange}
        onShowReaderCommentsChange={onShowReaderCommentsChange}
        panelGroupRef={panelGroupRef}
        annotationMode={annotationMode}
        setAnnotationMode={setAnnotationMode}
        familyTree={familyTree}
      />
      <AnnotationDrawer
        showAnnotationDrawer={showAnnotationDrawer}
        handleCloseAnnotationDrawer={handleCloseAnnotationDrawer}
        filteredAnnotations={filteredAnnotations}
        handleAnnotationSelection={handleAnnotationSelection}
        annotations={annotations}
        statement={{
          statementId: updatedStatement.statementId,
          creatorId: updatedStatement.creatorId
        }}
        selectedAnnotation={selectedAnnotation}
        handleDeleteAnnotation={handleDeleteAnnotation}
      />
    </div>
  );

  const desktopLayout = (
    <ResizablePanelGroup direction="horizontal" ref={panelGroupRef} onLayout={onLayout}>
      <ResizablePanel
        id="card-stack"
        defaultSize={familyTree.hasPosts ? startingPanelSizes[0] : 0}
        minSize={minStackSize}
        maxSize={30}
        collapsible={true}
        className="hidden md:block relative bg-gray-50 "
      >
        <div className="relative w-full h-full">
          <div className="absolute top-1/4 p-4 w-full">
            <VerticalCardStack
              familyTree={familyTree}
              currentTitle={updatedStatement?.title || ''}
              currentStatementId={updatedStatement.statementId}
              currentThreadId={updatedStatement.threadId}
            />
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel id="editor" defaultSize={startingPanelSizes[1]} minSize={minEditorPanelSize}>
        <div className=" flex flex-col overflow-y-auto h-full ">
          <StatementTopControls
            handleToggleStack={handleToggleStack}
            handleOpenComments={handleOpenComments}
            showAnnotationsButton={showAnnotationsButton}
          />

          <StatementDetails
            parentStatement={parentStatement}
            editMode={editMode && isCreator}
            showAuthorComments={showAuthorComments}
            showReaderComments={showReaderComments}
            handleOpenComments={handleOpenComments}
            onShowAuthorCommentsChange={onShowAuthorCommentsChange}
            onShowReaderCommentsChange={onShowReaderCommentsChange}
            panelGroupRef={panelGroupRef}
            annotationMode={annotationMode}
            setAnnotationMode={setAnnotationMode}
            familyTree={familyTree}
          />
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        id="annotation-panel"
        defaultSize={startingPanelSizes[2]}
        minSize={minAnnotationPanelSize}
        collapsible={true}
      >
        <div className="overflow-y-auto h-full  ">
          {annotations && (
            <AnnotationPanel
              statementId={updatedStatement.statementId}
              statementCreatorId={updatedStatement.creatorId}
              handleCloseAnnotationPanel={handleCloseAnnotationPanel}
              filteredAnnotations={filteredAnnotations}
              handleAnnotationSelection={handleAnnotationSelection}
              handleDeleteAnnotation={handleDeleteAnnotation}
            />
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );

  if (!hasMounted) {
    // Always render the desktop layout on the server and during hydration
    return (
      <div className={cn('flex flex-col h-full w-full ', editMode && 'bg-gray-50')}>
        {editMode ? <EditNav /> : <></>}
        {desktopLayout}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full w-full ', editMode && 'bg-gray-50')}>
      {editMode ? <EditNav /> : <></>}
      {!isMobile ? desktopLayout : mobileLayout}
    </div>
  );
}
