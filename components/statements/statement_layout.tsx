"use client";

import { DraftWithAnnotations } from "kysely-codegen";
import { useEffect, useRef, useState } from "react";
import AnnotationPanel from "@/components/statements/annotation_panel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import AppNav from "../navigation/app_nav";
import EditNav from "../navigation/edit_nav";
import StatementDetails from "./statement_details";

interface StatementDetailsProps {
  statement: DraftWithAnnotations;
  authorCommentsEnabled: boolean;
  readerCommentsEnabled: boolean;
  editModeEnabled: boolean;
}

export default function StatementLayout({
  statement,
  authorCommentsEnabled,
  readerCommentsEnabled,
  editModeEnabled,
}: StatementDetailsProps) {
  const [editMode, setEditMode] = useState(editModeEnabled);

  const { annotations } = statement;

  const panelGroupRef =
    useRef<React.ElementRef<typeof ResizablePanelGroup>>(null);

  const [showAuthorComments, setShowAuthorComments] = useState(
    authorCommentsEnabled,
  );
  const [showReaderComments, setShowReaderComments] = useState(
    readerCommentsEnabled,
  );

  const [selectedAnnotationId, setSelectedAnnotationId] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    const savedSizeString = localStorage.getItem("annotationPanelSize");
    const savedSize = savedSizeString ? JSON.parse(savedSizeString) : null;
    panelGroupRef.current?.setLayout(savedSize ?? [100, 0]);
  }, [setSelectedAnnotationId]);

  const handleCloseAnnotationPanel = () => {
    setSelectedAnnotationId(undefined);
    panelGroupRef.current?.setLayout([100, 0]);
    localStorage.removeItem("annotationPanelSize");
  };

  const onLayout = (layout: number[]) => {
    if (layout[0] < 85) {
      localStorage.setItem("annotationPanelSize", JSON.stringify(layout));
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

  return (
    <div className="flex flex-col h-full">
      {editMode ? <EditNav /> : <AppNav />}
      <ResizablePanelGroup
        direction="horizontal"
        ref={panelGroupRef}
        onLayout={onLayout}
      >
        <ResizablePanel id="editor" defaultSize={100} minSize={60}>
          <div className="flex flex-col overflow-y-auto h-full">
            <StatementDetails
              statement={statement}
              editMode={editMode}
              showAuthorComments={showAuthorComments}
              showReaderComments={showReaderComments}
              setEditMode={setEditMode}
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
    </div>
  );
}
// const titleInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     const handleResize = () => {
//       if (titleInputRef.current) {
//         const input = titleInputRef.current;
//         const parentWidth = input.parentElement?.offsetWidth || 0;
//         let fontSize = parseInt(window.getComputedStyle(input).fontSize, 10);

//         while (input.scrollWidth > parentWidth && fontSize > 10) {
//           fontSize -= 1;
//           input.style.fontSize = `${fontSize}px`;
//         }
//       }
//     };

//     handleResize(); // Initial call to set the font size

//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, [statementUpdate]);
