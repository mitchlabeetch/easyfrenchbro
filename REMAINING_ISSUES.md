# EasyFrenchBro - Remaining Issues for Development

**Generated:** 2025-12-18  
**Status:** All HIGH priority items have been resolved. The following MEDIUM and LOW priority issues remain for future development.

---

## 🟡 MEDIUM PRIORITY (6 Issues)

### N8: Unused TextRenderer Component

- **Location:** [src/components/TextRenderer.tsx](file:///Users/utilisateur/Desktop/easyfrenchbro/src/components/TextRenderer.tsx)
- **Problem:** Component exists but is not used anywhere. `WordGroupRenderer` is used instead.
- **Recommendation:** Delete the file to reduce codebase clutter, or document why it's kept.

---

### N9: Legacy Arrow Fallback

- **Location:** `src/components/CustomArrowLayer.tsx:77-113`
- **Problem:** Uses deprecated `startElementId`/`endElementId` for old arrows instead of the new `sourceGroupIds`/`targetGroupIds`.
- **Recommendation:** Remove legacy code path or add migration logic to convert old arrows on project load.

---

### N10: No Template APPLY Functionality

- **Location:** [src/components/PropertiesPanel.tsx](file:///Users/utilisateur/Desktop/easyfrenchbro/src/components/PropertiesPanel.tsx)
- **Problem:** Users can create templates (arrow, layout, anecdote) but there's no UI to apply them.
- **Recommendation:** Add an "Apply" button next to each saved template that applies its settings.

---

### N11: Redundant confirmArrowTarget Function

- **Location:** `src/store.ts:954-959`
- **Problem:** Function only calls `addArrowTargetGroup` - it's a redundant wrapper.
- **Recommendation:** Remove the function and inline the call, or remove if completely unused.

---

### N12: PDF Export May Fail Without Server

- **Location:** `src/App.tsx` (handleExport was removed, but ExportModal still uses `/export-pdf`)
- **Problem:** PDF export via `/export-pdf` requires the Node.js server to be running. No fallback provided.
- **Recommendation:** Add a fallback message or disable the PDF option when server is not detected.

---

### N13: Missing Fields in saveProject

- **Location:** `src/store.ts:saveProject`
- **Problem:** The following state fields are not persisted when saving:
  - `linkedPairs`
  - `templates`
  - `uiSettings`
- **Recommendation:** Update `saveProject` and `loadProject` to include these fields.

---

## 🟢 LOW PRIORITY / ENHANCEMENTS (12 Issues)

### N14: No Visual Highlight on Search Results

- **Location:** [src/components/SearchBar.tsx](file:///Users/utilisateur/Desktop/easyfrenchbro/src/components/SearchBar.tsx)
- **Problem:** Search results are navigated but not visually highlighted in the workspace.
- **Recommendation:** Add temporary highlight styling to the matched text when navigating results.

---

### N15: No Sidebar Card Edit Capability

- **Location:** [src/types.ts:102-110](file:///Users/utilisateur/Desktop/easyfrenchbro/src/types.ts#L102)
- **Problem:** Anecdote sidebar cards can only be created/deleted, content cannot be edited inline.
- **Note:** This is now partially addressed - content IS editable via textarea, but this may have been fixed.

---

### N16: Google Fonts Not Loaded

- **Location:** `src/components/PropertiesPanel.tsx:55-75`
- **Problem:** Font list references Google Fonts (Inter, Roboto, Playfair Display, etc.) but no `@import` or `<link>` is added to load them.
- **Recommendation:** Add Google Fonts link to `index.html` or dynamically load fonts when selected.

---

### N17: Dark Mode Incomplete

- **Location:** [src/index.css](file:///Users/utilisateur/Desktop/easyfrenchbro/src/index.css)
- **Problem:** `body.dark` class is defined but many components lack dark mode styles.
- **Recommendation:** Complete dark mode styling for all components or remove the incomplete feature.

---

### N18: No Keyboard Shortcuts for Line Reordering

- **Location:** [src/components/Workspace.tsx](file:///Users/utilisateur/Desktop/easyfrenchbro/src/components/Workspace.tsx)
- **Problem:** Lines are only reorderable via mouse drag-drop.
- **Recommendation:** Add keyboard shortcuts (e.g., Alt+Up/Down) to move selected lines.

---

### N19: Template Data is `any` Type

- **Location:** `src/types.ts:194`
- **Problem:** `Template.data` is typed as `any`, losing type safety.
- **Recommendation:** Create union types for different template payloads.

---

### N20: CSV Import Clears All Annotations

- **Location:** `src/store.ts:719-753`
- **Problem:** Importing a CSV file wipes all wordGroups, arrows, and sidebars.
- **Recommendation:** Add a confirmation dialog warning users, or add merge option.

---

### N21: Fragile Word ID Generation

- **Location:** [src/components/LinkingModal.tsx](file:///Users/utilisateur/Desktop/easyfrenchbro/src/components/LinkingModal.tsx)
- **Problem:** Word IDs are hardcoded as `${lineId}-${lang}-${index}` which breaks if text changes.
- **Recommendation:** Use stable UUIDs for words instead of index-based IDs.

---

### N22: No Project Rename Capability

- **Location:** [src/components/Dashboard.tsx](file:///Users/utilisateur/Desktop/easyfrenchbro/src/components/Dashboard.tsx)
- **Problem:** Projects can only be created and deleted, not renamed.
- **Recommendation:** Add inline rename functionality or a rename modal.

---

### N23: PDF Export Opens Print Dialog

- **Location:** [src/components/ExportModal.tsx](file:///Users/utilisateur/Desktop/easyfrenchbro/src/components/ExportModal.tsx)
- **Problem:** The PDF export option just opens the browser's print dialog, not a true PDF export.
- **Recommendation:** Clarify UI label or implement server-side PDF generation.

---

### N24: Page Background Not Customizable

- **Location:** `src/components/Workspace.tsx:getPageStyle`
- **Problem:** Page background is always white.
- **Recommendation:** Add background color/image customization to theme settings.

---

### N25: History Limit Not Indicated

- **Location:** [src/store.ts](file:///Users/utilisateur/Desktop/easyfrenchbro/src/store.ts)
- **Problem:** Max history is 50 items with no user control or indication when limit is reached.
- **Recommendation:** Add indicator when history is full, or make limit configurable.

---

## Summary

| Priority            | Count  | Status               |
| ------------------- | ------ | -------------------- |
| HIGH                | 0      | ✅ All resolved      |
| MEDIUM              | 6      | Awaiting development |
| LOW                 | 12     | Awaiting development |
| **Total remaining** | **18** |                      |
