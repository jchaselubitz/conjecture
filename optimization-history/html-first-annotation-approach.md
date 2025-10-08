# HTML-First Annotation Approach

**Date**: October 8, 2025  
**Type**: Architecture Change  
**Impact**: Annotation system, Editor behavior

## Summary

Converted the annotation system from a **database-first** approach to an **HTML-first** approach. The HTML content now serves as the source of truth for annotation marks, while the database stores positions only as references for other features.

## Previous Approach (Database-First)

### Flow:
1. Annotations with `start` and `end` positions stored in database
2. When editor loads (or when switching edit modes), read annotations from DB
3. Remove all existing annotation marks from HTML
4. Reapply marks to HTML based on DB positions
5. Large useEffect (80+ lines) handling mark reapplication on every annotation change

### Problems:
- Complex mark reapplication logic on every state change
- Editor had to be remounted when switching modes (via key change)
- Race conditions between state updates and mark application
- DB positions could drift from actual HTML positions during editing
- Performance overhead from constant mark removal/reapplication

## New Approach (HTML-First)

### Flow:
1. **Creating an annotation:**
   - User selects text
   - Apply mark to HTML immediately using TipTap commands
   - Save updated HTML to database
   - Save positions to DB as reference

2. **Loading editor:**
   - Load HTML content (which already contains annotation marks)
   - Extract annotation positions from HTML marks
   - Sync positions to state if they differ from DB
   - No mark reapplication needed!

3. **Editing content:**
   - ProseMirror automatically updates mark positions as content changes
   - onUpdate handler extracts updated positions from HTML
   - Saves updated positions to DB as references

### Benefits:
- ✅ **Simpler code**: Removed 80+ line useEffect for mark reapplication
- ✅ **Better performance**: No mark removal/reapplication on load
- ✅ **Automatic position updates**: ProseMirror handles mark positions during edits
- ✅ **Single source of truth**: HTML is always correct
- ✅ **Faster mode switching**: Editor loads with marks already in place

## Code Changes

### 1. useHtmlSuperEditor.ts

#### Removed: Large mark reapplication useEffect
```typescript
// DELETED: 80+ lines of mark removal and reapplication logic
useEffect(() => {
  // Remove all marks
  // Reapply all marks from DB
  // Handle selection
}, [editor, annotations, statementCreatorId]);
```

#### Added: HTML reading on load
```typescript
// New: Read marks from HTML, sync positions to state
useEffect(() => {
  if (!editor) return;
  
  const annotationMarks = getMarks(editor, ['annotationHighlight']);
  
  // Extract positions from HTML marks
  const annotationsFromHTML = extractAnnotationPositions(annotationMarks);
  
  // Only update state if positions differ
  if (positionsChanged) {
    setAnnotations(updatedAnnotations);
  }
}, [editor]); // Only runs when editor is created
```

#### Updated: onCreate handler
```typescript
onCreate: ({ editor }) => {
  // HTML-first: just read what's already in the HTML
  const annotationMarks = getMarks(editor, ['annotationHighlight']);
  
  // Log for debugging
  if (annotationMarks.length > 0) {
    console.log(`Found ${annotationMarks.length} annotation marks in HTML`);
  }
  
  // No mark reapplication needed!
}
```

#### Updated: onUpdate handler
```typescript
onUpdate: ({ editor, transaction }) => {
  if (transaction.docChanged) {
    // Save HTML (source of truth)
    const newContent = editor.getHTML();
    setUpdatedDraft({ ...draft, content: newContent });
    
    // If annotations changed, extract updated positions from HTML
    if (hasAnnotationChanges) {
      const updatedPositions = extractAnnotationPositions(editor);
      setAnnotations(updatedAnnotations); // This syncs to DB
    }
  }
}
```

### 2. helpersStatements.ts

#### Updated: createStatementAnnotation
```typescript
// OLD: Add to state, let useEffect apply mark
setAnnotations([...annotations, newAnnotation]);
await createAnnotation({ ... });
// Mark applied by useEffect

// NEW: Apply mark to HTML first
editor.chain()
  .setTextSelection({ from, to })
  .setMark('annotationHighlight', { ... })
  .run();

// HTML is now updated, state update triggers save
setAnnotations([...annotations, newAnnotation]);

// DB positions saved as reference
await createAnnotation({ ... });
```

#### Updated: ensureAnnotationMarks
```typescript
// OLD: Checked for inconsistencies, warned about missing marks
// Implied that marks would be reapplied by useEffect

// NEW: Just validation/debugging
// HTML is the source of truth, so only log warnings
// No state updates or mark manipulation
```

