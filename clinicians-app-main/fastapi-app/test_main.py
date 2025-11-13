from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, World test 3!"}


def test_add_endpoint():
    response = client.get("/add?a=5&b=7")
    assert response.status_code == 200
    assert response.json() == {"result": 12}



# Command to run test
# pytest app/tests/test_main.py
# pytest app/test_main.py
# pytest test_main.py # probably this one
# can also do pytest -v test_main.py for more verbose output
# or run all tests in the folder with
# pytest -v 
# pytest -vv -s --tb=long
# -s to see print statements
# --tb=long for full tracebacks
