'use client';

import './prose.css';
import { BaseDraft, DraftWithAnnotations } from 'kysely-codegen';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useWindowSize } from 'react-use';
import AnnotationPanel from '@/components/statements/annotation_panel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useUserContext } from '@/contexts/userContext';

import AppNav from '../navigation/app_nav';
import EditNav from '../navigation/edit_nav';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '../ui/drawer';
import { CommentIndicatorButton } from './comments_menu';
import StatementDetails from './statement_details';
import { useStatementContext } from '@/contexts/statementContext';
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
  parentStatement,
}: StatementDetailsProps) {
  const { userId } = useUserContext();
  const { visualViewport, setVisualViewport } = useStatementContext();
  const [editMode, setEditMode] = useState(editModeEnabled);

  useEffect(() => {
    setEditMode(editModeEnabled);
  }, [editModeEnabled]);

  // const newUserWithAnnotation = useMemo(() => {
  //   return userId && statement.annotations.length > 0;
  // }, [userId, statement.annotations]);

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
  }, []);

  const drawerStyle = visualViewport
    ? { height: `${visualViewport * 0.7}px` }
    : { height: '70dvh' };

  const [showAuthorComments, setShowAuthorComments] = useState(authorCommentsEnabled);
  const [showReaderComments, setShowReaderComments] = useState(readerCommentsEnabled);

  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (selectedAnnotationId) {
      setShowAnnotationDrawer(true);
    }
  }, [selectedAnnotationId]);

  useEffect(() => {
    const savedSizeString = localStorage.getItem('annotationPanelSize');
    const savedSize = savedSizeString ? JSON.parse(savedSizeString) : null;
    panelGroupRef.current?.setLayout(savedSize ?? [100, 0]);
  }, [setSelectedAnnotationId]);

  const handleCloseAnnotationPanel = () => {
    setSelectedAnnotationId(undefined);
    panelGroupRef.current?.setLayout([100, 0]);
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
    <div className="h-full">
      <StatementDetails
        statement={statement}
        parentStatement={parentStatement}
        editMode={editMode && isCreator}
        showAuthorComments={showAuthorComments}
        showReaderComments={showReaderComments}
        onShowAuthorCommentsChange={onShowAuthorCommentsChange}
        onShowReaderCommentsChange={onShowReaderCommentsChange}
        setSelectedAnnotationId={setSelectedAnnotationId}
        selectedAnnotationId={selectedAnnotationId}
        panelGroupRef={panelGroupRef}
      />
      <Drawer open={showAnnotationDrawer} onOpenChange={handleCloseAnnotationDrawer}>
        <DrawerContent style={drawerStyle}>
          <DrawerHeader>
            <DrawerTitle className="sr-only">Comments</DrawerTitle>
            {/* <DrawerTitle>
              <CommentIndicatorButton
                showAuthorComments={showAuthorComments}
                showReaderComments={showReaderComments}
                onShowAuthorCommentsChange={onShowAuthorCommentsChange}
                onShowReaderCommentsChange={onShowReaderCommentsChange}
              />
            </DrawerTitle> */}
          </DrawerHeader>

          {annotations && (
            <div className="h-full overflow-y-auto">
              <AnnotationPanel
                annotations={annotations}
                statementId={statement.statementId}
                statementCreatorId={statement.creatorId}
                handleCloseAnnotationPanel={handleCloseAnnotationPanel}
                selectedAnnotationId={selectedAnnotationId}
                setSelectedAnnotationId={setSelectedAnnotationId}
                showAuthorComments={showAuthorComments}
                showReaderComments={showReaderComments}
              />
            </div>
          )}
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
            setSelectedAnnotationId={setSelectedAnnotationId}
            selectedAnnotationId={selectedAnnotationId}
            panelGroupRef={panelGroupRef}
          />
        </div>
      </ResizablePanel>
      <ResizableHandle />

      <ResizablePanel id="annotation-panel" defaultSize={0}>
        <div className="overflow-y-auto h-full">
          {annotations && (
            <AnnotationPanel
              annotations={annotations}
              statementId={statement.statementId}
              statementCreatorId={statement.creatorId}
              handleCloseAnnotationPanel={handleCloseAnnotationPanel}
              selectedAnnotationId={selectedAnnotationId}
              setSelectedAnnotationId={setSelectedAnnotationId}
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
