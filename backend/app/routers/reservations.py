import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import get_current_user, require_role
from app.db import get_connection
from app.schemas import ReservationCreate, ReservationDetailResponse, ReservationResponse

router = APIRouter(prefix="/reservations", tags=["reservations"])


@router.post("", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
def reserve_book(body: ReservationCreate, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT id, title, available FROM books WHERE id = %s FOR UPDATE",
            (str(body.book_id),),
        )
        book = cursor.fetchone()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Book not found",
            )
        if not book[2]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Book is not available",
            )
        cursor.execute(
            "SELECT id FROM reservations WHERE user_id = %s AND book_id = %s AND returned_at IS NULL",
            (str(current_user["id"]), str(body.book_id)),
        )
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have an active reservation for this book",
            )
        cursor.execute(
            "UPDATE books SET available = FALSE WHERE id = %s",
            (str(body.book_id),),
        )
        cursor.execute(
            "INSERT INTO reservations (user_id, book_id) VALUES (%s, %s) RETURNING id, user_id, book_id, reserved_at, returned_at",
            (str(current_user["id"]), str(body.book_id)),
        )
        reservation = cursor.fetchone()
        conn.commit()
        return ReservationResponse(
            id=str(reservation[0]),
            book_id=str(reservation[2]),
            user_id=str(reservation[1]),
            reserved_at=reservation[3],
            returned_at=reservation[4],
        )
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()


@router.get("/me", response_model=list[ReservationDetailResponse])
def my_reservations(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """SELECT r.id, r.reserved_at, r.returned_at,
                      b.id as book_id, b.title, b.author
               FROM reservations r
               JOIN books b ON r.book_id = b.id
               WHERE r.user_id = %s
               ORDER BY r.reserved_at DESC""",
            (str(current_user["id"]),),
        )
        rows = cursor.fetchall()
        conn.commit()
        return [
            ReservationDetailResponse(
                id=str(row[0]),
                book_title=row[4],
                book_author=row[5],
                reserved_at=row[1],
                returned_at=row[2],
            )
            for row in rows
        ]
    finally:
        cursor.close()
        conn.close()


@router.get("", response_model=list[ReservationDetailResponse])
def list_all_reservations(_: dict = Depends(require_role("admin"))):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """SELECT r.id, r.reserved_at, r.returned_at,
                      u.username, b.title, b.author
               FROM reservations r
               JOIN users u ON r.user_id = u.id
               JOIN books b ON r.book_id = b.id
               ORDER BY r.reserved_at DESC"""
        )
        rows = cursor.fetchall()
        conn.commit()
        return [
            ReservationDetailResponse(
                id=str(row[0]),
                book_title=row[4],
                book_author=row[5],
                reserved_at=row[1],
                returned_at=row[2],
            )
            for row in rows
        ]
    finally:
        cursor.close()
        conn.close()


@router.patch("/{reservation_id}/return", response_model=ReservationDetailResponse)
def return_book(reservation_id: uuid.UUID, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT r.id, r.user_id, r.book_id, r.reserved_at, r.returned_at, "
            "b.title, b.author "
            "FROM reservations r "
            "JOIN books b ON r.book_id = b.id "
            "WHERE r.id = %s",
            (str(reservation_id),),
        )
        reservation = cursor.fetchone()
        if not reservation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found",
            )
        if str(reservation[1]) != str(current_user["id"]):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found",
            )
        if reservation[4] is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Reservation already returned",
            )
        cursor.execute(
            "UPDATE reservations SET returned_at = NOW() WHERE id = %s AND returned_at IS NULL",
            (str(reservation_id),),
        )
        cursor.execute(
            "UPDATE books SET available = TRUE WHERE id = %s",
            (str(reservation[2]),),
        )
        conn.commit()
        return ReservationDetailResponse(
            id=str(reservation[0]),
            book_title=reservation[5],
            book_author=reservation[6],
            reserved_at=reservation[3],
            returned_at=reservation[4],
        )
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()
