import { DraftWithAnnotations } from "kysely-codegen";
import { Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RefObject, useRef } from "react";
import { useState } from "react";
import { ImperativePanelGroupHandle } from "react-resizable-panels";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { useStatementContext } from "@/contexts/statementContext";
import { useUserContext } from "@/contexts/userContext";
import { updateStatementHeaderImageUrl } from "@/lib/actions/statementActions";
import { uploadStatementImage } from "@/lib/actions/storageActions";
import { handleImageCompression } from "@/lib/helpers/helpersImages";
import { generateStatementId } from "@/lib/helpers/helpersStatements";

import { AspectRatio } from "../ui/aspect-ratio";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import Byline from "./byline";
import RichTextDisplay from "./rich_text_display";
import StatementOptions from "./statement_options";

export interface StatementDetailsProps {
  statement: DraftWithAnnotations;
  editMode: boolean;
  showAuthorComments: boolean;
  showReaderComments: boolean;
  setEditMode: (editMode: boolean) => void;
  onShowAuthorCommentsChange: (checked: boolean) => void;
  onShowReaderCommentsChange: (checked: boolean) => void;
  setSelectedAnnotationId: (annotationId: string | undefined) => void;
  selectedAnnotationId: string | undefined;
  panelGroupRef: RefObject<ImperativePanelGroupHandle | null>;
}

export default function StatementDetails({
  statement,
  editMode,
  showAuthorComments,
  showReaderComments,
  setEditMode,
  onShowAuthorCommentsChange,
  onShowReaderCommentsChange,
  setSelectedAnnotationId,
  selectedAnnotationId,
  panelGroupRef,
}: StatementDetailsProps) {
  const { userId } = useUserContext();
  const { setStatementUpdate, statementUpdate } = useStatementContext();
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  if (!statementUpdate) return null;

  const { annotations, statementId } = statement;
  const { title, subtitle, headerImg } = statementUpdate;

  const prepStatementId = statementId ? statementId : generateStatementId();

  const handleEditModeToggle = () => {
    setEditMode(!editMode);
    const newEditMode = !editMode;
    document.cookie = `edit_mode=${newEditMode.toString()}`;
  };

  const handleAnnotationClick = async (annotationId: string) => {
    setSelectedAnnotationId(annotationId);
    const savedSizeString = localStorage.getItem("annotationPanelSize");
    const savedSize = savedSizeString ? JSON.parse(savedSizeString) : null;
    panelGroupRef.current?.setLayout(savedSize ?? [67, 33]);
    localStorage.setItem("selectedAnnotationId", annotationId);
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
            statementId,
            fileName: compressedFile.name,
            oldImageUrl: headerImg ?? null,
          });
          if (!imageUrl) throw new Error("Failed to upload image");
          await updateStatementHeaderImageUrl(statementId, imageUrl);
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
    <div className="flex flex-col mt-12 gap-6 mx-auto max-w-3xl px-4">
      {headerImg ? (
        <div className="relative group">
          <AspectRatio ratio={16 / 9} className="bg-muted rounded-md">
            <Image
              src={headerImg ?? ""}
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
        editMode={editMode}
        showAuthorComments={showAuthorComments}
        showReaderComments={showReaderComments}
        handleEditModeToggle={handleEditModeToggle}
        onShowAuthorCommentsChange={onShowAuthorCommentsChange}
        onShowReaderCommentsChange={onShowReaderCommentsChange}
      />

      <Byline statement={statement} />
      <RichTextDisplay
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
  );
}
