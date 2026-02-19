
function goArticles() {
  window.location.href = "articles.html";
}

function goAnalytics() {
  window.location.href = "analytics.html";
}

// ---------- NEW: Backend Article Loading ----------
document.addEventListener("DOMContentLoaded", () => {
  fetch("http://127.0.0.1:8000/articles")
    .then(response => response.json())
    .then(articles => {
      const container = document.getElementById("articles-container");

      if (!container) {
        console.error("articles-container div not found");
        return;
      }

      // Clear old static content
      container.innerHTML = "";

      articles.forEach(article => {
        const card = document.createElement("div");
        card.className = "article-card";

        card.innerHTML = `
          <h2>${article.title}</h2>
          <p>${article.summary}</p>
          <button class="read-btn" data-id="${article.id}">
            Read More
          </button>
        `;

        container.appendChild(card);
      });

      // Button click → open article
      document.querySelectorAll(".read-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          window.location.href = `article.html?id=${id}`;
        });
      });
    })
    .catch(error => {
      console.error("Error fetching articles:", error);
    });
});