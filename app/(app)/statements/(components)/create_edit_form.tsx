"use client";

import { Upload } from "lucide-react";
import { useEffect, useRef } from "react";
import RichTextEditor from "@/components/rich_text_editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStatementContext } from "@/contexts/statementContext";
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

  const prevStatementRef = useRef(statementUpdate);
  const prepStatementId = statementId ? statementId : generateStatementId();

  useEffect(() => {
    if (statementUpdate && prevStatementRef.current) {
      if (
        statementUpdate.title !== prevStatementRef.current.title ||
        statementUpdate.content !== prevStatementRef.current.content
      ) {
        const handler = setTimeout(() => {
          updateStatementDraft();
          prevStatementRef.current = statementUpdate;
        }, 1000);

        return () => {
          clearTimeout(handler);
        };
      }
    }
  }, [statementUpdate, updateStatementDraft]);

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Cover Image Upload */}

      <div className="flex items-center justify-center w-full my-14">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            // TODO: Implement image upload
          }}
        >
          <Upload className="h-4 w-4" />
          <span className="text-sm text-muted-foreground">
            Choose or drag and drop a cover image
          </span>
        </Button>
      </div>

      <Input
        type="text"
        name="title"
        placeholder="Give it a title..."
        className="border-0 px-0 md:text-8xl h-fit font-bold focus-visible:ring-0 w-full text-center my-14"
        defaultValue={statement?.title || ""}
        onChange={(e) =>
          setStatementUpdate({
            ...statement,
            title: e.target.value,
            statementId: prepStatementId,
          })
        }
      />

      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted" />
        <div className="text-sm">Jake</div>
        {/* add the publish and time here  */}
        <div className="text-sm">
          {statement?.publishedAt
            ? new Date(statement.publishedAt).toLocaleDateString()
            : "Not published"}
        </div>
        <div className="text-sm">v{statement?.versionNumber}</div>
      </div>

      <RichTextEditor
        content={statement?.content}
        onChange={(content) =>
          setStatementUpdate({ ...statement, content, statementId })
        }
        placeholder="What's on your mind?"
      />

      <Button variant="outline" className="gap-2 w-fit">
        <Upload className="h-4 w-4" />
        Import Entry
      </Button>
    </div>
  );
}
