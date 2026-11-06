# CWD Architecture Cookbook (React + Vite)

Open the menu (three-line button, top-left), pick a question, and its PDF or DOCX is shown like a slide. Use **Present** (or press F) for full-screen demos.

## Run
    npm install
    npm run dev          # open http://localhost:5173

## Build / preview production
    npm run build
    npm run preview

## Add your own documents
Replace the sample files in:
    src/assets/CWD/docs/02-architecture-questions/
Keep each file name equal to its `id` in src/pages/CWD/CWDArchitecturePage.jsx
(extension may be .pdf or .docx). Old .doc is not supported; save as .docx.

## Notes
- iOS Safari shows only page 1 of an embedded PDF; use "Open in new tab".
- Very large files: place in public/docs/ and set concept: "/docs/file.pdf".
