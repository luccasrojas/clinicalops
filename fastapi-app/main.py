from fastapi import FastAPI
from routers import transcribe_router

app = FastAPI()
app.include_router(transcribe_router.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Hello, World test 3!"}
