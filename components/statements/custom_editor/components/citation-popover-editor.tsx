"use client";

import { NewStatementCitation } from "kysely-codegen";
import { nanoid } from "nanoid";
import { usePathname } from "next/navigation";
import { TextSelection } from "prosemirror-state";
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
    citationData,
    setCitationData,
    setCitationPopoverOpen,
    editor,
    updateStatementDraft,
  } = useStatementContext();

  const [saveButtonState, setSaveButtonState] =
    useState<ButtonLoadingState>("default");
  const [error, setError] = useState<string | null>(null);

  const pathname = usePathname();

  const onClose = () => {
    setCitationPopoverOpen(false);
    setCitationData({
      statementId,
      title: "",
      authorNames: "",
      id: "",
    });
  };

  const handleInputChange = (field: keyof NewStatementCitation, value: any) => {
    setCitationData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const onOpenChange = (open: boolean) => {
    setCitationPopoverOpen(open);
    if (!open) {
      onClose();
    }
  };

  const saveCitation = async () => {
    const id = nanoid();
    await createCitation({
      creatorId,
      citation: {
        id,
        statementId,
        title: citationData.title,
        authorNames: citationData.authorNames,
        url: citationData.url,
        year: citationData.year ? citationData.year : null,
        issue: citationData.issue ? citationData.issue : null,
        pageEnd: citationData.pageEnd ? citationData.pageEnd : null,
        pageStart: citationData.pageStart ? citationData.pageStart : null,
        publisher: citationData.publisher ? citationData.publisher : null,
        titlePublication: citationData.titlePublication
          ? citationData.titlePublication
          : null,
        volume: citationData.volume ? citationData.volume : null,
      },
      revalidationPath: {
        path: pathname,
        type: "page",
      },
    });
    return id;
  };

  const handleSave = async () => {
    if (!citationData.title || !citationData.authorNames) {
      setError("Title and author names are required");
      return;
    }
    if (editor && userId && statementId) {
      const pos = editor.state.selection.$from.pos;
      try {
        setSaveButtonState("loading");
        if (citationData.id !== "") {
          await updateCitation({
            creatorId,
            citation: citationData,
            revalidationPath: {
              path: pathname,
              type: "page",
            },
          });
        } else {
          const id = await saveCitation();
          const tr = editor.state.tr;
          const node = editor.schema.nodes.citation.create({ citationId: id });
          tr.replaceSelectionWith(node);
          tr.setSelection(TextSelection.create(tr.doc, pos + 1));
          editor.view.dispatch(tr);
        }
        //Update draft instantly instead of waiting for debounce cause otherwise the citation will not consistently be updated in the draft
        setTimeout(() => {
          updateStatementDraft({
            statementId,
            content: editor.getHTML(),
            creatorId,
          });
          setSaveButtonState("default");
          onOpenChange(false);
          setCitationData({
            statementId,
            title: "",
            authorNames: "",
            id: "",
          });
        }, 0);
      } catch (error) {
        console.error("Failed to save citation:", error);
        setError("Failed to save citation");
      }
    }
  };

  const handleDelete = async () => {
    if (citationData.id && editor && userId) {
      try {
        await deleteCitation(citationData.id, creatorId);
        editor.commands.deleteCitation({ citationId: citationData.id });
        onOpenChange(false);
      } catch (error) {
        console.error("Failed to delete citation:", error);
        setError("Failed to delete citation");
      }
    }
  };

  return (
    <Popover open={citationPopoverOpen} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent className="w-screen max-w-[450px] p-0" align="start">
        <div className="flex flex-col gap-4 p-4">
          <Input
            placeholder="Title *"
            value={citationData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
          />

          <Input
            placeholder="Author Names *"
            value={citationData.authorNames}
            onChange={(e) => handleInputChange("authorNames", e.target.value)}
          />

          <Input
            placeholder="URL"
            value={citationData.url || ""}
            onChange={(e) => handleInputChange("url", e.target.value)}
          />

          <Input
            type="date"
            placeholder="Year"
            value={
              citationData.year
                ? new Date(citationData.year).toISOString().split("T")[0]
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
              value={citationData.issue || ""}
              onChange={(e) =>
                handleInputChange(
                  "issue",
                  e.target.value ? parseInt(e.target.value, 10) : null,
                )
              }
            />
            <Input
              placeholder="Volume"
              value={citationData.volume || ""}
              onChange={(e) => handleInputChange("volume", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              placeholder="From page"
              value={citationData.pageStart || ""}
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
              value={citationData.pageEnd || ""}
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
            value={citationData.publisher || ""}
            onChange={(e) => handleInputChange("publisher", e.target.value)}
          />

          <Input
            placeholder="Publication Title"
            value={citationData.titlePublication || ""}
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
              disabled={!citationData.id}
            >
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
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
