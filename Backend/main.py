from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from datetime import datetime

from Backend.clustering import cluster_comments, generate_cluster_headline
from Backend.db import articles_col, comments_col
from Backend.news_fetcher import fetch_and_store_articles

app = FastAPI()

# ---------------- STATIC & TEMPLATES ----------------

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# ---------------- CORS ----------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- STARTUP PIPELINE ----------------

@app.on_event("startup")
def startup_event():
    print("🚀 Starting VISAI backend...")
    fetch_and_store_articles()
    print("✅ Startup pipeline complete")


# ---------------- PAGE ROUTES ----------------

@app.get("/")
def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/articles")
def get_articles_page(request: Request):
    # To maintain existing API functionality while serving the template
    if "text/html" in request.headers.get("accept", ""):
        return templates.TemplateResponse("articles.html", {"request": request})
    return list(articles_col.find({}, {"_id": 0}))


@app.get("/article")
def get_article_page(request: Request):
    return templates.TemplateResponse("article.html", {"request": request})


@app.get("/analytics")
def get_analytics_page(request: Request):
    return templates.TemplateResponse("analytics.html", {"request": request})


# ---------------- ARTICLES API ----------------

@app.get("/articles/{article_id}")
def get_article(article_id: str):
    article = articles_col.find_one({"id": article_id}, {"_id": 0})
    if not article:
        return {"error": "Article not found"}
    return article


# ---------------- COMMENTS API ----------------

@app.get("/articles/{article_id}/comments")
def get_comments(article_id: str):
    return list(
        comments_col.find(
            {"article_id": article_id},
            {"_id": 0}
        )
    )


@app.post("/articles/{article_id}/comments")
def add_comment(article_id: str, comment: dict):
    if not comment.get("text"):
        return {"error": "Comment text is required"}

    comments_col.insert_one({
        "article_id": article_id,
        "text": comment["text"],
        "source": "manual",
        "created_at": datetime.utcnow()
    })

    return {"message": "Comment added successfully"}


# ---------------- AI CLUSTERS API ----------------

@app.get("/articles/{article_id}/clusters")
def get_clusters(article_id: str):

    comments = list(
        comments_col.find(
            {"article_id": article_id},
            {"_id": 0, "text": 1}
        )
    )

    comment_texts = [c["text"] for c in comments if c.get("text")]

    if not comment_texts:
        return {"error": "No comments found"}

    clusters = cluster_comments(comment_texts, n_clusters=4)
    total_comments = len(comment_texts)

    result = []

    for cluster_id, cluster_comments_list in clusters.items():

        if not cluster_comments_list:
            continue

        headline = generate_cluster_headline(cluster_comments_list)

        percentage = round(
            (len(cluster_comments_list) / total_comments) * 100,
            1
        )

        result.append({
            "cluster_id": int(cluster_id),
            "headline": headline,
            "percentage": percentage
        })

    # Sort clusters by highest percentage first
    result = sorted(result, key=lambda x: x["percentage"], reverse=True)

    return result