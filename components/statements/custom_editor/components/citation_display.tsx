import { useStatementContext } from "@/contexts/statementContext";
import { NewStatementCitation } from "kysely-codegen";

interface CitationDisplayProps {
  // id: string;
  // citations: NewStatementCitation[];
}

export function CitationDisplay({ id, citations }: CitationDisplayProps) {
  const { citationData } = useStatementContext();
  // const citation = citations.find((citation) => citation.id === id);
  return (
    <div>
      <div>{citationData.title}</div>
      <div>{citationData.authorNames}</div>
      {/* <div>{citationData.year}</div> */}
      <div>{citationData.publisher}</div>
      <div>{citationData.volume}</div>
      <div>{citationData.issue}</div>
      <div>{citationData.pageStart}</div>
      <div>{citationData.pageEnd}</div>
      <div>{citationData.url}</div>
    </div>
  );
}
