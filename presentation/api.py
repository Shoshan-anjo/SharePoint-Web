import os
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
import uvicorn

from infrastructure.sharepoint.graph_sharepoint_reader import GraphSharePointReader
from application.use_cases.get_filtered_items import GetFilteredItemsUseCase

# Security Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-for-dev")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

# Single User Credentials (defined in Render)
DASHBOARD_USER = os.getenv("DASHBOARD_USER", "admin")
DASHBOARD_PASSWORD = os.getenv("DASHBOARD_PASSWORD", "admin123")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app = FastAPI(title="SharePoint Reporting API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return username
    except JWTError:
        raise credentials_exception

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    if form_data.username != DASHBOARD_USER or form_data.password != DASHBOARD_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": form_data.username})
    return {"access_token": access_token, "token_type": "bearer"}

def get_reader():
    return GraphSharePointReader()

@app.get("/items", dependencies=[Depends(get_current_user)])
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
