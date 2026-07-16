const notesInput = document.getElementById('notesInput');
const fileInput = document.getElementById('fileInput');
const importBtn = document.getElementById('importBtn');
const summarizeBtn = document.getElementById('summarizeBtn');
const guideBtn = document.getElementById('guideBtn');
const quizBtn = document.getElementById('quizBtn');
const focusBtn = document.getElementById('focusBtn');
const results = document.getElementById('results');
const status = document.getElementById('status');
const geminiKeyInput = document.getElementById('geminiKey');
const geminiPromptInput = document.getElementById('geminiPrompt');
const geminiBtn = document.getElementById('geminiBtn');
const geminiOutput = document.getElementById('geminiOutput');

const state = {
  text: ''
};

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js';
}

importBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) {
    status.textContent = 'Choose a file first.';
    return;
  }

  try {
    status.textContent = 'Reading your file...';
    const text = await readFile(file);
    state.text = text;
    notesInput.value = text;
    status.textContent = 'Material loaded. Pick a study action.';
  } catch (error) {
    status.textContent = 'The file could not be read. Try plain text or a smaller PDF.';
    console.error(error);
  }
});

summarizeBtn.addEventListener('click', () => {
  const text = getText();
  if (!text) {
    status.textContent = 'Add notes or upload a file first.';
    return;
  }

  status.textContent = 'Creating a quick summary...';
  results.innerHTML = renderSummary(text);
});

guideBtn.addEventListener('click', () => {
  const text = getText();
  if (!text) {
    status.textContent = 'Add notes or upload a file first.';
    return;
  }

  status.textContent = 'Building a study guide...';
  results.innerHTML = renderGuide(text);
});

quizBtn.addEventListener('click', () => {
  const text = getText();
  if (!text) {
    status.textContent = 'Add notes or upload a file first.';
    return;
  }

  status.textContent = 'Generating quiz prompts...';
  results.innerHTML = renderQuiz(text);
});

focusBtn.addEventListener('click', () => {
  const text = getText();
  if (!text) {
    status.textContent = 'Add notes or upload a file first.';
    return;
  }

  status.textContent = 'Unlocking a focus challenge...';
  results.innerHTML = renderFocusPuzzle(text);
});

geminiBtn.addEventListener('click', async () => {
  const key = geminiKeyInput.value.trim();
  const prompt = geminiPromptInput.value.trim();
  const text = getText();

  if (!key || !prompt) {
    geminiOutput.innerHTML = '<p>Enter a Gemini key and a prompt to use the extension.</p>';
    return;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${prompt}\n\nContext:\n${text || 'No study material has been loaded yet.'}`
          }]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini request failed.');
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Gemini returned no content.';
    geminiOutput.innerHTML = `<p>${escapeHtml(reply)}</p>`;
  } catch (error) {
    geminiOutput.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
});

function getText() {
  const text = notesInput.value.trim();
  state.text = text;
  return text;
}

async function readFile(file) {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return readPdf(file);
  }

  return file.text();
}

async function readPdf(file) {
  const pdfData = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const chunks = [];

  for (let index = 1; index <= pdf.numPages; index += 1) {
    const page = await pdf.getPage(index);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(' ');
    chunks.push(text);
  }

  return chunks.join('\n\n');
}

function renderSummary(text) {
  const sentences = splitSentences(text);
  const scored = sentences
    .map((sentence) => ({ sentence, score: sentence.split(/\s+/).length + countKeywords(sentence) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const items = scored.map(({ sentence }) => `<li>${escapeHtml(sentence.trim())}</li>`).join('');
  return `<ul>${items}</ul>`;
}

function renderGuide(text) {
  const sections = text
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean)
    .slice(0, 5);

  const guide = sections
    .map((section, index) => {
      const heading = section.split(/\s+/).slice(0, 6).join(' ');
      return `<li><strong>Section ${index + 1}:</strong> ${escapeHtml(heading)}…</li>`;
    })
    .join('');

  return `<ul>${guide}</ul>`;
}

function renderQuiz(text) {
  const chunks = text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, 5);

  const questions = chunks
    .map((chunk, index) => {
      const short = chunk.split(/\s+/).slice(0, 12).join(' ');
      return `<li><strong>Q${index + 1}.</strong> What is the main idea of: “${escapeHtml(short)}”?</li>`;
    })
    .join('');

  return `<ul>${questions}</ul>`;
}

function renderFocusPuzzle(text) {
  const terms = text
    .toLowerCase()
    .match(/\b[a-z]{5,}\b/g)
    ?.filter((word) => word.length > 5)
    .slice(0, 5) || ['focus', 'memory', 'study'];

  const target = terms[0];
  const scrambled = scrambleWord(target);

  return `
    <p>Concentration sprint: unscramble the word.</p>
    <p><strong>${escapeHtml(scrambled)}</strong></p>
    <p>Hint: it is related to your chapter.</p>
    <input id="puzzleAnswer" placeholder="Type your answer" />
    <button id="checkPuzzleBtn">Check answer</button>
    <div id="puzzleResult" class="status"></div>
  `;
}

function scrambleWord(word) {
  const chars = word.split('');
  for (let index = 0; index < chars.length; index += 1) {
    const swapIndex = Math.floor(Math.random() * chars.length);
    [chars[index], chars[swapIndex]] = [chars[swapIndex], chars[index]];
  }
  return chars.join('');
}

results.addEventListener('click', (event) => {
  if (event.target.id === 'checkPuzzleBtn') {
    const answer = document.getElementById('puzzleAnswer').value.trim().toLowerCase();
    const target = results.innerHTML.match(/<strong>(.*?)<\/strong>/)?.[1]?.toLowerCase() || '';
    const puzzleResult = document.getElementById('puzzleResult');

    if (answer && answer === target) {
      puzzleResult.textContent = 'Nice job. Your focus streak is growing.';
    } else {
      puzzleResult.textContent = 'Try again. A small win still counts.';
    }
  }
});

function splitSentences(text) {
  return (text.match(/[^.!?]+[.!?]+/g) || [text]).map((sentence) => sentence.trim()).filter(Boolean);
}

function countKeywords(sentence) {
  return (sentence.match(/\b(learn|study|chapter|topic|concept|theory|idea|focus|memory)\b/gi) || []).length;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
