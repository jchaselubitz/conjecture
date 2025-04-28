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

  // --- Moved updateStatementDraft logic here ---
  const updateStatementDraft = useCallback(async () => {
    // Guard clauses moved here
    if (!editor || !debouncedStatement || !userId || !annotations || !statement) {
      return;
    }

    let annotationsToKeep = [...annotations];
    let cleanedHtmlContent = debouncedStatement.content;

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
        // console.log('[UpdateProvider] Found orphaned annotations, deleting:', orphanedIds);
        const deleteResult = await deleteAnnotationsBatch({
          annotationIds: orphanedIds,
          userId: userId,
          statementId: debouncedStatement.statementId
        });

        if (deleteResult.success) {
          const keptAnnotations = annotations.filter(ann => !orphanedIds.includes(ann.id));
          // Update state via the context setter
          setAnnotations(keptAnnotations);
          annotationsToKeep = keptAnnotations;
          // console.log(
          //   `[UpdateProvider] Successfully deleted ${deleteResult.deletedCount} orphaned annotations.`
          // );
        } else {
          console.error('[UpdateProvider] Failed to delete orphaned annotations from DB.');
          setError('Failed to clean up annotations during save.'); // Set error state here
        }
        // Get potentially cleaned HTML only if orphans were processed
        cleanedHtmlContent = editor.getHTML();
      }
    } catch (gcError) {
      console.error('[UpdateProvider] Error during annotation garbage collection:', gcError);
      Sentry.captureException(gcError, { tags: { context: 'AnnotationGC' } });
      setError('Error cleaning up annotations during save.'); // Set error state here
      // Decide how to proceed - maybe skip the update? For now, we allow it to continue.
    }

    // Compare against the *original* statement state from StatementBaseContext
    const isStale =
      cleanedHtmlContent === statement.content &&
      debouncedStatement.title === statement.title &&
      debouncedStatement.subtitle === statement.subtitle &&
      debouncedStatement.headerImg === statement.headerImg;

    if (isStale && annotationsToKeep.length === annotations.length) {
      // console.log('[UpdateProvider] Skipping update, no changes detected after debounce and GC.');
      return; // Skip update if nothing changed
    }

    // --- Moved updateDraft call here ---
    const { title, subtitle, headerImg, statementId, versionNumber, creatorId } =
      debouncedStatement;

    // Use the local isUpdating/error state
    setIsUpdating(true);
    setError(null);

    try {
      await updateDraft({
        id: statement.id, // Use the original statement ID
        title: title ?? undefined,
        subtitle: subtitle ?? undefined,
        content: cleanedHtmlContent ?? undefined,
        headerImg: headerImg ?? undefined,
        versionNumber: versionNumber, // Ensure this isn't null/undefined
        statementId: statementId, // Ensure this isn't null/undefined
        creatorId: creatorId // Ensure this isn't null/undefined
      });
      console.log('[UpdateProvider] Draft updated successfully.');
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

  // --- Moved useEffect to trigger update ---
  useEffect(() => {
    // Trigger update only if debounced statement exists and userId is present
    if (debouncedStatement?.id && userId) {
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
