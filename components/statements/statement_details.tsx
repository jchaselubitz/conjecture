"use client";

import { DraftWithAnnotations } from "kysely-codegen";
import Image from "next/image";
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

import { handleImageCompression } from "@/lib/helpers/helpersImages";
import { useRouter } from "next/navigation";
import { uploadStatementImage } from "@/lib/actions/storageActions";
import { updateStatementImageUrl } from "@/lib/actions/statementActions";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { useStatementContext } from "@/contexts/statementContext";
import { Input } from "../ui/input";
import { generateStatementId } from "@/lib/helpers/helpersStatements";
import StatementNav from "../navigation/statement_nav";
import AppNav from "../navigation/app_nav";
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
  const { setStatementUpdate, statementUpdate } = useStatementContext();
  const { userId } = useUserContext();

  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const panelGroupRef =
    useRef<React.ElementRef<typeof ResizablePanelGroup>>(null);

  const [showAuthorComments, setShowAuthorComments] = useState(
    authorCommentsEnabled
  );
  const [showReaderComments, setShowReaderComments] = useState(
    readerCommentsEnabled
  );
  const [editMode, setEditMode] = useState(false);

  const [selectedAnnotationId, setSelectedAnnotationId] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    const savedSizeString = localStorage.getItem("annotationPanelSize");
    const savedSize = savedSizeString ? JSON.parse(savedSizeString) : null;
    panelGroupRef.current?.setLayout(savedSize ?? [100, 0]);
    const savedSelectedAnnotationId = localStorage.getItem(
      "selectedAnnotationId"
    );
    setSelectedAnnotationId(savedSelectedAnnotationId ?? undefined);
  }, [setSelectedAnnotationId]);

  if (!drafts) {
    return <div>No drafts found</div>;
  }

  const statement =
    drafts.find((draft) => draft.publishedAt !== null) ??
    drafts[drafts.length - 1];

  const { title, subtitle, content, versionNumber, annotations, statementId } =
    statement;

  const prepStatementId = statementId ? statementId : generateStatementId();

  const handleAnnotationClick = async (annotationId: string) => {
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

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files?.length
      ? Array.from(event.target.files)
      : null;
    if (files && files.length > 0) {
      files.map(async (file) => {
        try {
          const compressedFile = await handleImageCompression(file);
          if (!compressedFile) return;

          const fileFormData = new FormData();
          fileFormData.append("image", compressedFile);
          if (!userId) {
            alert("Please set your profile name first.");
            return;
          }
          const imageUrl = await uploadStatementImage({
            file: fileFormData,
            creatorId: userId,
            fileName: compressedFile.name,
            oldImageUrl: statementUpdate?.headerImg ?? null,
          });
          if (!imageUrl) throw new Error("Failed to upload image");
          await updateStatementImageUrl(statement.statementId, imageUrl);
          toast("Success", {
            description: "Profile picture updated successfully!",
          });
          router.refresh();
        } catch (error) {
          toast("Error", {
            description: "Failed to upload image. Please try again.",
          });
        } finally {
          setIsUploading(false);
        }
      });
    }
  };

  const handlePhotoButtonClick = () => {
    if (photoInputRef.current !== null) {
      photoInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col ">
      {editMode ? <StatementNav /> : <AppNav />}
      {content && (
        <ResizablePanelGroup
          direction="horizontal"
          ref={panelGroupRef}
          onLayout={onLayout}
        >
          <ResizablePanel id="editor" defaultSize={100} minSize={60}>
            <div className="flex flex-col mt-12 gap-6 mx-auto max-w-4xl">
              {statementUpdate?.headerImg ? (
                <div className="relative group">
                  <AspectRatio ratio={16 / 9} className="bg-muted rounded-md">
                    <Image
                      src={statementUpdate?.headerImg ?? ""}
                      alt="Statement cover image"
                      fill
                      className="h-full w-full rounded-md object-cover"
                    />
                    {statement.creatorId === userId && editMode && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={handlePhotoButtonClick}
                        >
                          <Upload className="h-4 w-4" />
                          <span className="text-sm">Change cover image</span>
                        </Button>
                      </div>
                    )}
                  </AspectRatio>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full my-14">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handlePhotoButtonClick}
                  >
                    <Upload className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">
                      Choose or drag and drop a cover image
                    </span>
                  </Button>
                </div>
              )}
              <Input
                type="file"
                ref={photoInputRef}
                accept="image/*"
                className="hidden"
                id="avatar-upload"
                onChange={handleImageChange}
                disabled={isUploading || !editMode}
              />
              <div className="flex justify-between items-center">
                {editMode ? (
                  <Input
                    type="text"
                    name="title"
                    disabled={!editMode}
                    placeholder="Give it a title..."
                    className="border-0 shadow-none px-0 md:text-4xl font-bold h-fit focus-visible:ring-0 w-full  whitespace-normal"
                    defaultValue={statement?.title || ""}
                    onChange={(e) =>
                      setStatementUpdate({
                        ...statement,
                        title: e.target.value,
                        statementId: prepStatementId,
                      })
                    }
                  />
                ) : (
                  <h1 className="text-4xl font-bold mb-4">
                    {statementUpdate?.title ?? title}
                  </h1>
                )}

                {statement.creatorId === userId && (
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode ? "View" : "Edit"}
                  </Button>
                )}
              </div>

              <div className="flex justify-between items-center">
                {editMode ? (
                  <Input
                    type="text"
                    name="subtitle"
                    disabled={!editMode}
                    placeholder="Give it a subtitle..."
                    className="border-0 shadow-none px-0 md:text-xl font-bold focus-visible:ring-0 w-fit "
                    defaultValue={statement?.subtitle || ""}
                    onChange={(e) =>
                      setStatementUpdate({
                        ...statement,
                        subtitle: e.target.value,
                        statementId: prepStatementId,
                      })
                    }
                  />
                ) : (
                  <h2 className="text-xl font-bold mb-4">
                    {statementUpdate?.subtitle ?? subtitle}
                  </h2>
                )}
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
                editable={editMode}
                key={`rich-text-display-${editMode}`}
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
