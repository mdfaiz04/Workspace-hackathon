from pymongo import MongoClient

MONGO_URI = "mongodb://localhost:27017"

client = MongoClient(MONGO_URI)
db = client["newsroom_ai"]

articles_col = db["articles"]
comments_col = db["comments"]

# ---------------- INDEXES ----------------
# Ensures faster lookups and avoids duplicate article IDs

articles_col.create_index("id", unique=True)
comments_col.create_index("article_id")

# ---------------- UTILITIES ----------------

def clear_articles(source: str = None):
    """
    Clear articles collection.
    If source is provided, clears only that source.
    """
    if source:
        result = articles_col.delete_many({"source": source})
    else:
        result = articles_col.delete_many({})

    print(f"🗑️ Deleted {result.deleted_count} articles")


def clear_comments(article_id: str = None):
    """
    Clear comments collection.
    If article_id is provided, clears only comments for that article.
    """
    if article_id:
        result = comments_col.delete_many({"article_id": article_id})
    else:
        result = comments_col.delete_many({})

    print(f"🗑️ Deleted {result.deleted_count} comments")