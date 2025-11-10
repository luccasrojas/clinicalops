from fastapi import FastAPI
from routers import add_router_example
from routers import transcribe_router

app = FastAPI()
app.include_router(add_router_example.router)
app.include_router(transcribe_router.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Hello, World test 3!"}

# TODO: middleware that checks for webhook secret in headers for security
# only applicable to post requests and that also checks for env var set to production
# dev mode and get requests should not require this


