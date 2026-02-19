/* =========================
   GET ARTICLE ID
========================= */

const params = new URLSearchParams(window.location.search);
const articleId = params.get("id");

if (!articleId) {
  console.error("❌ Article ID missing in URL");
}

/* =========================
   LOAD COMMENTS FROM BACKEND
========================= */

function loadComments() {
  if (!articleId) return;

  fetch(`http://127.0.0.1:8000/articles/${articleId}/comments`)
    .then(res => res.json())
    .then(comments => {

      console.log("Fetched comments:", comments); // DEBUG

      const list = document.getElementById("comments-list");
      list.innerHTML = "";

      if (!Array.isArray(comments) || comments.length === 0) {
        list.innerHTML = "<p style='opacity:0.7;'>No comments yet.</p>";
        return;
      }

      comments.forEach(c => {
        const div = document.createElement("div");
        div.className = "user-comment";
        div.textContent = c.text;
        list.appendChild(div);
      });
    })
    .catch(error => {
      console.error("❌ Failed to load comments:", error);
    });
}

loadComments();


/* =========================
   POST COMMENT TO BACKEND
========================= */

function postComment() {
  if (!articleId) return;

  const name = document.getElementById("username");
  const text = document.getElementById("comment-input");

  if (!name.value.trim() || !text.value.trim()) {
    alert("Enter name and comment");
    return;
  }

  const finalText = `${name.value}: ${text.value}`;

  fetch(`http://127.0.0.1:8000/articles/${articleId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: finalText })
  })
  .then(res => res.json())
  .then(data => {
    console.log("Comment added:", data); // DEBUG
    text.value = "";
    loadComments();
  })
  .catch(error => {
    console.error("❌ Failed to post comment:", error);
  });
}


/* =========================
   LOAD AI CLUSTERS
========================= */

function loadClusters() {
  if (!articleId) return;

  const container = document.getElementById("clusters-container");
  container.innerHTML = "Analyzing comments...";

  fetch(`http://127.0.0.1:8000/articles/${articleId}/clusters`)
    .then(res => res.json())
    .then(data => {

      console.log("Cluster response:", data); // DEBUG

      if (data.error) {
        container.innerHTML = data.error;
        return;
      }

      if (!Array.isArray(data)) {
        container.innerHTML = "Invalid cluster data.";
        return;
      }

      // Sort biggest cluster first
      data.sort((a, b) => (b.percentage || 0) - (a.percentage || 0));

      container.innerHTML = "";

      data.forEach(cluster => {

        const percentage = cluster.percentage ?? 0;

        const box = document.createElement("div");
        box.className = "cluster-box";

        const headline = document.createElement("h4");
        headline.innerHTML = `
          ${cluster.headline}
          <span class="cluster-percentage">
            ${percentage}%
          </span>
        `;

        box.appendChild(headline);
        container.appendChild(box);
      });
    })
    .catch(error => {
      console.error("❌ Failed to load clusters:", error);
      container.innerHTML = "Failed to load clusters.";
    });
}
