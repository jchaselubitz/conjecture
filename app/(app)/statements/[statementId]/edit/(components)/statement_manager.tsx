"use client";

import { useState } from "react";

import StatementCreateEditForm from "../../../(components)/create_edit_form";

interface DraftSelectorProps {
  statementId: string;
}

const StatementManager: React.FC<DraftSelectorProps> = ({ statementId }) => {
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDraftId(event.target.value);
  };

  return <StatementCreateEditForm statementId={statementId} />;
};

export default StatementManager;
