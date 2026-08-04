from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from database import engine
from models import Base
from routers import auth, ai, history

# Create all tables on startup (simple auto-migration for this project).
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI DSA MENTOR")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(ai.router)
app.include_router(history.router)

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", include_in_schema=False)
async def read_root():
    """Serve the single-page dashboard frontend."""
    return FileResponse("index.html")
