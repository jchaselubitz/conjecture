import { BaseDraft } from "kysely-codegen";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/helpers/helpersDate";

const Byline = ({ statement }: { statement: BaseDraft }) => (
  <div className="flex items-center gap-2">
    <div className="h-8 w-8 rounded-full bg-muted" />
    <div className=" font-bold">Jake</div>
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
