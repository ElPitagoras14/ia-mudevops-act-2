from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import get_connection
from app.routers import auth, users, books, reservations


@asynccontextmanager
async def lifespan(app: FastAPI):
    conn = get_connection()
    conn.close()
    yield


app = FastAPI(title="Book Booker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(books.router)
app.include_router(reservations.router)
