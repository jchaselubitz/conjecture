"use client";

import { BaseDraft } from "kysely-codegen";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStatementContext } from "@/contexts/statementContext";

export default function StatementCreateEditForm({
  statementId,
  draft,
}: {
  statementId?: string;
  draft?: BaseDraft;
}) {
  const { statement, setStatement, setNewStatement } = useStatementContext();

  if (draft) {
    setStatement(draft);
  }

  return (
    <div className="space-y-8">
      {/* Cover Image Upload */}
      <div className="relative h-[200px] w-full border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <Button
            variant="ghost"
            className="flex flex-col gap-2"
            onClick={() => {
              // TODO: Implement image upload
            }}
          >
            <Upload className="h-5 w-5" />
            <span className="text-sm text-muted-foreground">
              Choose or drag and drop a cover image
            </span>
          </Button>
        </div>
      </div>

      {/* Title Input */}
      <Input
        type="text"
        placeholder="Give it a title..."
        className="border-0 px-0 text-4xl font-bold focus-visible:ring-0"
        defaultValue={statement?.title || ""}
        onChange={(e) =>
          setNewStatement({ title: e.target.value, statementId })
        }
      />

      {/* Author Info */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted" />
        <div className="text-sm">Jake</div>
      </div>

      {/* Content Input */}
      <Textarea
        placeholder="What's on your mind?"
        className="min-h-[200px] border-0 focus-visible:ring-0 px-0 py-4 resize-none"
        defaultValue={statement?.content || ""}
        onChange={(e) =>
          setNewStatement({ content: e.target.value, statementId })
        }
      />

      {/* Import Entry Button */}
      <Button variant="outline" className="gap-2">
        <Upload className="h-4 w-4" />
        Import Entry
      </Button>
    </div>
  );
}
