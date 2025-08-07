# KaTeX CSS Loading Optimization

## Problem Analysis
The HTMLSuperEditor component was causing ~200ms Total Blocking Time (TBT), with the KaTeX CSS import being the primary culprit.

### Root Causes
1. **Synchronous CSS Import**: `import 'katex/dist/katex.min.css'` was blocking the main thread
2. **Font Loading Cascade**: CSS loaded → triggered 1.1MB of font downloads → blocked rendering  
3. **All-or-Nothing Loading**: Loaded all KaTeX assets even when no math content was present
4. **Multiple Import Points**: CSS imported in both `html_super_editor.tsx` and `latex_popover_editor.tsx`

### Performance Impact
- **KaTeX CSS**: 23KB minified
- **KaTeX Fonts**: 1.1MB total assets
- **Combined TBT Impact**: ~200ms blocking time

## Solution Implemented

### 1. Conditional CSS Loading
- Removed synchronous `import 'katex/dist/katex.min.css'` statements
- Added conditional loading based on content analysis
- CSS only loads when LaTeX content is detected in the document

### 2. Non-Blocking Load Technique
```typescript
// Load CSS with media="print" initially (non-blocking)
link.media = 'print';
link.onload = () => {
  link.media = 'all'; // Switch to apply styles
  // Process LaTeX after CSS loads
  if (editor) {
    setTimeout(() => {
      processLatex(editor.view.dom as HTMLElement);
    }, 50);
  }
};
```

### 3. CDN Optimization
- Switched from local bundle to CDN with integrity checking
- Leverages browser caching across sites
- Reduced bundle size

### 4. Font Preloading
- Added preload hints for essential KaTeX fonts in app layout
- Reduces FOIT (Flash of Invisible Text) when math is present

## Files Modified
1. `components/statements/custom_editor/html_super_editor.tsx`
2. `components/statements/custom_editor/hooks/useHtmlSuperEditor.ts`
3. `components/statements/custom_editor/latex_popover_editor.tsx`
4. `app/layout.tsx`

## Expected Performance Gains
- **No Math Content**: ~180-200ms TBT reduction (CSS never loads)
- **With Math Content**: ~100-150ms TBT reduction (non-blocking load)
- **Bundle Size**: Reduced by ~23KB for pages without math
- **Font Loading**: Improved FOIT with preload hints

## Testing Recommendations
1. Test pages with no math content (should see major improvement)
2. Test pages with math content (should see moderate improvement)
3. Verify LaTeX still renders correctly after optimization
4. Check Network tab to confirm CSS only loads when needed

## Implementation Date
January 2025
