export const createStatementImageUrl = ({
 userId,
 statementId,
 imageId,
}: {
 userId: string;
 statementId: string;
 imageId: string;
}) => `${userId}/${statementId}/${imageId}`;
