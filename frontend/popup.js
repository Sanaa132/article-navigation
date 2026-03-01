const searchBtn = document.getElementById("searchBtn");
const queryInput = document.getElementById("query");

searchBtn.addEventListener("click",  () => {
    const query = queryInput.value.trim();
    if (!query) return; // ignore empty queries

    searchBtn.disabled = true; // prevent double-click
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            func: (q) => window.postMessage({type:"SEARCH_QUERY", query: q}, "*"),
            args: [query]
        });
    });

    setTimeout(() => { searchBtn.disabled = false; }, 1500); // re-enable after 1.5s
});