"use client";

import { NewAnnotation } from "kysely-codegen";
import { Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Byline from "@/components/statements/byline";
import HTMLTextAnnotator from "@/components/statements/custom_editor/html_text_annotator";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStatementContext } from "@/contexts/statementContext";
import { useUserContext } from "@/contexts/userContext";
import { updateStatementImageUrl } from "@/lib/actions/statementActions";
import {
  deleteStatementImage,
  uploadStatementImage,
} from "@/lib/actions/storageActions";
import { handleImageCompression } from "@/lib/helpers/helpersImages";
import { generateStatementId } from "@/lib/helpers/helpersStatements";

export default function StatementCreateEditForm({
  statementId,
}: {
  statementId: string;
}) {
  const {
    statementUpdate,
    statement,
    setStatementUpdate,
    updateStatementDraft,
  } = useStatementContext();

  const { userId } = useUserContext();
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const prevStatementRef = useRef(statementUpdate);
  const prepStatementId = statementId ? statementId : generateStatementId();

  const handleImageDelete = async () => {
    if (!statementUpdate?.headerImg || !userId) return;
    setIsDeleting(true);
    await deleteStatementImage({
      url: statementUpdate.headerImg,
      creatorId: userId,
    });
    setIsDeleting(false);
  };

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (titleInputRef.current) {
        const input = titleInputRef.current;
        const parentWidth = input.parentElement?.offsetWidth || 0;
        let fontSize = parseInt(window.getComputedStyle(input).fontSize, 10);

        while (input.scrollWidth > parentWidth && fontSize > 10) {
          fontSize -= 1;
          input.style.fontSize = `${fontSize}px`;
        }
      }
    };

    handleResize(); // Initial call to set the font size

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [statementUpdate]);

  const getSpan = (span: {
    start: number;
    end: number;
    text: string;
    id?: string | undefined;
    userId: string;
    draftId: string | number | bigint;
  }): NewAnnotation => {
    if (!statement.id) {
      throw new Error("Draft ID is required");
    }
    if (!userId) {
      throw new Error("User ID is required");
    }
    return {
      ...span,
      tag: "none",
      draftId: statement.id,
      userId: userId,
    };
  };

  const handleContentChange = useCallback(
    (content: string) => {
      if (statement && content !== statement.content) {
        // Use type-safe update function instead
        setStatementUpdate({
          content,
          statementId: prepStatementId,
        });
      }
    },
    [statement, prepStatementId, setStatementUpdate],
  );

  if (userId !== statement?.creatorId) {
    return (
      <div className="flex flex-col gap-8 max-w-4xl mx-auto">
        <h1 className="text-xl font-bold">
          You are not authorized to edit this statement
        </h1>
        <Button variant="outline" onClick={() => router.push("/statements")}>
          Go to statements
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {statementUpdate?.headerImg ? (
        <div className="relative group">
          <AspectRatio ratio={16 / 9} className="bg-muted rounded-md">
            <Image
              src={statementUpdate?.headerImg ?? ""}
              alt="Statement cover image"
              fill
              className="h-full w-full rounded-md object-cover"
            />
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
        disabled={isUploading}
      />
      <Input
        ref={titleInputRef}
        type="text"
        name="title"
        placeholder="Give it a title..."
        className="border-0 shadow-none px-0 md:text-8xl h-fit font-bold focus-visible:ring-0 w-full text-center my-14 whitespace-normal"
        defaultValue={statement?.title || ""}
        onChange={(e) =>
          setStatementUpdate({
            ...statement,
            title: e.target.value,
            statementId: prepStatementId,
          })
        }
      />
      <Input
        type="text"
        name="subtitle"
        placeholder="Give it a subtitle..."
        className="border-0 shadow-none px-0 md:text-xl h-fit font-bold focus-visible:ring-0 w-full "
        defaultValue={statement?.subtitle || ""}
        onChange={(e) =>
          setStatementUpdate({
            ...statement,
            subtitle: e.target.value,
            statementId: prepStatementId,
          })
        }
      />

      <Byline statement={statement} />

      <HTMLTextAnnotator
        htmlContent={statement?.content || ""}
        existingAnnotations={statement?.annotations || []}
        userId={userId || ""}
        getSpan={getSpan}
        placeholder="What's on your mind?"
        annotatable={true}
        selectedAnnotationId={undefined}
        setSelectedAnnotationId={() => {}}
        showAuthorComments={true}
        showReaderComments={true}
        editable={true}
        onContentChange={handleContentChange}
      />

      <Button variant="outline" className="gap-2 w-fit">
        <Upload className="h-4 w-4" />
        Import Entry
      </Button>
    </div>
  );
}
