
// ── Article Navigator — content.js ───────────────────────────────────────────
// Handles all DOM work: paragraph extraction, highlighting, scrolling.
// Communicates with popup.js via chrome.runtime.onMessage.

(() => {

  // ── State ──────────────────────────────────────────────────────────────────
  let paragraphs     = [];   // all <p> elements on the page
  let rankedIndices  = [];   // top-5 indices from backend, best → worst
  let currentPointer = 0;    // current position in rankedIndices
  let lastQuery      = '';   // last query string sent

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Collect all <p> tags with meaningful content */
  function extractParagraphs() {
    paragraphs = Array.from(document.querySelectorAll('p'))
      .filter(el => el.innerText.trim().length > 30);
    return paragraphs.map(el => el.innerText.trim());
  }

  /** Remove highlight class from all paragraphs */
  function clearHighlights() {
    document.querySelectorAll('.an-highlight, .an-highlight-active')
      .forEach(el => el.classList.remove('an-highlight', 'an-highlight-active'));
  }

  /**
   * Scroll to the paragraph at rankedIndices[currentPointer].
   * Highlights it yellow for 2 seconds then fades back.
   */
  function scrollToCurrent() {
    const targetIndex = rankedIndices[currentPointer];
    const el          = paragraphs[targetIndex];
    if (!el) return;

    clearHighlights();

    // Highlight active paragraph
    el.classList.add('an-highlight-active');

    // Smooth scroll
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Remove highlight after 2 seconds
    setTimeout(() => {
      el.classList.remove('an-highlight-active');
    }, 2000);
  }

  // ── Message listener ───────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {

    // ── EXTRACT_PARAGRAPHS ─────────────────────────────────────────────────
    // popup.js calls this first to get all paragraph texts from the page.
    if (msg.type === 'EXTRACT_PARAGRAPHS') {
      const texts = extractParagraphs();
      sendResponse({ texts, count: texts.length });
      return true;
    }

    // ── NEW_SEARCH ─────────────────────────────────────────────────────────
    // Called when a new query is submitted (different from lastQuery).
    // Resets pointer to 0 and scrolls to the best match.
    if (msg.type === 'NEW_SEARCH') {
      const { query, indices } = msg;

      if (!indices || indices.length === 0) {
        sendResponse({ ok: false, reason: 'no_results' });
        return true;
      }

      // Reset state for new query
      lastQuery      = query;
      rankedIndices  = indices.slice(0, 5);   // keep top 5 only
      currentPointer = 0;

      // Re-extract in case DOM changed since EXTRACT_PARAGRAPHS
      extractParagraphs();
      scrollToCurrent();

      sendResponse({
        ok:      true,
        current: currentPointer + 1,
        total:   rankedIndices.length,
      });
      return true;
    }

    // ── NEXT_RESULT ────────────────────────────────────────────────────────
    // Called when user clicks Search again with the same query.
    // Advances pointer by 1. Stops after top 5.
    if (msg.type === 'NEXT_RESULT') {
      if (rankedIndices.length === 0) {
        sendResponse({ ok: false, reason: 'no_results' });
        return true;
      }

      // If already at last result → do nothing (don't loop)
      if (currentPointer >= rankedIndices.length - 1) {
        sendResponse({
          ok:      false,
          reason:  'end_of_results',
          current: currentPointer + 1,
          total:   rankedIndices.length,
        });
        return true;
      }

      currentPointer++;
      scrollToCurrent();

      sendResponse({
        ok:      true,
        current: currentPointer + 1,
        total:   rankedIndices.length,
      });
      return true;
    }

    // ── CLEAR ──────────────────────────────────────────────────────────────
    if (msg.type === 'CLEAR') {
      clearHighlights();
      rankedIndices  = [];
      currentPointer = 0;
      lastQuery      = '';
      sendResponse({ ok: true });
      return true;
    }

  });

})();