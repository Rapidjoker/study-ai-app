# Study Buddy AI

A GitHub-first study companion that helps learners turn notes, textbooks, or PDFs into:

- short, readable summaries
- study guides
- quiz questions
- focus-friendly mini challenges

## What it does

This prototype is designed for a learner who wants an AI-assisted study workflow without needing a full app yet. It can:

- load text, Markdown, or PDF content
- generate a concise summary of the uploaded material
- build a simple study guide from the content
- create quiz prompts based on the chapter text
- offer a quick puzzle challenge for concentration support
- connect to Gemini when a user provides an API key

## How to use it

1. Open the app in a browser.
2. Paste notes or upload a PDF/text file.
3. Click one of the study tools to generate results.
4. If you want richer responses, enter a Gemini API key and use the Gemini extension box.

## GitHub Pages deployment

The repository includes a GitHub Actions workflow that deploys the static site to GitHub Pages on pushes to the main branch.

## Local preview

Run a simple local server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.
