from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from datetime import datetime

@dataclass
class SharePointItem:
    id: str
    title: str
    raw_fields: Dict[str, Any] = field(default_factory=dict)
    source_list: str = "" # Identificador técnico (e.g., 'gestion_baja')

    @property
    def source_list_display(self) -> str:
        if self.source_list == "gestion_baja":
            return "Lista 1 (Gestión Baja de Servicio Móvil u Hogar)"
        elif self.source_list == "migracion_post_pre":
            return "Lista 2 (Ejecución Migración PostPago a PrePago)"
        return self.source_list

    @property
    def estado_baja(self) -> str:
        return str(self.raw_fields.get("eBajaRealizada", self.raw_fields.get("BajaRealizada", ""))).strip()

    @property
    def fecha_creacion(self) -> Optional[datetime]:
        created = self.raw_fields.get("Created")
        if created:
            try:
                # SharePoint ISO format: '2023-04-20T12:59:37Z'
                return datetime.fromisoformat(created.replace("Z", "+00:00"))
            except:
                return None
        return None

    @property
    def fecha_ejecucion(self) -> Optional[datetime]:
        # Usar dFechaFormRegularizado o Modified
        fecha = self.raw_fields.get("dFechaFormRegularizado") or self.raw_fields.get("Modified")
        if fecha:
            try:
                return datetime.fromisoformat(fecha.replace("Z", "+00:00"))
            except:
                return None
        return None

    def es_pendiente(self) -> bool:
        fields = self.raw_fields
        if self.source_list == "gestion_baja":
            # Filtro estricto solicitado por el usuario
            # Solo "Cambio de Post Pago a Pre Pago R" (valor técnico: Pre Pago R)
            if fields.get("eTipoBaja") not in ("Pre Pago R", "Cambio de Post Pago a Pre Pago R"):
                return False

            return (
                fields.get("eServicio") in ("Móvil", "Móvil B2B") and
                fields.get("eRetencionEfectiva") == "NO" and
                fields.get("eTipoGestion") == "Se deriva para Baja" and
                fields.get("eFormularioPendiente") == "Formulario Regularizado" and
                fields.get("eDeudaPendiente") == "Sin Deuda" and
                fields.get("eRegularizadoCompleto") == "Se deriva para RPA" and
                self.estado_baja in (None, "", "None", "pendiente", "Pendiente")
            )
        elif self.source_list == "migracion_post_pre":
            title = fields.get("Title")
            return (
                title is not None and 
                str(title).isdigit() and 
                self.estado_baja in (None, "", "None")
            )
        return False

    def es_procesado(self) -> bool:
        baja = self.estado_baja
        if baja and baja.lower() != "pendiente" and baja != "None":
            return True
        return False
