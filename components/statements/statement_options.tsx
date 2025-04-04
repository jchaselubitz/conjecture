import { DraftWithAnnotations } from "kysely-codegen";
import {
  BarChart3,
  Eye,
  Facebook,
  Link,
  Linkedin,
  MoreHorizontal,
  PencilLine,
  Send,
  Share2,
  Trash2,
  Twitter,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/contexts/userContext";
import { deleteDraft, deleteStatement } from "@/lib/actions/statementActions";
import { cn } from "@/lib/utils";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Separator } from "../ui/separator";
import { CommentIndicatorButton } from "./comments_menu";
import RebuttalButton from "./rebuttal_button";
import VoteButton from "./vote_button";
interface StatementOptionsProps {
  statement: DraftWithAnnotations;

  editMode: boolean;
  showAuthorComments: boolean;
  showReaderComments: boolean;
  handleEditModeToggle: () => void;
  onShowAuthorCommentsChange: (checked: boolean) => void;
  onShowReaderCommentsChange: (checked: boolean) => void;
  className?: string;
}

export default function StatementOptions({
  statement,
  editMode,
  showAuthorComments,
  showReaderComments,
  handleEditModeToggle,
  onShowAuthorCommentsChange,
  onShowReaderCommentsChange,
  className,
}: StatementOptionsProps) {
  const { userId } = useUserContext();
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await deleteStatement(
        statement.statementId,
        statement.creatorId,
        statement.headerImg || "",
      );
      router.push("/statements");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Separator />
      <div className="flex justify-between items-center gap-3 px-1">
        <div className="flex items-center gap-3">
          <CommentIndicatorButton
            showAuthorComments={showAuthorComments}
            showReaderComments={showReaderComments}
            onShowAuthorCommentsChange={onShowAuthorCommentsChange}
            onShowReaderCommentsChange={onShowReaderCommentsChange}
          />
          {!editMode && statement.statementId && (
            <RebuttalButton
              existingStatementId={statement.statementId}
              existingTitle={statement.title || ""}
              existingThreadId={statement.threadId}
            />
          )}
          {statement.statementId && (
            <VoteButton
              statementId={statement.statementId}
              upvotes={statement.upvotes || []}
            />
          )}
        </div>
        <div className="flex items-center gap-3 w-full justify-end">
          {editMode ? (
            <ViewModeButton
              handleEditModeToggle={handleEditModeToggle}
              className="w-full"
            />
          ) : (
            <>
              <ShareButton />
              {statement.creatorId === userId && (
                <CreatorOptionsButton
                  editMode={editMode}
                  handleEditModeToggle={handleEditModeToggle}
                  handleDelete={handleDelete}
                />
              )}
            </>
          )}
        </div>
      </div>
      <Separator />
    </div>
  );
}

const ViewModeButton = ({
  handleEditModeToggle,
  className,
}: {
  handleEditModeToggle: () => void;
  className?: string;
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleEditModeToggle}
      className={className}
    >
      <Eye className="h-4 w-4" />
      Switch back to view mode
    </Button>
  );
};

const ShareButton = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 px-2">
          <Share2 className="h-4 w-4 mr-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem>
          <Link className="mr-2 h-4 w-4" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Send className="mr-2 h-4 w-4" />
          Send as message
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Facebook className="mr-2 h-4 w-4" />
          Share to Facebook
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Linkedin className="mr-2 h-4 w-4" />
          Share to LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Twitter className="mr-2 h-4 w-4" />
          Share to X
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const CreatorOptionsButton = ({
  editMode,
  handleEditModeToggle,
  handleDelete,
}: {
  editMode: boolean;
  handleEditModeToggle: () => void;
  handleDelete: () => void;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <BarChart3 className="mr-2 h-4 w-4" />
          Stats
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleEditModeToggle}>
          <PencilLine className="mr-2 h-4 w-4" />
          {editMode ? "View" : "Edit"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
