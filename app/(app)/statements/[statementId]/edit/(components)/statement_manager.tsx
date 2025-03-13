"use client";

import StatementCreateEditForm from "../../../(components)/create_edit_form";

interface DraftSelectorProps {
  statementId: string;
}

const StatementManager: React.FC<DraftSelectorProps> = ({ statementId }) => {
  return (
    <div className="pb-10">
      <StatementCreateEditForm statementId={statementId} />
    </div>
  );
};

export default StatementManager;
