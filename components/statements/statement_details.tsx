"use client";

import { DraftWithAnnotations } from "kysely-codegen";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AnnotationPanel from "@/components/statements/annotation_panel";
import RichTextDisplay from "@/components/statements/rich_text_display";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Switch } from "@/components/ui/switch";
import { useUserContext } from "@/contexts/userContext";

import Byline from "./byline";
interface StatementDetailsProps {
  drafts: DraftWithAnnotations[];
  authorCommentsEnabled: boolean;
  readerCommentsEnabled: boolean;
}

export default function StatementDetails({
  drafts,
  authorCommentsEnabled,
  readerCommentsEnabled,
}: StatementDetailsProps) {
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

  const { userId } = useUserContext();

  useEffect(() => {
    const savedSizeString = localStorage.getItem("annotationPanelSize");
    const savedSize = savedSizeString ? JSON.parse(savedSizeString) : null;
    panelGroupRef.current?.setLayout(savedSize ?? [100, 0]);
    const savedSelectedAnnotationId = localStorage.getItem(
      "selectedAnnotationId",
    );
    setSelectedAnnotationId(savedSelectedAnnotationId ?? undefined);
  }, [setSelectedAnnotationId]);

  if (!drafts) {
    return <div>No drafts found</div>;
  }

  const statement =
    drafts.find((draft) => draft.publishedAt !== null) ??
    drafts[drafts.length - 1];

  const { title, subtitle, content, versionNumber, annotations } = statement;

  const handleAnnotationClick = async (annotationId: string) => {
    console.log("annotationId", annotationId);
    setSelectedAnnotationId(annotationId);
    const savedSizeString = localStorage.getItem("annotationPanelSize");
    const savedSize = savedSizeString ? JSON.parse(savedSizeString) : null;
    panelGroupRef.current?.setLayout(savedSize ?? [67, 33]);
    localStorage.setItem("selectedAnnotationId", annotationId);
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

  const onShowAuthorCommentsChange = (checked: boolean) => {
    setShowAuthorComments(checked);
    document.cookie = `show_author_comments=${checked.toString()}`;
  };

  const onShowReaderCommentsChange = (checked: boolean) => {
    setShowReaderComments(checked);
    document.cookie = `show_reader_comments=${checked.toString()}`;
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
              <AspectRatio ratio={16 / 9} className="bg-muted rounded-md mb-4">
                <Image
                  src={statement.headerImg ?? ""}
                  alt="Statement cover image"
                  fill
                  className="h-full w-full rounded-md object-cover"
                />
              </AspectRatio>
              <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold mb-4">{title}</h1>

                {statement.creatorId === userId && (
                  <Link
                    href={`/statements/${statement.statementId}/edit?version=${versionNumber}`}
                  >
                    <Button variant="outline">Edit</Button>
                  </Link>
                )}
              </div>
              <h2 className="text-xl font-medium  text-zinc-600">{subtitle}</h2>
              <div className="flex justify-between items-center">
                <Byline statement={statement} />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-comments"
                      checked={showAuthorComments}
                      onCheckedChange={onShowAuthorCommentsChange}
                    />
                    <Label htmlFor="show-comments">Author comments</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-comments"
                      checked={showReaderComments}
                      onCheckedChange={onShowReaderCommentsChange}
                    />
                    <Label htmlFor="show-comments">Reader comments</Label>
                  </div>
                </div>
              </div>
              <RichTextDisplay
                htmlContent={content}
                draftId={statement.id}
                statementId={statement.statementId}
                annotations={annotations}
                handleAnnotationClick={handleAnnotationClick}
                statementCreatorId={statement.creatorId}
                selectedAnnotationId={selectedAnnotationId}
                setSelectedAnnotationId={setSelectedAnnotationId}
                showAuthorComments={showAuthorComments}
                showReaderComments={showReaderComments}
                editable={false}
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
                showAuthorComments={showAuthorComments}
                showReaderComments={showReaderComments}
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}
