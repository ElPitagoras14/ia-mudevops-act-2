from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import get_current_user, require_role
from app.db import execute_query, execute_insert
from app.schemas import BookCreate, BookResponse, BookUpdate

router = APIRouter(prefix="/books", tags=["books"])
admin_required = Depends(require_role("admin"))


@router.get("", response_model=list[BookResponse])
def list_books(_: dict = Depends(get_current_user)):
    rows = execute_query(
        "SELECT id, title, author, isbn, available, created_at FROM books ORDER BY title ASC"
    )
    return [BookResponse(**row) for row in rows]


@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(body: BookCreate, _: dict = admin_required):
    existing = execute_query("SELECT id FROM books WHERE isbn = %s", (body.isbn,))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="ISBN already exists",
        )
    book = execute_insert(
        "INSERT INTO books (title, author, isbn) VALUES (%s, %s, %s) RETURNING id, title, author, isbn, available, created_at",
        (body.title, body.author, body.isbn),
    )
    return BookResponse(**book)


@router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: str, _: dict = Depends(get_current_user)):
    rows = execute_query(
        "SELECT id, title, author, isbn, available, created_at FROM books WHERE id = %s",
        (book_id,),
    )
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )
    return BookResponse(**rows[0])


@router.put("/{book_id}", response_model=BookResponse)
def update_book(book_id: str, body: BookUpdate, _: dict = admin_required):
    existing = execute_query(
        "SELECT id, title, author, isbn, available, created_at FROM books WHERE id = %s",
        (book_id,),
    )
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )
    fields = {}
    if body.title is not None:
        fields["title"] = body.title
    if body.author is not None:
        fields["author"] = body.author
    if body.isbn is not None:
        fields["isbn"] = body.isbn
    if not fields:
        return BookResponse(**existing[0])
    set_clause = ", ".join(f"{k} = %s" for k in fields)
    values = list(fields.values()) + [book_id]
    book = execute_insert(
        f"UPDATE books SET {set_clause} WHERE id = %s RETURNING id, title, author, isbn, available, created_at",
        values,
    )
    return BookResponse(**book)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: str, _: dict = admin_required):
    from app.db import get_connection
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM books WHERE id = %s", (book_id,))
        if cursor.rowcount == 0:
            conn.rollback()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Book not found",
            )
        conn.commit()
    finally:
        cursor.close()
        conn.close()
