import psycopg2
from psycopg2.extras import RealDictCursor
from app.config import settings


def get_connection():
    conn = psycopg2.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
    )
    conn.autocommit = False
    return conn


def execute_query(query: str, params=None):
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute(query, params)
        conn.commit()
        return cursor.fetchall()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


def execute_insert(query: str, params=None):
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute(query, params)
        conn.commit()
        return cursor.fetchone()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()
