# FUTURE.md - Technical Roadmap

## When codebase exceeds 5k lines or multi-contributor work begins

### First extraction priorities (in order)
1. **`api/`** - Anthropic calls, Drive upload, all network layers
2. **`auth/`** - Netlify Identity, login guards, user state
3. **`stories/`** - StoryCard, StoryEditor, interview chat, STAR extraction
4. **`research/`** - Company research steps, source parsing, result cards
5. **`resume/`** - Resume analysis, docx generation, gap correction
6. **`ui/`** - Shared styles, Spinner, CopyBtn, StagePill, etc.

### Migration checklist for each module
- [ ] Extract all functions/constants to new file(s)
- [ ] Create typed contracts (inputs/outputs) for cross-module calls
- [ ] Write 2-3 unit tests for core functions
- [ ] Verify all existing workflows still work end-to-end
- [ ] Update imports in App.jsx
- [ ] Delete extracted code from App.jsx
