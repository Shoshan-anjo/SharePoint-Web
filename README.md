# SharePoint Reporting Dashboard

Este proyecto es un dashboard moderno para visualizar y gestionar datos de SharePoint, diseñado con una arquitectura limpia y una interfaz premium.

## 📁 Estructura del Proyecto

- **application/**: Contiene la lógica de negocio (Casos de Uso).
- **domain/**: Entidades y reglas de negocio del núcleo.
- **infrastructure/**: Implementaciones técnicas (SharePoint API, Auth, etc.).
- **presentation/**: API REST (FastAPI).
- **dashboard-viewer/**: Frontend (React + Vite).
- **scripts/**: Herramientas de utilidad para inspeccionar listas y esquemas.

## 🚀 Despliegue con Docker

Este proyecto está preparado para ejecutarse con Docker, lo cual es la forma recomendada para producción (ej. Render).

### Local con Docker Compose

```bash
docker-compose up --build
```

Esto iniciará el Backend en el puerto 8000 y el Frontend en el puerto 3000.

## 🌐 Despliegue en Render

Para desplegar en Render, usa las configuraciones de Docker:

- **Backend**: Usa el `Dockerfile.backend` de la raíz.
- **Frontend**: Usa el `Dockerfile` dentro de la carpeta `dashboard-viewer`. Asegúrate de configurar la "Context Directory" a `dashboard-viewer`.

### Variables de Entorno Requeridas:

- `DASHBOARD_USER`: Usuario para el login.
- `DASHBOARD_PASSWORD`: Contraseña para el login.
- `JWT_SECRET_KEY`: Una frase secreta para firmar los tokens de sesión.
- `ALLOWED_ORIGINS`: URL de tu frontend en Render.
- `TENANT_ID`, `CLIENT_ID`, `CLIENT_SECRET`: Credenciales de Azure/SharePoint.
- `SP_SITE_ID`, `SP_LIST_ID`, `SP_LIST_ID_2`: IDs de SharePoint.

## 🔐 Seguridad y Autenticación

El sistema cuenta con un Login protegido por **JWT (JSON Web Tokens)**.

1. El usuario ingresa sus credenciales en el login.
2. El backend valida contra las variables de entorno y devuelve un token.
3. El frontend almacena el token de forma segura y lo envía en cada petición al API.

## 🛠️ Herramientas de Utilidad

En la carpeta `scripts/` encontrarás:

- `list_available_lists.py`: Muestra las listas disponibles.
- `inspect_list_schema.py`: Analiza los campos técnicos de las listas.

---

_Desarrollo por Shoshan-anjo_
