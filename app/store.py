import sqlite3, threading
from typing import Optional
from .models import Review


class Store:
    def __init__(self, path: str = "scopelock.db"):
        self._db = sqlite3.connect(path, check_same_thread=False)
        self._lock = threading.Lock()
        with self._lock:
            self._db.execute("CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, body TEXT NOT NULL)")
            self._db.commit()

    def save(self, review: Review) -> None:
        with self._lock:
            self._db.execute("INSERT OR REPLACE INTO reviews (id, body) VALUES (?, ?)", (review.id, review.model_dump_json()))
            self._db.commit()

    def get(self, review_id: str) -> Optional[Review]:
        with self._lock:
            row = self._db.execute("SELECT body FROM reviews WHERE id = ?", (review_id,)).fetchone()
        return Review.model_validate_json(row[0]) if row else None
