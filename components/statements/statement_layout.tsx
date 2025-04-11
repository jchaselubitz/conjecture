'use client';

import './prose.css';
import { BaseDraft, DraftWithAnnotations } from 'kysely-codegen';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useWindowSize } from 'react-use';
import AnnotationPanel from '@/components/statements/annotation/annotation_panel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useStatementAnnotationContext } from '@/contexts/StatementAnnotationContext';
import { useStatementContext } from '@/contexts/statementContext';
import { useUserContext } from '@/contexts/userContext';

import AppNav from '../navigation/app_nav';
import EditNav from '../navigation/edit_nav';
import { Drawer, DrawerContent, DrawerTitle } from '../ui/drawer';
import CommentInput from './annotation/comment_input';
import StatementDetails from './statement_details';
interface StatementDetailsProps {
  statement: DraftWithAnnotations;
  authorCommentsEnabled: boolean;
  readerCommentsEnabled: boolean;
  editModeEnabled: boolean;
  parentStatement: BaseDraft | null;
}

export default function StatementLayout({
  statement,
  authorCommentsEnabled,
  readerCommentsEnabled,
  editModeEnabled,
  parentStatement
}: StatementDetailsProps) {
  const { userId } = useUserContext();
  const { visualViewport, setVisualViewport } = useStatementContext();
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
  const [editMode, setEditMode] = useState(editModeEnabled);
  const router = useRouter();
  useEffect(() => {
    setEditMode(editModeEnabled);
  }, [editModeEnabled]);

  const [showAnnotationDrawer, setShowAnnotationDrawer] = useState(false);
  const isCreator = statement.creatorId === userId;
  const isMobile = useWindowSize().width < 768;

  const { annotations } = statement;

  const panelGroupRef = useRef<React.ElementRef<typeof ResizablePanelGroup>>(null);

  // Add effect to handle viewport changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const handleResize = () => {
      setVisualViewport(window.visualViewport?.height ?? null);
    };
    window.visualViewport.addEventListener('resize', handleResize);
    handleResize(); // Initial measurement
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, [setVisualViewport]);

  const drawerStyle = visualViewport
    ? { height: `${visualViewport * 0.7}px` }
    : { height: '70dvh' };

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

  const mobileLayout = (
    <div className="">
      <StatementDetails
        statement={statement}
        parentStatement={parentStatement}
        editMode={editMode && isCreator}
        showAuthorComments={showAuthorComments}
        showReaderComments={showReaderComments}
        onShowAuthorCommentsChange={onShowAuthorCommentsChange}
        onShowReaderCommentsChange={onShowReaderCommentsChange}
        panelGroupRef={panelGroupRef}
      />
      <Drawer open={showAnnotationDrawer} onOpenChange={handleCloseAnnotationDrawer}>
        <DrawerContent style={drawerStyle} className="p-0 ">
          <DrawerTitle className="sr-only">Comments</DrawerTitle>
          {annotations && (
            <div className="relative h-full overflow-y-auto w-full">
              <AnnotationPanel
                statementId={statement.statementId}
                statementCreatorId={statement.creatorId}
                handleCloseAnnotationPanel={handleCloseAnnotationDrawer}
                showAuthorComments={showAuthorComments}
                showReaderComments={showReaderComments}
              />
            </div>
          )}
          <div className="sticky bottom-0 w-full mx-auto px-2 justify-center ">
            {selectedAnnotation && (
              <CommentInput
                annotation={selectedAnnotation}
                replyToComment={replyToComment}
                onCancelReply={cancelReply}
                setComments={setComments}
                setReplyToComment={setReplyToComment}
                cancelReply={cancelReply}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );

  const desktopLayout = (
    <ResizablePanelGroup direction="horizontal" ref={panelGroupRef} onLayout={onLayout}>
      <ResizablePanel id="editor" defaultSize={100} minSize={60}>
        <div className=" flex flex-col overflow-y-auto h-full">
          <StatementDetails
            statement={statement}
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
        <div className="overflow-y-auto h-full">
          {annotations && (
            <AnnotationPanel
              statementId={statement.statementId}
              statementCreatorId={statement.creatorId}
              handleCloseAnnotationPanel={handleCloseAnnotationPanel}
              showAuthorComments={showAuthorComments}
              showReaderComments={showReaderComments}
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
