"use client";

import { Editor } from "@tiptap/react";
import { NewStatementCitation } from "kysely-codegen";
import { nanoid } from "nanoid";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { useUserContext } from "@/contexts/userContext";
import { createCitation, updateCitation } from "@/lib/actions/citationActions";
interface CitationPopoverEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  citationData: NewStatementCitation;
  children: React.ReactNode;
  editor: Editor;
  statementId: string;
}

export function CitationPopoverEditor({
  open,
  onOpenChange,
  citationData,
  editor,
  statementId,
  children,
}: CitationPopoverEditorProps) {
  const { userId } = useUserContext();
  const [citation, setCitation] = useState<NewStatementCitation>(citationData);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof NewStatementCitation, value: any) => {
    setCitation((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveCitation = async () => {
    // This will be implemented later with the DB query
    const id = nanoid();
    await createCitation({
      id,
      statementId,
      title: citation.title,
      authorNames: citation.authorNames,
      url: citation.url,
      year: citation.year,
      issue: citation.issue,
      pageEnd: citation.pageEnd,
      pageStart: citation.pageStart,
      publisher: citation.publisher,
      titlePublication: citation.titlePublication,
      volume: citation.volume,
    });
    return id;
  };

  const handleSave = async () => {
    if (!citation.title || !citation.authorNames) {
      setError("Title and author names are required");
      return;
    }

    if (editor && userId && statementId) {
      try {
        if (citation.id !== "") {
          await updateCitation(citation);
        } else {
          //we want to save the id to the citation node
          const id = await saveCitation();
          editor
            .chain()
            .focus()
            .insertCitation({
              id,
            })
            .run();
        }

        onOpenChange(false);
      } catch (error) {
        console.error("Failed to save citation:", error);
        setError("Failed to save citation");
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent className="w-screen max-w-[450px] p-0" align="start">
        <div className="flex flex-col gap-4 p-4">
          <Input
            placeholder="Title *"
            value={citation.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
          />

          <Input
            placeholder="Author Names *"
            value={citation.authorNames}
            onChange={(e) => handleInputChange("authorNames", e.target.value)}
          />

          <Input
            placeholder="URL"
            value={citation.url || ""}
            onChange={(e) => handleInputChange("url", e.target.value)}
          />

          <Input
            type="date"
            placeholder="Year"
            value={
              citation.year
                ? new Date(citation.year).toISOString().split("T")[0]
                : ""
            }
            onChange={(e) =>
              handleInputChange(
                "year",
                e.target.value ? new Date(e.target.value) : null,
              )
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              placeholder="Issue"
              value={citation.issue || ""}
              onChange={(e) =>
                handleInputChange(
                  "issue",
                  e.target.value ? parseInt(e.target.value, 10) : null,
                )
              }
            />
            <Input
              placeholder="Volume"
              value={citation.volume || ""}
              onChange={(e) => handleInputChange("volume", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              placeholder="From page"
              value={citation.pageStart || ""}
              onChange={(e) =>
                handleInputChange(
                  "pageStart",
                  e.target.value ? parseInt(e.target.value, 10) : null,
                )
              }
            />
            <Input
              type="number"
              placeholder="To page"
              value={citation.pageEnd || ""}
              onChange={(e) =>
                handleInputChange(
                  "pageEnd",
                  e.target.value ? parseInt(e.target.value, 10) : null,
                )
              }
            />
          </div>

          <Input
            placeholder="Publisher"
            value={citation.publisher || ""}
            onChange={(e) => handleInputChange("publisher", e.target.value)}
          />

          <Input
            placeholder="Publication Title"
            value={citation.titlePublication || ""}
            onChange={(e) =>
              handleInputChange("titlePublication", e.target.value)
            }
          />
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
