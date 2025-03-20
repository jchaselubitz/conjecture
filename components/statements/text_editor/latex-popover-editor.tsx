"use client";

import "katex/dist/katex.min.css";
import katex from "katex";
import { Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

interface LatexPopoverEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLatex?: string;
  onSave: (latex: string) => void;
  onDelete?: () => void;
  isBlock?: boolean;
  children: React.ReactNode;
}

export function LatexPopoverEditor({
  open,
  onOpenChange,
  initialLatex = "\\sum_{i=1}^{n}i = \\frac{n(n+1)}{2}",
  onSave,
  onDelete,
  isBlock = true,
  children,
}: LatexPopoverEditorProps) {
  const [latex, setLatex] = useState(initialLatex);
  const [renderedLatex, setRenderedLatex] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Reset latex state when popover opens with new initialLatex
  useEffect(() => {
    if (open) {
      setLatex(initialLatex);
    }
  }, [open, initialLatex]);

  // Render LaTeX when it changes
  useEffect(() => {
    try {
      const rendered = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: isBlock,
      });
      setRenderedLatex(rendered);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error rendering LaTeX");
      setRenderedLatex("");
    }
  }, [latex, isBlock]);

  const handleSave = () => {
    onSave(latex);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onOpenChange(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent className="w-screen max-w-[450px] p-0" align="start">
        <div className="flex flex-col gap-2 p-4">
          <div className="border rounded-md p-3 min-h-20 flex items-center justify-center bg-slate-50">
            {error ? (
              <div className="text-red-500 text-sm">{error}</div>
            ) : (
              <div
                className={isBlock ? "w-full text-center" : ""}
                dangerouslySetInnerHTML={{ __html: renderedLatex }}
              />
            )}
          </div>
          <Textarea
            className="font-mono resize-none h-32 text-sm"
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            placeholder="Enter your LaTeX here..."
            autoFocus
          />
          <div className="flex justify-between mt-2">
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="px-2 py-1"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
