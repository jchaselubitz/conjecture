"use client";

import { DraftWithAnnotations } from "kysely-codegen";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AnnotationPanel from "@/components/statements/annotation_panel";
import RichTextDisplay from "@/components/statements/rich_text_display";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import Byline from "./byline";
interface StatementDetailsProps {
  drafts: DraftWithAnnotations[];
}

export default function StatementDetails({ drafts }: StatementDetailsProps) {
  const panelGroupRef =
    useRef<React.ElementRef<typeof ResizablePanelGroup>>(null);

  const [selectedAnnotationId, setSelectedAnnotationId] = useState<
    string | undefined
  >(undefined);

  if (!drafts) {
    return <div>No drafts found</div>;
  }

  const statement =
    drafts.find((draft) => draft.publishedAt !== null) ??
    drafts[drafts.length - 1];

  const { title, subtitle, content, versionNumber, annotations } = statement;

  useEffect(() => {
    const savedSize = localStorage.getItem("annotationPanelSize");
    panelGroupRef.current?.setLayout(
      savedSize ? JSON.parse(savedSize) : [100, 0]
    );
    const savedSelectedAnnotationId = localStorage.getItem(
      "selectedAnnotationId"
    );

    setSelectedAnnotationId(savedSelectedAnnotationId ?? undefined);
  }, [panelGroupRef.current]);

  const handleAnnotationClick = async (annotationId: string) => {
    setSelectedAnnotationId(annotationId);
    const savedSize = localStorage.getItem("annotationPanelSize");
    const size = JSON.parse(savedSize ?? "[67,33]");
    panelGroupRef.current?.setLayout(size);
    localStorage.setItem("selectedAnnotationId", annotationId);
    localStorage.setItem("annotationPanelSize", JSON.stringify(savedSize));
  };

  const handleCloseAnnotationPanel = () => {
    setSelectedAnnotationId(undefined);
    panelGroupRef.current?.setLayout([100, 0]);
    localStorage.removeItem("annotationPanelSize");
  };

  const onLayout = (layout: number[]) => {
    if (layout[0] !== 100) {
      localStorage.setItem("annotationPanelSize", JSON.stringify(layout));
    }
  };

  return (
    <div className="flex flex-col ">
      {content && (
        <ResizablePanelGroup
          direction="horizontal"
          ref={panelGroupRef}
          onLayout={onLayout}
        >
          <ResizablePanel id="editor" defaultSize={100} minSize={60}>
            <div className="flex flex-col mt-12 gap-6 mx-auto max-w-4xl">
              <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold mb-4">{title}</h1>

                <Link
                  href={`/statements/${statement.statementId}/edit?version=${versionNumber}`}
                >
                  <Button variant="outline">Edit</Button>
                </Link>
              </div>
              <h2 className="text-xl font-medium  text-zinc-600">{subtitle}</h2>
              <Byline statement={statement} />
              <RichTextDisplay
                htmlContent={content}
                draftId={statement.id}
                statementId={statement.statementId}
                annotations={annotations}
                handleAnnotationClick={handleAnnotationClick}
                statementCreatorId={statement.creatorId}
                selectedAnnotationId={selectedAnnotationId}
                setSelectedAnnotationId={setSelectedAnnotationId}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle />

          <ResizablePanel id="annotation-panel" defaultSize={0}>
            {annotations && (
              <AnnotationPanel
                annotations={annotations}
                statementId={statement.statementId}
                statementCreatorId={statement.creatorId}
                handleCloseAnnotationPanel={handleCloseAnnotationPanel}
                selectedAnnotationId={selectedAnnotationId}
                setSelectedAnnotationId={setSelectedAnnotationId}
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}
