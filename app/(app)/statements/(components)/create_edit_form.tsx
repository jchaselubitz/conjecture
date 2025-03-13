"use client";

import { Upload } from "lucide-react";
import { useEffect, useRef } from "react";
import RichTextEditor from "@/components/statements/rich_text_editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStatementContext } from "@/contexts/statementContext";
import { generateStatementId } from "@/lib/helpers/helpersStatements";

import Byline from "./byline";

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