### 3. statement_details.tsx

No changes needed! The component still remounts the editor when `editMode` changes (via key), but now the editor loads with marks already in the HTML, so no reapplication logic is triggered.

```typescript
<HTMLSuperEditor
  key={`editor-content-${editMode}`} // Still remounts on mode change
  existingAnnotations={annotations}   // But marks already in HTML!
  // ...
/>
```

## Data Flow Diagram

### Creating an Annotation:
```
User Selection
    ↓
Apply mark to HTML (TipTap command)
    ↓
Get updated HTML
    ↓
Update state (triggers onUpdate)
    ↓
Save HTML to DB ──→ Save positions to DB
                     (as reference only)
```

### Loading Editor:
```
Load draft from DB (HTML contains marks)
    ↓
Create editor with HTML content
    ↓
onCreate: Read marks from HTML
    ↓
useEffect: Extract positions from marks
    ↓
Sync positions to state (if different from DB)
    ↓
Editor ready (marks already visible!)
```

### Editing Content:
```
User edits text in edit mode
    ↓
ProseMirror updates mark positions automatically
    ↓
onUpdate triggered
    ↓
Extract updated positions from HTML
    ↓
Update state → Save to DB as reference
```

## Database Schema

No changes to the database schema. The `annotation` table still stores:
- `id`: Unique identifier
- `start`: Character position (reference only)
- `end`: Character position (reference only)
- `userId`: Creator
- `draftId`: Associated draft
- `text`: Annotated text
- `tag`: Optional tag
- `createdAt`, `updatedAt`: Timestamps

**Key difference**: The `start` and `end` positions are now treated as **references** for other features (like querying, filtering, analytics) rather than the source of truth for rendering.

## Benefits for Other Features

While HTML is the source of truth for rendering, DB positions are still useful for:
- **Querying**: "Find all annotations in this range"
- **Analytics**: "How many annotations per paragraph?"
- **Filtering**: "Show only annotations by this user"
- **API responses**: Provide position data without parsing HTML
- **Search**: Find annotations by position or text

## Edge Cases Handled

### 1. HTML has mark but DB doesn't
- **Behavior**: Mark is displayed (HTML is truth)
- **Log**: Warning logged for investigation
- **Resolution**: Should be synced to DB on next save

### 2. DB has annotation but HTML doesn't
- **Behavior**: No mark displayed (HTML is truth)
- **Log**: Warning logged via `ensureAnnotationMarks`
- **Resolution**: Indicates data inconsistency, HTML should be regenerated

### 3. Positions differ between HTML and DB
- **Behavior**: HTML position is used for display
- **Resolution**: State is updated with HTML positions, saved to DB

### 4. Concurrent edits
- **Behavior**: ProseMirror handles mark position updates automatically
- **Resolution**: onUpdate extracts new positions and saves them

## Testing Considerations

1. **Load existing annotations**: Verify marks appear without reapplication
2. **Create new annotation**: Verify mark appears immediately and saves to DB
3. **Switch edit modes**: Verify marks persist through editor remount
4. **Edit around annotations**: Verify positions update automatically
5. **Delete annotation**: Verify mark is removed from HTML and DB
6. **Concurrent annotations**: Verify no race conditions or duplicates

## Performance Impact

### Improvements:
- ⚡ **Faster initial load**: No mark reapplication on editor creation
- ⚡ **Faster mode switching**: No mark removal/reapplication
- ⚡ **Reduced re-renders**: useEffect runs only on editor creation, not on every annotation change
- ⚡ **Less transaction overhead**: No mark manipulation in separate transactions

### Trade-offs:
- 📦 **Slightly larger HTML**: Mark attributes stored in HTML
- 🔄 **More HTML saves**: Every annotation change saves HTML (but this was already happening)

## Migration Path

No migration needed! Existing annotations in the database work fine with this approach:
1. HTML already contains the marks (from previous system)
2. On first load, positions are read from HTML
3. If DB positions differ, they're updated
4. System operates normally from that point

## Future Enhancements

1. **Debounced position saves**: Reduce DB writes during rapid edits
2. **Position-only updates**: Update annotation positions without full HTML save
3. **Conflict resolution**: Handle edge cases where HTML and DB disagree
4. **Analytics pipeline**: Use DB positions for analysis without parsing HTML

## Conclusion

The HTML-first approach simplifies the annotation system significantly while maintaining all functionality. By treating HTML as the source of truth and database positions as references, we eliminate complex mark reapplication logic and improve performance.

The key insight: **ProseMirror already tracks mark positions perfectly in the HTML document. We should trust it rather than fighting it.**
