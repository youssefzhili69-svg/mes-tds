from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import requests, os

load_dotenv()

app = FastAPI(title="MES TDS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DOLIBARR_URL = os.getenv("DOLIBARR_URL")
API_KEY = os.getenv("DOLIBARR_API_KEY")
HEADERS = {"DOLAPIKEY": API_KEY}

@app.get("/api/orders")
def get_manufacturing_orders():
    """Récupère les ordres de fabrication depuis Dolibarr"""
    res = requests.get(
        f"{DOLIBARR_URL}/api/index.php/mos",
        headers=HEADERS,
        params={"limit": 50, "sortfield": "t.rowid", "sortorder": "DESC"}
    )
    if res.status_code != 200:
        return {"error": f"Dolibarr returned {res.status_code}", "detail": res.text}
    return res.json()

@app.get("/api/products")
def get_products():
    res = requests.get(
        f"{DOLIBARR_URL}/api/index.php/products",
        headers=HEADERS,
        params={"limit": 50}
    )
    return res.json()

@app.get("/api/stats")
def get_stats():
    """Stats résumées pour le dashboard"""
    orders_res = requests.get(
        f"{DOLIBARR_URL}/api/index.php/mos",
        headers=HEADERS,
        params={"limit": 100}
    )
    orders = orders_res.json() if orders_res.status_code == 200 else []

    stats = {
        "total": len(orders),
        "en_cours": sum(1 for o in orders if str(o.get("status")) == "3"),
        "termines": sum(1 for o in orders if str(o.get("status")) == "9"),
        "en_attente": sum(1 for o in orders if str(o.get("status")) == "1"),
    }
    return stats