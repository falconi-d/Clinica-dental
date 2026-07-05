from fastapi import FastAPI
from dotenv import load_dotenv
from supabase import create_client, Client
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

@app.get("/")
def read_root():
    return {"mensaje": "Backend de Sonrisa funcionando correctamente"}

@app.get("/tratamientos")
def get_tratamientos():
    response = supabase.table("tratamientos").select("*").execute()
    return response.data