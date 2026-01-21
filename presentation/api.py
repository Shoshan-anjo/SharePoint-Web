import os
from fastapi import FastAPI, Depends, Query, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uvicorn

from infrastructure.sharepoint.graph_sharepoint_reader import GraphSharePointReader
from application.use_cases.get_filtered_items import GetFilteredItemsUseCase

# Security Settings
API_SECRET_KEY = os.getenv("API_SECRET_KEY", "dev-secret-key")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app = FastAPI(title="SharePoint Reporting API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != API_SECRET_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid API Key")

def get_reader():
    return GraphSharePointReader()

@app.get("/items", dependencies=[Depends(verify_api_key)])
async def get_items(
    status: Optional[str] = Query(None, description="Filter by status: pendiente or procesado"),
    from_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    limit: Optional[int] = Query(None, description="Max items to retrieve"),
    force_refresh: bool = Query(False, description="Ignore cache and force fetch"),
    reader: GraphSharePointReader = Depends(get_reader)
):
    try:
        # Lógica de Límite Inteligente
        # Si el usuario NO especifica límite explicitamente:
        # A) Con fecha: Le damos rienda suelta (50,000) porque el Smart Fetch cortará.
        # B) Sin fecha: Le ponemos el freno de mano (1,000) para seguridad.
        actual_limit = limit
        if actual_limit is None:
            actual_limit = 50000 if from_date else 1000

        use_case = GetFilteredItemsUseCase(reader)
        items = use_case.execute(
            status=status, 
            from_date=from_date, 
            to_date=to_date, 
            limit=actual_limit,
            force_refresh=force_refresh
        )
        
        return [
            {
                "id": item.id,
                "title": item.title,
                "list": item.source_list_display,
                "created": item.fecha_creacion.isoformat() if item.fecha_creacion else None,
                "status": "Pendiente" if item.es_pendiente() else "Procesado" if item.es_procesado() else "Desconocido",
                "fields": item.raw_fields
            } for item in items
        ]
    except Exception as e:
        print(f"🔥 Error en API: {e}")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
