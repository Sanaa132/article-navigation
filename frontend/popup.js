// ── Article Navigator — popup.js ─────────────────────────────────────────────
// Handles UI, API call, and message passing to content.js.

const BACKEND_URL = 'http://localhost:8080/api/rank';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const queryInput = document.getElementById('queryInput');
const searchBtn  = document.getElementById('searchBtn');
const statusEl   = document.getElementById('status');
const resultsEl  = document.getElementById('results');
const counterEl  = document.getElementById('counter');
const clearBtn   = document.getElementById('clearBtn');

// ── Local state ───────────────────────────────────────────────────────────────
let lastQuery     = '';   // tracks what was last searched
let hasResults    = false; // whether we currently have ranked results

// ── UI helpers ────────────────────────────────────────────────────────────────

function setStatus(msg, type = '') {
  statusEl.className = `status ${type}`;
  statusEl.innerHTML = msg;
}

function showResults(current, total) {
  counterEl.textContent = `${current} of ${total}`;
  resultsEl.classList.add('visible');
}

function hideResults() {
  resultsEl.classList.remove('visible');
}

function setLoading(on) {
  searchBtn.disabled = on;
  setStatus(
    on ? '<span class="spinner"></span>Ranking paragraphs…' : '',
    on ? 'loading' : ''
  );
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToContent(tabId, msg) {
  return chrome.tabs.sendMessage(tabId, msg);
}

// ── Search logic ──────────────────────────────────────────────────────────────

async function handleSearch() {
  const query = queryInput.value.trim();

  if (!query) {
    setStatus('Please enter a search query.', 'error');
    return;
  }

  const tab = await getActiveTab();

  // ── Same query → cycle to next result ────────────────────────────────────
  if (query === lastQuery && hasResults) {
    const nav = await sendToContent(tab.id, { type: 'NEXT_RESULT' });

    if (!nav.ok && nav.reason === 'end_of_results') {
      setStatus(`End of top ${nav.total} results. Edit query to search again.`, '');
      return;
    }

    if (!nav.ok && nav.reason === 'no_results') {
      setStatus('No results to navigate.', '');
      return;
    }

    showResults(nav.current, nav.total);
    return;
  }

  // ── New query → full search flow ──────────────────────────────────────────
  setLoading(true);
  hideResults();
  hasResults = false;

  try {
    // Step 1: Extract paragraphs from the page
    let extraction;
    try {
      extraction = await sendToContent(tab.id, { type: 'EXTRACT_PARAGRAPHS' });
    } catch {
      setStatus('Cannot access this page. Try a regular article page.', 'error');
      setLoading(false);
      return;
    }

    const { texts } = extraction;

    if (!texts || texts.length === 0) {
      setStatus('No readable paragraphs found on this page.', 'error');
      setLoading(false);
      return;
    }

    // Step 2: Send query + paragraphs to Spring Boot backend
    let data;
    try {
      const res = await fetch(BACKEND_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ query, paragraphs: texts }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch (err) {
      setStatus(
        `Backend unreachable. Is Spring Boot running?<br><small>${err.message}</small>`,
        'error'
      );
      setLoading(false);
      return;
    }

    const { rankedIndices } = data;

    if (!rankedIndices || rankedIndices.length === 0) {
      setStatus('No relevant paragraphs found for this query.', '');
      setLoading(false);
      return;
    }

    // Step 3: Send NEW_SEARCH to content.js → it highlights + scrolls
    const nav = await sendToContent(tab.id, {
      type:    'NEW_SEARCH',
      query,
      indices: rankedIndices,
    });

    if (!nav.ok) {
      setStatus('No relevant paragraphs found for this query.', '');
      setLoading(false);
      return;
    }

    // Update state
    lastQuery  = query;
    hasResults = true;

    setLoading(false);
    setStatus('');
    showResults(nav.current, nav.total);

  } catch (err) {
    setStatus(`Unexpected error: ${err.message}`, 'error');
    setLoading(false);
  }
}

// ── Clear ─────────────────────────────────────────────────────────────────────

async function handleClear() {
  const tab = await getActiveTab();
  await sendToContent(tab.id, { type: 'CLEAR' });
  hideResults();
  setStatus('');
  lastQuery  = '';
  hasResults = false;
  queryInput.value = '';
  queryInput.focus();
}

// ── Event listeners ───────────────────────────────────────────────────────────

searchBtn.addEventListener('click', handleSearch);

// Enter key triggers search
queryInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSearch();
});

// If user edits query, clear cached state so next search is treated as new
queryInput.addEventListener('input', () => {
  if (queryInput.value.trim() !== lastQuery) {
    hasResults = false;
  }
});

clearBtn.addEventListener('click', handleClear);

// Auto-focus on popup open
queryInput.focus();