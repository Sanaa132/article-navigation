window.addEventListener("message", async (event) => {
    if (event.data.type !== "SEARCH_QUERY") return;
     
    console.log("Content script ACTIVE");
    const query = event.data.query;
    console.log("Query:", query);

    // ✅ DO NOT rely on article container
    const paragraphsArray = Array.from(
        document.querySelectorAll("h1, h2, h3, p, li")
    ).filter(el => {
        const text = el.innerText?.trim();
        return (
            text &&
            text.length > 20 &&
            el.offsetParent !== null // visible elements only
        );
    });

    if (paragraphsArray.length === 0) {
        console.warn("No readable content found on page.");
        return;
    }

    // Assign indices
    paragraphsArray.forEach((el, idx) => {
        el.dataset.tempId = idx;
    });

    const articleText = paragraphsArray
        .map(el => el.innerText)
        .join("\n\n");

    try {
        const response = await fetch("http://localhost:8080/api/rank", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ article: articleText, query })
        });

        if (!response.ok) {
            throw new Error("Backend error: " + response.status);
        }

        const ranked = await response.json();
        if (!ranked || ranked.length === 0) return;

        const bestIndex = ranked[0].index;
        const bestEl = paragraphsArray[bestIndex];

        if (bestEl) {
            bestEl.scrollIntoView({ behavior: "smooth", block: "center" });
            bestEl.style.backgroundColor = "#fffa90";

            setTimeout(() => {
                bestEl.style.transition = "background 2s";
                bestEl.style.backgroundColor = "transparent";
            }, 1500);
        }
    } catch (err) {
        console.error("Fetch failed:", err);
    }
});