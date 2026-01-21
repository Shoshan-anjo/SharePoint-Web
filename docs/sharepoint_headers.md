# SharePoint List Headers (Campos)

A continuación se detallan los encabezados encontrados en las listas principales para definir las condiciones de filtrado.

## 📋 Lista 1: Gestión Baja de Servicio Móvil u Hogar
**ID:** `cab5ea08-2965-4f45-9969-d90b6e247567`

| Campo (Nombre Técnico) | Ejemplo de Valor | Nota |
| :--- | :--- | :--- |
| `eEstado` | `Finalizado` | Campo de estado principal |
| `eBajaRealizada` | `Baja Procesada` | Indica si la baja se ejecutó |
| `eTipoGestion` | `Baja Pendiente - Rellamada` | Tipo de gestión actual |
| `eContactado` | `No` | Si se logró contactar al cliente |
| `sMigrado` | `Act. Hogar 20230531` | Info de migración |
| `nLineaCodigoHogar` | `1953153` | Código del hogar |
| `nLineaContacto` | `78046833` | Teléfono de contacto |
| `Title` | `63005` | Título del item |
| `Created` | `2023-04-20T12:59:37Z` | Fecha de creación |
| `sLinkViaFirma` | `https://...` | Link al documento firmado |

## 📋 Lista 2: Formulario Baja de Servicio Hogar
**ID:** `a265a611-6683-4d98-b643-5a31fdb55fb6`

| Campo (Nombre Técnico) | Ejemplo de Valor | Nota |
| :--- | :--- | :--- |
| `eEstado` | `Finalizado` | Campo de estado principal |
| `eTipoGestion` | `Agendar llamada CC` | Gestión en el call center |
| `sNombreCompletoTitular` | `LUIS MAICO...` | Nombre del cliente |
| `nNumTitular` | `60405600.0` | Número del titular |
| `Title` | `1765773` | Título del item |

---

### Solicitud de condiciones de filtrado
Por favor, indícame qué campos usar para:
1. **Separar los que no están pendientes.**
2. **Definir qué es un registro "Procesado".**
3. **Definir qué es un registro "Pendiente".**
