# SharePoint Reporting Dashboard

Este proyecto es un dashboard moderno para visualizar y gestionar datos de SharePoint, diseñado con una arquitectura limpia y una interfaz premium.

## 📁 Estructura del Proyecto

- **application/**: Contiene la lógica de negocio (Casos de Uso).
- **domain/**: Entidades y reglas de negocio del núcleo.
- **infrastructure/**: Implementaciones técnicas (SharePoint API, Auth, etc.).
- **presentation/**: API REST (FastAPI).
- **dashboard-viewer/**: Frontend (React + Vite).
- **scripts/**: Herramientas de utilidad para inspeccionar listas y esquemas.
- **docs/**: Documentación técnica y notas de investigación.

## 🚀 Cómo Iniciar

### 1. Iniciar el Backend (Python)

Asegúrate de tener el entorno virtual activado y las dependencias instaladas.

```bash
# Activar entorno virtual (Windows)
.\venv\Scripts\activate

# Iniciar servidor API (puerto 8000)
python -m presentation.api
```

### 2. Iniciar el Frontend (React)

```bash
cd dashboard-viewer
npm run dev
```

El dashboard estará disponible en: `http://localhost:5173`

## 🛠️ Herramientas de Utilidad

En la carpeta `scripts/` encontrarás:

- `list_available_lists.py`: Muestra todas las listas disponibles en el sitio de SharePoint configurado.
- `inspect_list_schema.py`: Analiza y muestra los campos técnicos de las listas configuradas, útil para depurar nombres de columnas.

## ⚙️ Configuración

Este proyecto utiliza un archivo `.env` en la raíz para las credenciales de Microsoft Graph API y IDs de sitios/listas. Ver `.env.example` para referencia.
