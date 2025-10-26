from modules.add_module_example import add_numbers
from fastapi import APIRouter

router = APIRouter()

@router.get("/add")
def add_endpoint(a: int = 2, b: int = 3):
    return {"result": add_numbers(a, b)}