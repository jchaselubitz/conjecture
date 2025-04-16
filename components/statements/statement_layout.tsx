'use client';

import './prose.css';
import { AnnotationWithComments, BaseDraft, DraftWithAnnotations } from 'kysely-codegen';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useWindowSize } from 'react-use';
import AnnotationPanel from '@/components/statements/annotation/annotation_panel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';
import { useStatementContext } from '@/contexts/StatementBaseContext';
import { useUserContext } from '@/contexts/userContext';

import AppNav from '../navigation/app_nav';
import EditNav from '../navigation/edit_nav';
import ReadNav from '../navigation/read_nav';
import AnnotationDrawer from './annotation/annotation_drawer';
import StatementDetails from './statement_details';
interface StatementDetailsProps {
  statement: DraftWithAnnotations;
  authorCommentsEnabled: boolean;
  readerCommentsEnabled: boolean;
  editModeEnabled: boolean;
  parentStatement: BaseDraft | null;
}

export default function StatementLayout({
  authorCommentsEnabled,
  readerCommentsEnabled,
  editModeEnabled,
  parentStatement
}: StatementDetailsProps) {
  const { userId } = useUserContext();

  const {
    selectedAnnotationId,
    setSelectedAnnotationId,
    selectedAnnotation,
    replyToComment,
    cancelReply,
    setReplyToComment,
    setComments,
    setSelectedAnnotation
  } = useStatementAnnotationContext();

  const router = useRouter();
  const isMobile = useWindowSize().width < 600;

  const { editor, updatedStatement } = useStatementContext();
  const [annotationMode, setAnnotationMode] = useState<boolean>(!isMobile);
  const [editMode, setEditMode] = useState(editModeEnabled);

  useEffect(() => {
    setEditMode(editModeEnabled);
  }, [editModeEnabled, setEditMode]);

  useEffect(() => {
    if (!!editMode || !!annotationMode) {
      if (!isMobile) {
        editor?.setEditable(true);
      }
    }
  }, [editMode, annotationMode, editor, isMobile]);

  const [showAnnotationDrawer, setShowAnnotationDrawer] = useState(false);
  const isCreator = updatedStatement.creatorId === userId;

  const { annotations } = updatedStatement;

  const panelGroupRef = useRef<React.ElementRef<typeof ResizablePanelGroup>>(null);

  // Add effect to handle viewport changes

  const [showAuthorComments, setShowAuthorComments] = useState(authorCommentsEnabled);
  const [showReaderComments, setShowReaderComments] = useState(readerCommentsEnabled);

  useEffect(() => {
    if (selectedAnnotationId) {
      setShowAnnotationDrawer(true);
    }
  }, [selectedAnnotationId]);

  useEffect(() => {
    const savedSizeString = localStorage.getItem('annotationPanelSize');
    const savedSize = savedSizeString ? JSON.parse(savedSizeString) : null;
    panelGroupRef.current?.setLayout(savedSize ?? [100, 0]);
  }, []);

  const handleCloseAnnotationPanel = () => {
    setSelectedAnnotationId(undefined);
    setReplyToComment(null);
    setComments([]);
    setSelectedAnnotation(null);
    panelGroupRef.current?.setLayout([100, 0]);
    const newUrl = `${window.location.pathname}`;
    router.replace(newUrl, { scroll: false });
    localStorage.removeItem('annotationPanelSize');
  };

  const handleCloseAnnotationDrawer = () => {
    if (!!editMode || !!annotationMode) {
      editor?.setEditable(true);
    }

    setShowAnnotationDrawer(false);
    handleCloseAnnotationPanel();
  };

  const onLayout = (layout: number[]) => {
    if (layout[0] < 85) {
      localStorage.setItem('annotationPanelSize', JSON.stringify(layout));
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

  const filteredAnnotations = annotations.filter((annotation) => {
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
      />
      <AnnotationDrawer
        showAnnotationDrawer={showAnnotationDrawer}
        handleCloseAnnotationDrawer={handleCloseAnnotationDrawer}
        filteredAnnotations={filteredAnnotations}
        handleAnnotationSelection={handleAnnotationSelection}
        annotations={annotations}
        statement={updatedStatement}
        selectedAnnotation={selectedAnnotation}
        replyToComment={replyToComment}
        cancelReply={cancelReply}
        setComments={setComments}
        setReplyToComment={setReplyToComment}
      />
    </div>
  );

  const desktopLayout = (
    <ResizablePanelGroup direction="horizontal" ref={panelGroupRef} onLayout={onLayout}>
      <ResizablePanel id="editor" defaultSize={100} minSize={60}>
        <div className=" flex flex-col overflow-y-auto h-full">
          <StatementDetails
            parentStatement={parentStatement}
            editMode={editMode && isCreator}
            showAuthorComments={showAuthorComments}
            showReaderComments={showReaderComments}
            onShowAuthorCommentsChange={onShowAuthorCommentsChange}
            onShowReaderCommentsChange={onShowReaderCommentsChange}
            panelGroupRef={panelGroupRef}
          />
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel id="annotation-panel" defaultSize={0}>
        <div className="overflow-y-auto h-full  ">
          {annotations && (
            <AnnotationPanel
              statementId={updatedStatement.statementId}
              statementCreatorId={updatedStatement.creatorId}
              handleCloseAnnotationPanel={handleCloseAnnotationPanel}
              filteredAnnotations={filteredAnnotations}
              handleAnnotationSelection={handleAnnotationSelection}
            />
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );

  return (
    <div className="flex flex-col h-full w-full">
      {editMode ? (
        <EditNav />
      ) : (
        <>
          <AppNav />
          <ReadNav annotationMode={annotationMode} setAnnotationMode={setAnnotationMode} />
        </>
      )}

      {isMobile ? mobileLayout : desktopLayout}
    </div>
  );
}
