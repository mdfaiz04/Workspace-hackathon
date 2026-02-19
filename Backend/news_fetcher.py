import requests
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

from Backend.db import articles_col, comments_col
from Backend.youtube_fetcher import search_video, fetch_comments

NEWS_API_KEY = os.getenv("NEWS_API_KEY")

NEWS_URL = "https://newsapi.org/v2/top-headlines"


def is_valid_article(article):
    title = article.get("title", "")
    description = article.get("description", "")

    if not title or len(title.strip()) < 20:
        return False

    # 🚫 Skip live / generic pages
    forbidden_keywords = [
        "watch live",
        "live online",
        "live updates",
        "breaking news live",
        "live:",
        "live blog"
    ]

    if any(keyword in title.lower() for keyword in forbidden_keywords):
        return False

    # 🚫 Skip low-content articles
    if not description or len(description.strip()) < 30:
        return False

    return True


def fetch_and_store_articles():
    print("🚀 Fetching 2 clean articles (Filtered Mode)...")

    if not NEWS_API_KEY:
        print("❌ NEWS_API_KEY not set.")
        return

    params = {
        "language": "en",
        "pageSize": 2,  # fetch extra to allow filtering
        "sources": "bbc-news,cnn,reuters",
        "apiKey": NEWS_API_KEY
    }

    response = requests.get(NEWS_URL, params=params)
    print("Status code:", response.status_code)

    if response.status_code != 200:
        print("❌ NewsAPI error:", response.text)
        return

    data = response.json()

    articles_col.delete_many({"source": "newsapi"})
    comments_col.delete_many({"source": "youtube"})

    inserted_count = 0

    for article in data.get("articles", []):
        if inserted_count >= 2:
            break

        if not is_valid_article(article):
            print("⛔ Skipping invalid/live article")
            continue

        title = article.get("title")
        print(f"\n🔎 Processing: {title}")

        try:
            video_id = search_video(title)
        except Exception as e:
            print("⚠ YouTube search failed:", e)
            continue

        if not video_id:
            print("⛔ No trusted video found")
            continue

        try:
            comments = fetch_comments(video_id)
        except Exception as e:
            print("⚠ Comment fetch failed:", e)
            continue

        if not comments:
            print("⛔ No comments found")
            continue

        article_id = str(uuid.uuid4())

        articles_col.insert_one({
            "id": article_id,
            "title": title,
            "summary": article.get("description"),
            "content": article.get("content"),
            "url": article.get("url"),
            "source": "newsapi",
            "video_id": video_id,
            "published_at": article.get("publishedAt")
        })

        for comment_text in comments[:15]:
            comments_col.insert_one({
                "article_id": article_id,
                "text": comment_text,
                "source": "youtube"
            })

        inserted_count += 1
        print(f"✅ Stored article with {len(comments[:15])} comments")

    print(f"\n🎯 Final stored clean articles: {inserted_count}")
