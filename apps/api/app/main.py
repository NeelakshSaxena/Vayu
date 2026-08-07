from fastapi import FastAPI

app = FastAPI(title="Vayu API")

@app.get("/")
def read_root():
    return {"message": "Welcome to Vayu API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
