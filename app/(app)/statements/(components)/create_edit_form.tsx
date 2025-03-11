"use client";

import { Upload } from "lucide-react";
import RichTextEditor from "@/components/rich_text_editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStatementContext } from "@/contexts/statementContext";

export default function StatementCreateEditForm({
  statementId,
}: {
  statementId?: string;
}) {
  const { statement, setNewStatement } = useStatementContext();

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
          setNewStatement({
            ...statement,
            title: e.target.value,
            statementId,
          })
        }
      />

      {/* Author Info */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted" />
        <div className="text-sm">Jake</div>
      </div>

      {/* Content Input */}
      <RichTextEditor
        content={statement?.content}
        onChange={(content) =>
          setNewStatement({ ...statement, content, statementId })
        }
        placeholder="What's on your mind?"
      />

      {/* Import Entry Button */}
      <Button variant="outline" className="gap-2 w-fit">
        <Upload className="h-4 w-4" />
        Import Entry
      </Button>
    </div>
  );
}
