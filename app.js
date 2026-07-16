const notesInput = document.getElementById('notesInput');
const fileInput = document.getElementById('fileInput');
const themeToggle = document.getElementById('themeToggle');
const petMascot = document.getElementById('petMascot');
const petStatus = document.getElementById('petStatus');
const petCheerBtn = document.getElementById('petCheerBtn');
const petName = document.getElementById('petName');
const petChoices = document.querySelectorAll('.pet-choice');
const results = document.getElementById('results');
const status = document.getElementById('status');
const geminiKeyInput = document.getElementById('geminiKey');
const geminiPromptInput = document.getElementById('geminiPrompt');
const geminiBtn = document.getElementById('geminiBtn');
const geminiOutput = document.getElementById('geminiOutput');

const state = {
  text: '',
  theme: localStorage.getItem('study-theme') || 'dark'
};

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js';
}

applyTheme(state.theme);

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;

  try {
    status.textContent = 'Reading your material...';
    const text = await readFile(file);
    state.text = text;
    notesInput.value = text;
    celebratePet('Material loaded. You are ready to learn.');
    status.textContent = 'Material loaded. Pick a study action.';
  } catch (error) {
    status.textContent = 'The file could not be read. Try a smaller PDF or plain text.';
    console.error(error);
  }
});

document.querySelectorAll('[data-action]').forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.getAttribute('data-action');
    const text = getText();

    if (!text) {
      status.textContent = 'Add notes or upload a file first.';
      return;
    }

    if (action === 'summarize') {
      status.textContent = 'Creating a quick summary...';
      results.innerHTML = renderSummary(text);
      celebratePet('A crisp summary is ready.');
    }

    if (action === 'guide') {
      status.textContent = 'Building a study guide...';
      results.innerHTML = renderGuide(text);
      celebratePet('A calm guide is here.');
    }

    if (action === 'quiz') {
      status.textContent = 'Generating a friendly quiz...';
      results.innerHTML = renderQuiz(text);
      celebratePet('Quiz time! You can do this.');
    }

    if (action === 'focus') {
      status.textContent = 'Opening a focus sprint...';
      results.innerHTML = renderFocusPuzzle(text);
      celebratePet('Tiny challenge unlocked.');
    }
  });
});

themeToggle.addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(state.theme);
  localStorage.setItem('study-theme', state.theme);
});

petCheerBtn.addEventListener('click', () => {
  celebratePet(`${petName.textContent} is cheering for you. Keep going!`);
});

petChoices.forEach((choice) => {
  choice.addEventListener('click', () => {
    petChoices.forEach((btn) => btn.classList.remove('active'));
    choice.classList.add('active');
    petName.textContent = choice.getAttribute('data-pet');
    petStatus.textContent = `${choice.getAttribute('data-pet')} is ready to cheer you on.`;
  });
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
        contents: [{ parts: [{ text: `${prompt}\n\nContext:\n${text || 'No study material has been loaded yet.'}` }] }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini request failed.');
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Gemini returned no content.';
    geminiOutput.innerHTML = `<p>${escapeHtml(reply)}</p>`;
    celebratePet('Gemini gave you a fresh boost.');
  } catch (error) {
    geminiOutput.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
});

results.addEventListener('click', (event) => {
  if (event.target.id === 'checkPuzzleBtn') {
    const answerInput = document.getElementById('puzzleAnswer');
    const puzzleResult = document.getElementById('puzzleResult');
    const answer = answerInput.value.trim().toLowerCase();
    const target = results.innerHTML.match(/<strong>(.*?)<\/strong>/)?.[1]?.toLowerCase() || '';

    if (answer && answer === target) {
      puzzleResult.textContent = 'Perfect. Your focus streak just leveled up.';
      celebratePet('You solved it!');
    } else {
      puzzleResult.textContent = 'Nice try. One more go is still progress.';
    }
  }
});

function applyTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
  themeToggle.textContent = theme === 'light' ? '☾' : '☀︎';
}

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
  const sections = text.split(/\n{2,}/).map((section) => section.trim()).filter(Boolean).slice(0, 4);

  const guide = sections.map((section, index) => {
    const heading = section.split(/\s+/).slice(0, 8).join(' ');
    return `<li><strong>Step ${index + 1}:</strong> ${escapeHtml(heading)}…</li>`;
  }).join('');

  return `<ul>${guide}</ul>`;
}

function renderQuiz(text) {
  const chunks = text.split(/\n{2,}/).map((chunk) => chunk.trim()).filter(Boolean).slice(0, 3);

  const questions = chunks.map((chunk, index) => {
    const short = chunk.split(/\s+/).slice(0, 10).join(' ');
    return `<li><strong>Q${index + 1}.</strong> What is the main idea of: “${escapeHtml(short)}”?</li>`;
  }).join('');

  return `<ul>${questions}</ul>`;
}

function renderFocusPuzzle(text) {
  const terms = text.toLowerCase().match(/\b[a-z]{5,}\b/g)?.filter((word) => word.length > 5).slice(0, 5) || ['focus', 'memory', 'study'];
  const target = terms[0];
  const scrambled = scrambleWord(target);

  return `
    <p>Concentration sprint: unscramble the word.</p>
    <p><strong>${escapeHtml(scrambled)}</strong></p>
    <p>Hint: it is related to your chapter.</p>
    <input id="puzzleAnswer" placeholder="Type your answer" />
    <button class="secondary-button" id="checkPuzzleBtn">Check answer</button>
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

function celebratePet(message) {
  petStatus.textContent = message;
  petMascot.classList.remove('celebrate');
  void petMascot.offsetWidth;
  petMascot.classList.add('celebrate');
  window.clearTimeout(celebratePet.timeout);
  celebratePet.timeout = window.setTimeout(() => {
    petMascot.classList.remove('celebrate');
    petStatus.textContent = 'Nova is ready to cheer you on.';
  }, 1200);
}

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
