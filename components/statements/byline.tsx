import { DraftWithUser } from "kysely-codegen";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/helpers/helpersDate";

const Byline = ({ statement }: { statement: DraftWithUser }) => (
  <div className="flex items-center gap-2">
    <Avatar className="w-10 h-10">
      <AvatarImage
        src={statement?.creatorImageUrl || ""}
        className="object-cover"
      />
      <AvatarFallback>{statement?.creatorName?.slice(0, 2)}</AvatarFallback>
    </Avatar>
    <div className=" font-bold">{statement?.creatorName}</div>
    {/* add the publish and time here  */}

    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="text-xs text-muted-foreground bg-zinc-100 rounded-sm px-2 py-1">
            {statement?.publishedAt
              ? formatDate({ date: statement.publishedAt })
              : "Not published"}
          </div>
        </TooltipTrigger>
        {statement?.publishedAt && (
          <TooltipContent>
            <p>
              Published{" "}
              {formatDate({ date: statement.publishedAt, withTime: true })}
            </p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
    <div className="text-xs text-muted-foreground bg-zinc-100 rounded-sm px-2 py-1">
      v{statement?.versionNumber}
    </div>
  </div>
);

export default Byline;
