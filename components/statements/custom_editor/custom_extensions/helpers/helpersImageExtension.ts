import { handleImageCompression } from "@/lib/helpers/helpersImages";
import { Editor } from "@tiptap/react";
import { toast } from "sonner";
import { uploadStatementImage } from "@/lib/actions/storageActions";
import {
  UpsertImageDataType,
  upsertStatementImage,
} from "@/lib/actions/statementActions";

export const handleImageChange = async ({
  file,
  userId,
  statementId,
  imageData,
}: {
  file: File;
  userId: string;
  statementId: string;
  imageData: UpsertImageDataType;
}): Promise<{ imageId: string; imageUrl: string } | undefined> => {
  if (file) {
    try {
      const compressedFile = await handleImageCompression(file);
      if (!compressedFile) return;

      const fileFormData = new FormData();
      fileFormData.append("image", compressedFile);

      const imageUrl = await uploadStatementImage({
        file: fileFormData,
        creatorId: userId,
        statementId,
        fileName: imageData.id,
        oldImageUrl: imageData.src,
      });

      if (!imageUrl) throw new Error("Failed to upload image");

      await upsertStatementImage({
        id: imageData.id,
        src: imageUrl,
        statementId,
        alt: imageData.alt,
        caption: imageData.caption,
      });
      return { imageId: imageData.id, imageUrl };
    } catch (error) {
      toast("Error", {
        description: `Failed to upload image. Please try again. ${error}`,
      });
    }
  }
};

export const saveImage = async ({
  editor,
  userId,
  statementId,
  imageData,
  file,
}: {
  editor: Editor;
  userId: string;
  statementId: string;
  imageData: UpsertImageDataType;
  file: File;
}) => {
  const newImage = await handleImageChange({
    file,
    userId,
    statementId,
    imageData,
  });

  if (!newImage) throw new Error("No image to insert");

  // Check if an image with this ID already exists in the document
  let imageExists = false;
  editor.state.doc.descendants((node) => {
    if (
      node.type.name === "blockImage" &&
      node.attrs.imageId === imageData.id
    ) {
      imageExists = true;
      return false; // Stop traversing
    }
    return true;
  });

  if (imageExists) {
    // Update existing image
    editor
      ?.chain()
      .focus()
      .updateBlockImage({
        imageId: imageData.id,
        src: newImage.imageUrl,
        alt: imageData.alt ?? undefined,
        caption: imageData.caption ?? undefined,
      })
      .run();
  } else {
    // Insert new image
    editor
      ?.chain()
      .focus()
      .insertBlockImage({
        imageId: newImage.imageId,
        src: newImage.imageUrl,
        alt: imageData.alt ?? undefined,
        caption: imageData.caption ?? undefined,
      })
      .run();
  }
};

export const updateImage = async ({
  editor,
  userId,
  pathname,
  statementId,
  imageData,
}: {
  editor: Editor;
  userId: string;
  pathname: string;
  statementId: string;
  imageData: UpsertImageDataType;
}) => {
  // Check if an image with this ID already exists in the document

  editor.state.doc.descendants((node) => {
    if (
      node.type.name === "blockImage" &&
      node.attrs.imageId === imageData.id
    ) {
      return false; // Stop traversing
    }
    return true;
  });

  await upsertStatementImage({
    alt: imageData.alt || imageData.id || "",
    src: imageData.src,
    id: imageData.id,
    caption: imageData.caption,
    statementId,
    revalidationPath: {
      path: "/",
      type: "page",
    },
  });

  // Update existing image
  editor
    ?.chain()
    .focus()
    .updateBlockImage({
      imageId: imageData.id,
      src: imageData.src,
      alt: imageData.alt ?? undefined,
      caption: imageData.caption ?? undefined,
    })
    .run();
};
