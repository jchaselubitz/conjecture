'use client';

import * as Sentry from '@sentry/nextjs';
import {
  createContext,
  ReactNode,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';

import { deleteAnnotationsBatch } from '@/lib/actions/annotationActions';
import { updateDraft } from '@/lib/actions/statementActions';
import { getMarks } from '@/lib/helpers/helpersStatements';

import { useStatementAnnotationContext } from './StatementAnnotationContext';
import { useStatementContext } from './StatementBaseContext';

interface StatementUpdateContextType {
  updateStatementDraft: () => Promise<void>;
  isUpdating: boolean;
  error: string | null;
}

const StatementUpdateContext = createContext<StatementUpdateContextType | undefined>(undefined);

export function StatementUpdateProvider({ children }: { children: ReactNode }) {
  const { editor, debouncedStatement, userId, statement } = useStatementContext();
  const { annotations, setAnnotations } = useStatementAnnotationContext();

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatementDraft = useCallback(async () => {
    if (!editor || !debouncedStatement || !userId || !annotations || !statement) {
      return;
    }

    let annotationsToKeep = [...annotations];
    let cleanedHtmlContent = debouncedStatement.draft.content;
    let cleanedContentJson = debouncedStatement.draft.contentJson;
    let cleanedContentPlainText = debouncedStatement.draft.contentPlainText;
    try {
      const currentMarks = getMarks(editor, ['annotationHighlight']);
      const liveMarkIds = new Set(
        currentMarks
          .map(
            markInfo =>
              markInfo.node.marks.find(m => m.type.name === 'annotationHighlight')?.attrs
                .annotationId
          )
          .filter(id => id)
      );

      const orphanedAnnotations = annotations.filter(ann => !liveMarkIds.has(ann.id));
      const orphanedIds = orphanedAnnotations.map(ann => ann.id);

      if (orphanedIds.length > 0) {
        const deleteResult = await deleteAnnotationsBatch({
          annotationIds: orphanedIds,
          userId: userId,
          statementId: statement.statementId
        });

        if (deleteResult.success) {
          const keptAnnotations = annotations.filter(ann => !orphanedIds.includes(ann.id));
          // Update state via the context setter
          setAnnotations(keptAnnotations);
          annotationsToKeep = keptAnnotations;
        } else {
          console.error('[UpdateProvider] Failed to delete orphaned annotations from DB.');
          setError('Failed to clean up annotations during save.');
        }

        cleanedHtmlContent = editor.getHTML();
        cleanedContentJson = editor.getJSON();
        cleanedContentPlainText = editor.getText();
      }
    } catch (gcError) {
      console.error('[UpdateProvider] Error during annotation garbage collection:', gcError);
      Sentry.captureException(gcError, { tags: { context: 'AnnotationGC' } });
      setError('Error cleaning up annotations during save.');
    }

    const { draft, creatorId } = debouncedStatement;
    const { id, versionNumber } = draft;

    const isStale = cleanedHtmlContent === statement.draft.content;

    if (isStale && annotationsToKeep.length === annotations.length) {
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      await updateDraft({
        id,
        content: cleanedHtmlContent ?? undefined, // HTML
        contentJson: cleanedContentJson ? JSON.stringify(cleanedContentJson) : undefined, // JSON
        contentPlainText: cleanedContentPlainText ?? undefined, // Plain text,
        versionNumber: versionNumber,
        creatorId: creatorId
      });
    } catch (err) {
      console.error('[UpdateProvider] Error updating draft:', err);
      setError('Error updating draft'); // Set error state here
      Sentry.captureException(err, { tags: { context: 'UpdateDraft' } });
    } finally {
      setIsUpdating(false); // Use local setter
    }
  }, [
    editor,
    debouncedStatement,
    userId,
    annotations,
    setAnnotations,
    statement // Add original statement as dependency for comparison
    // No need for setIsUpdating/setError here as they are component state
  ]);

  useEffect(() => {
    // Trigger update only if debounced statement exists and userId is present
    if (debouncedStatement?.draft.id && userId) {
      startTransition(() => {
        updateStatementDraft();
      });
    }
  }, [debouncedStatement, updateStatementDraft, userId]); // Ensure correct dependencies

  return (
    <StatementUpdateContext.Provider value={{ updateStatementDraft, isUpdating, error }}>
      {children}
    </StatementUpdateContext.Provider>
  );
}

export function useStatementUpdateContext() {
  const context = useContext(StatementUpdateContext);
  if (context === undefined) {
    throw new Error('useStatementUpdateContext must be used within a StatementUpdateProvider');
  }
  return context;
}
