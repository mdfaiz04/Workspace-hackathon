from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
from collections import Counter
import numpy as np
import re

# Load model once (global)
model = SentenceTransformer("all-MiniLM-L6-v2")


def clean_text(text):
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z\s]", "", text)
    return text.lower()


def cluster_comments(comments, n_clusters=4):
    """
    Semantic clustering using sentence embeddings.
    """

    if len(comments) < n_clusters:
        n_clusters = len(comments)

    # 🔥 Convert comments to embeddings
    embeddings = model.encode(comments)

    # 🔥 KMeans on embeddings
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    kmeans.fit(embeddings)

    labels = kmeans.labels_

    clusters = {}

    for i, label in enumerate(labels):
        clusters.setdefault(label, []).append(comments[i])

    return clusters


def generate_cluster_headline(cluster_comments):
    """
    Generate clean headline from most meaningful frequent words.
    """

    words = []

    for comment in cluster_comments:
        cleaned = clean_text(comment)
        words.extend(cleaned.split())

    # Remove short and weak words
    weak_words = {"that", "they", "this", "with", "have", "from", "were", "been", "about", "really"}
    words = [w for w in words if len(w) > 3 and w not in weak_words]

    common_words = Counter(words).most_common(5)

    headline_words = [word for word, _ in common_words[:3]]

    if not headline_words:
        return "General Reaction"

    # 🔥 Capitalize nicely
    return " ".join(headline_words).title()