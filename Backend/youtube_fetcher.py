import os
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

if not YOUTUBE_API_KEY:
    raise ValueError("YOUTUBE_API_KEY not set in environment variables.")

youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)


def search_video(article_title):
    """
    Search YouTube using shortened headline.
    Returns first relevant video.
    """

    try:
        # 🔥 Shorten headline to increase match probability
        short_query = " ".join(article_title.split()[:7])

        request = youtube.search().list(
            q=short_query + " news",
            part="snippet",
            type="video",
            maxResults=1,  # still quota safe
            order="relevance"
        )

        response = request.execute()

    except HttpError as e:
        print("⚠ YouTube search error:", e)
        return None

    items = response.get("items", [])

    if not items:
        return None

    return items[0]["id"]["videoId"]


def fetch_comments(video_id):
    """
    Fetch limited top-level comments for a video.
    """

    try:
        request = youtube.commentThreads().list(
            part="snippet",
            videoId=video_id,
            maxResults=15,  # keep quota safe
            textFormat="plainText"
        )

        response = request.execute()

    except HttpError as e:
        print("⚠ Comment fetch error:", e)
        return []

    comments = []

    for item in response.get("items", []):
        comment_text = item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
        comments.append(comment_text)

    return comments