from fastapi import FastAPI

app = FastAPI(title="AI ONE COMPANY API")

@app.get("/health")
def health_check():
    return {"status": "ok"}
