'use client';

import './prose.css';

import * as Sentry from '@sentry/nextjs';
import {
  AnnotationWithComments,
  BaseDraft,
  DraftWithAnnotations,
  DraftWithUser
} from 'kysely-codegen';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useWindowSize } from 'react-use';

import AnnotationPanel from '@/components/statements/annotation/annotation_panel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useStatementUpdateContext } from '@/contexts/StatementUpdateProvider';
import { useUserContext } from '@/contexts/userContext';
import { deleteAnnotation } from '@/lib/actions/annotationActions';
import { getPanelSizeNumber } from '@/lib/helpers/helpersLayout';
import { groupThreadsByParentId } from '@/lib/helpers/helpersStatements';

import VerticalCardStack from '../card_stacks/vertical_card_stack';
import AppNav from '../navigation/app_nav';
import EditNav from '../navigation/edit_nav';

import AnnotationDrawer from './annotation/annotation_drawer';
import StatementDetails from './statement_details';

interface StatementDetailsProps {
  statement: DraftWithAnnotations;
  authorCommentsEnabled: boolean;
  readerCommentsEnabled: boolean;
  editModeEnabled: boolean;
  parentStatement: DraftWithUser | null | undefined;
  thread: DraftWithUser[];
}

export default function StatementLayout({
  authorCommentsEnabled,
  readerCommentsEnabled,
  editModeEnabled,
  parentStatement,
  thread
}: StatementDetailsProps) {
  const { userId } = useUserContext();
  const { statement } = useStatementContext();

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
  const isMobile = useWindowSize().width < 600;

  const [editMode, setEditMode] = useState(editModeEnabled);
  const { editor, updatedStatement } = useStatementContext();
  const { updateStatementDraft } = useStatementUpdateContext();

  const [showAnnotationDrawer, setShowAnnotationDrawer] = useState(false);
  const isCreator = updatedStatement.creatorId === userId;
  const [showAuthorComments, setShowAuthorComments] = useState(authorCommentsEnabled);
  const [showReaderComments, setShowReaderComments] = useState(readerCommentsEnabled);
  const [annotationMode, setAnnotationMode] = useState<boolean>(!isMobile);

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
    setEditMode(editModeEnabled);
  }, [editModeEnabled, setEditMode]);

  useEffect(() => {
    if (!!editMode || !!annotationMode) {
      editor?.setEditable(true);
    }
  }, [editMode, annotationMode, editor, isMobile]);

  useEffect(() => {
    if (selectedAnnotationId) {
      setShowAnnotationDrawer(true);
    }
  }, [selectedAnnotationId]);

  const panelGroupRef = useRef<React.ElementRef<typeof ResizablePanelGroup>>(null);

  useEffect(() => {
    const savedStackSize = getPanelSizeNumber('stack_panel_size');
    const savedAnnotationPanelSize = getPanelSizeNumber('annotation_panel_size');

    const calculatedPrimaryPanelSize =
      100 - (savedStackSize ?? 0) - (savedAnnotationPanelSize ?? 0);

    const panelSizes = [
      savedAnnotationPanelSize ?? 0,
      calculatedPrimaryPanelSize ?? 70,
      savedStackSize ?? 30
    ];
    panelGroupRef.current?.setLayout(panelSizes);
  });

  const handleCloseAnnotationPanel = () => {
    const currentLayout = panelGroupRef.current?.getLayout();
    setSelectedAnnotationId(undefined);
    setReplyToComment(null);
    setComments([]);
    setSelectedAnnotation(null);
    const currentStackSize = currentLayout?.[0] ?? 30;
    const calculatedPrimaryPanelSize = 100 - (currentStackSize ?? 0);

    panelGroupRef.current?.setLayout([currentStackSize, calculatedPrimaryPanelSize, 0]);
    const newUrl = `${window.location.pathname}`;
    router.replace(newUrl, { scroll: false });
  };

  const handleToggleStack = () => {
    const savedStackSize = getPanelSizeNumber('stack_panel_size');
    const currentLayout = panelGroupRef.current?.getLayout();
    const calculatedPrimaryPanelSize = 100 - (savedStackSize ?? 0);

    if (currentLayout?.[0] === 0) {
      panelGroupRef.current?.setLayout([savedStackSize ?? 30, calculatedPrimaryPanelSize ?? 70, 0]);
    } else {
      panelGroupRef.current?.setLayout([0, currentLayout?.[1] ?? 100, currentLayout?.[2] ?? 0]);
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
      localStorage.setItem('stack_panel_size', JSON.stringify(layout[0]));
    }
    if (layout[2] > 0) {
      localStorage.setItem('annotation_panel_size', JSON.stringify(layout[2]));
    }
    // panelGroupRef.current?.setLayout([layout[0], layout[1], layout[2]]);
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
        statement={updatedStatement}
        selectedAnnotation={selectedAnnotation}
        handleDeleteAnnotation={handleDeleteAnnotation}
      />
    </div>
  );

  const desktopLayout = (
    <ResizablePanelGroup direction="horizontal" ref={panelGroupRef} onLayout={onLayout}>
      <ResizablePanel
        id="card-stack"
        defaultSize={20}
        minSize={20}
        collapsible={true}
        className="hidden md:block relative bg-gray-50 "
      >
        <div className="relative w-full h-full">
          {/* add a sidebar button that collapses this resizable panel */}

          <div className="absolute top-1/4 p-4 w-full">
            <VerticalCardStack
              familyTree={familyTree}
              currentTitle={updatedStatement?.title || ''}
            />
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel id="editor" defaultSize={100} minSize={60}>
        <div className=" flex flex-col overflow-y-auto h-full">
          <StatementDetails
            parentStatement={parentStatement}
            handleToggleStack={handleToggleStack}
            editMode={editMode && isCreator}
            showAuthorComments={showAuthorComments}
            showReaderComments={showReaderComments}
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
      <ResizablePanel id="annotation-panel" defaultSize={0} collapsible={true}>
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

  return (
    <div className="flex flex-col h-full w-full">
      {editMode ? <EditNav /> : <AppNav />}

      {isMobile ? mobileLayout : desktopLayout}
    </div>
  );
}
