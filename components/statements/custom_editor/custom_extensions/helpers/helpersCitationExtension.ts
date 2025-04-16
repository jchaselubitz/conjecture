import { nanoid } from "nanoid";
import { createCitation, updateCitation } from "@/lib/actions/citationActions";
import { NewStatementCitation } from "kysely-codegen";
import { TextSelection } from "prosemirror-state";

import { EditorView } from "@tiptap/pm/view";

export const citationDateCreator = ({
 year,
 month,
 day,
}: {
 year: number | undefined | null;
 month: number | undefined | null;
 day: number | undefined | null;
}): Date | null => {
 let dateValue = null;
 if (year) {
  const y = year;
  const m = month ? month : 1;
  const f = day ? day : 1;
  dateValue = new Date(y, m, f);
 }
 return dateValue;
};

export const upsertCitation = async ({
 citationData,
 setError,
 creatorId,
 pathname,
 statementId,
 position,
 view,
}: {
 citationData: NewStatementCitation;
 setError: (error: string) => void;
 creatorId: string;
 statementId: string;
 pathname: string;
 position: number;
 view: EditorView;
}) => {
 const citationId = citationData.id === "" ? nanoid() : citationData.id;

 const {
  month,
  day,
  year,
 } = citationData;

 const citation = {
  ...citationData,
  id: citationId,
  statementId,
 };

 if (day && !month) {
  setError("Month is required if day is provided");
  throw new Error("Month is required if day is provided");
 }
 if (month && !year) {
  setError("Year is required if month is provided");
  throw new Error("Year is required if month is provided");
 }

 try {
  if (citationData.id !== "") {
   await updateCitation({
    creatorId,
    citation,
    revalidationPath: {
     path: pathname,
     type: "page",
    },
   });
  } else {
   await createCitation({
    creatorId,
    citation,
    revalidationPath: {
     path: pathname,
     type: "page",
    },
   });
  }

  //Update draft instantly instead of waiting for debounce cause otherwise the citation will not consistently be updated in the draft
 } catch (error) {
  console.error("Failed to save citation:", error);
  setError("Failed to save citation");
 }

 const { tr } = view.state;
 const citationNode = view.state.schema.nodes.citation.create({
  citationId: citationId,
 });

 tr.replaceSelectionWith(citationNode);
 setTimeout(() => {
  const nodeLength = citationNode.nodeSize;
  tr.setSelection(
   TextSelection.create(tr.doc, position + nodeLength),
  );
  view.dispatch(tr);
 }, 100);
};
