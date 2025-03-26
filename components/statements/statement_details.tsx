"use client";

import { DraftWithAnnotations } from "kysely-codegen";
import { Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import AnnotationPanel from "@/components/statements/annotation_panel";
import RichTextDisplay from "@/components/statements/rich_text_display";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useStatementContext } from "@/contexts/statementContext";
import { useUserContext } from "@/contexts/userContext";
import { updateStatementHeaderImageUrl } from "@/lib/actions/statementActions";
import { uploadStatementImage } from "@/lib/actions/storageActions";
import { handleImageCompression } from "@/lib/helpers/helpersImages";
import { generateStatementId } from "@/lib/helpers/helpersStatements";

import AppNav from "../navigation/app_nav";
import EditNav from "../navigation/edit_nav";
import { Input } from "../ui/input";
import Byline from "./byline";
import StatementOptions from "./statement_options";

interface StatementDetailsProps {
  statement: DraftWithAnnotations;
  authorCommentsEnabled: boolean;
  readerCommentsEnabled: boolean;
  editModeEnabled: boolean;
}

export default function StatementDetails({
  statement,
  authorCommentsEnabled,
  readerCommentsEnabled,
  editModeEnabled,
}: StatementDetailsProps) {
  const { setStatementUpdate, statementUpdate } = useStatementContext();
  const { userId } = useUserContext();
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editMode, setEditMode] = useState(editModeEnabled);

  const { title, subtitle, content, versionNumber, annotations, statementId } =
    statement;

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
    const savedSelectedAnnotationId = localStorage.getItem(
      "selectedAnnotationId",
    );
    setSelectedAnnotationId(savedSelectedAnnotationId ?? undefined);
  }, [setSelectedAnnotationId]);

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
    if (layout[0] < 85) {
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

  const handleHeaderImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
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
            statementId: statement.statementId,
            fileName: compressedFile.name,
            oldImageUrl: statementUpdate?.headerImg ?? null,
          });
          if (!imageUrl) throw new Error("Failed to upload image");
          await updateStatementHeaderImageUrl(statement.statementId, imageUrl);
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

  const handleEditModeToggle = () => {
    setEditMode(!editMode);
    const newEditMode = !editMode;
    document.cookie = `edit_mode=${newEditMode.toString()}`;
  };

  return (
    <div className="flex flex-col ">
      {editMode ? <EditNav /> : <AppNav />}

      <ResizablePanelGroup
        direction="horizontal"
        ref={panelGroupRef}
        onLayout={onLayout}
      >
        <ResizablePanel id="editor" defaultSize={100} minSize={60}>
          <div className="flex flex-col mt-12 gap-6 mx-auto max-w-3xl px-4">
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
              onChange={handleHeaderImageChange}
              disabled={isUploading || !editMode}
            />
            <div className="flex flex-col gap-1 mt-10 mb-5">
              <div className="flex justify-between items-center">
                {editMode ? (
                  <TextareaAutosize
                    name="title"
                    disabled={!editMode}
                    placeholder="Give it a title..."
                    className="shadow-none rounded-none border-0 border-b py-4 md:text-5xl text-3xl font-bold h-fit focus:outline-none focus:border-zinc-500 focus-visible:ring-0 w-full resize-none bg-transparent"
                    defaultValue={statement?.title || ""}
                    minRows={1}
                    maxRows={2}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setStatementUpdate({
                        ...statement,
                        title: e.target.value,
                        statementId: prepStatementId,
                      })
                    }
                  />
                ) : (
                  <h1 className="md:text-5xl text-3xl font-bold py-1">
                    {statementUpdate?.title ?? title}
                  </h1>
                )}
              </div>

              <div className="flex justify-between items-center">
                {editMode ? (
                  <TextareaAutosize
                    name="subtitle"
                    disabled={!editMode}
                    placeholder="Give it a subtitle..."
                    className="shadow-none rounded-none border-0 border-b py-4 font-medium focus:outline-none focus:border-zinc-500 focus-visible:ring-0 w-full text-zinc-700 md:text-xl resize-none bg-transparent"
                    defaultValue={statement?.subtitle || ""}
                    minRows={1}
                    maxRows={2}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setStatementUpdate({
                        ...statement,
                        subtitle: e.target.value,
                        statementId: prepStatementId,
                      })
                    }
                  />
                ) : (
                  <h2 className="font-medium py-1 md:text-xl text-zinc-500">
                    {statementUpdate?.subtitle ?? subtitle}
                  </h2>
                )}
              </div>
            </div>

            <StatementOptions
              className="mb-5"
              statement={statement}
              userId={userId}
              editMode={editMode}
              showAuthorComments={showAuthorComments}
              showReaderComments={showReaderComments}
              handleEditModeToggle={handleEditModeToggle}
              onShowAuthorCommentsChange={onShowAuthorCommentsChange}
              onShowReaderCommentsChange={onShowReaderCommentsChange}
            />

            <Byline statement={statement} />
            <RichTextDisplay
              htmlContent={content ?? undefined}
              draftId={statement.id}
              statementId={statement.statementId}
              annotations={annotations}
              handleAnnotationClick={handleAnnotationClick}
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
