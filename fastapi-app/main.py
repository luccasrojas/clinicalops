from fastapi import FastAPI
from routers import transcribe_router

app = FastAPI()
app.include_router(transcribe_router.router, prefix="/api")
