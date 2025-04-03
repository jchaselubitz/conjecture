import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { MessageCircle } from "lucide-react";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

export const CommentIndicatorButton = ({
  showAuthorComments,
  showReaderComments,
  onShowAuthorCommentsChange,
  onShowReaderCommentsChange,
}: {
  showAuthorComments: boolean;
  showReaderComments: boolean;
  onShowAuthorCommentsChange: (checked: boolean) => void;
  onShowReaderCommentsChange: (checked: boolean) => void;
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center min-w-24 gap-3"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Comments</span>
          <span className="flex items-center gap-2">
            <span
              className={cn(
                " h-2 w-2 rounded-full border border-orange-500",
                showAuthorComments ? "bg-orange-500" : "bg-transparent"
              )}
            />
            <span
              className={cn(
                " h-2 w-2 rounded-full border border-blue-500",
                showReaderComments ? "bg-blue-500" : "bg-transparent"
              )}
            />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="flex flex-col gap-4 p-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="author-comments"
              checked={showAuthorComments}
              onCheckedChange={onShowAuthorCommentsChange}
              className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
            <Label
              htmlFor="author-comments"
              className="flex items-center gap-2"
            >
              Author comments
              <div className="h-2 w-2 rounded-full bg-orange-500" />
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="reader-comments"
              checked={showReaderComments}
              onCheckedChange={onShowReaderCommentsChange}
              className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
            />
            <Label
              htmlFor="reader-comments"
              className="flex items-center gap-2"
            >
              Reader comments
              <div className="h-2 w-2 rounded-full bg-blue-500" />
            </Label>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
