"use client";

import { NewStatementCitation } from "kysely-codegen";
import { nanoid } from "nanoid";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ButtonLoadingState,
  LoadingButton,
} from "@/components/ui/loading-button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { useStatementContext } from "@/contexts/statementContext";
import { useUserContext } from "@/contexts/userContext";
import {
  createCitation,
  deleteCitation,
  updateCitation,
} from "@/lib/actions/citationActions";
interface CitationPopoverEditorProps {
  children: React.ReactNode;

  statementId: string;
  creatorId: string;
}

export function CitationPopoverEditor({
  statementId,
  creatorId,
  children,
}: CitationPopoverEditorProps) {
  const { userId } = useUserContext();
  const {
    citationPopoverOpen,
    initialCitationData,
    setCitationPopoverOpen,
    editor,
  } = useStatementContext();
  const [citation, setCitation] =
    useState<NewStatementCitation>(initialCitationData);
  const [saveButtonState, setSaveButtonState] =
    useState<ButtonLoadingState>("default");
  const [error, setError] = useState<string | null>(null);

  const pathname = usePathname();

  const handleInputChange = (field: keyof NewStatementCitation, value: any) => {
    setCitation((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveCitation = async () => {
    const id = nanoid();
    await createCitation({
      creatorId,
      citation: {
        id,
        statementId,
        title: citation.title,
        authorNames: citation.authorNames,
        url: citation.url,
        year: citation.year ? citation.year : null,
        issue: citation.issue ? citation.issue : null,
        pageEnd: citation.pageEnd ? citation.pageEnd : null,
        pageStart: citation.pageStart ? citation.pageStart : null,
        publisher: citation.publisher ? citation.publisher : null,
        titlePublication: citation.titlePublication
          ? citation.titlePublication
          : null,
        volume: citation.volume ? citation.volume : null,
      },
      revalidationPath: {
        path: pathname,
        type: "page",
      },
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
        setSaveButtonState("loading");
        if (citation.id !== "") {
          await updateCitation({
            creatorId,
            citation,
            revalidationPath: {
              path: pathname,
              type: "page",
            },
          });
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
        setSaveButtonState("default");
        setCitationPopoverOpen(false);
      } catch (error) {
        console.error("Failed to save citation:", error);
        setError("Failed to save citation");
      }
    }
  };

  const handleDelete = async () => {
    if (citation.id && editor && userId) {
      try {
        await deleteCitation(citation.id, creatorId);
        editor.commands.deleteCitation({ citationId: citation.id });
        setCitationPopoverOpen(false);
      } catch (error) {
        console.error("Failed to delete citation:", error);
        setError("Failed to delete citation");
      }
    }
  };

  return (
    <Popover open={citationPopoverOpen} onOpenChange={setCitationPopoverOpen}>
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

          <div className="flex justify-between gap-2 mt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={!citation.id}
            >
              Delete
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCitationPopoverOpen(false)}
              >
                Cancel
              </Button>
              <LoadingButton
                size="sm"
                onClick={handleSave}
                buttonState={saveButtonState}
                text="Save"
                loadingText="Saving..."
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
