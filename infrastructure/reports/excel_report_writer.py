import pandas as pd
from domain.entities.sharepoint_item import SharePointItem
from domain.ports.report_writer import ReportWriter

class ExcelReportWriter(ReportWriter):

    def write(self, all_items, pendientes, procesados):
        
        def to_summary_df(items: list[SharePointItem]):
            data = []
            for item in items:
                f_creacion = item.fecha_creacion
                data.append({
                    "ID": item.id,
                    "Lista": item.source_list_display,
                    "Estado Baja": item.estado_baja,
                    "Fecha Creación": f_creacion.date() if f_creacion else None,
                    "Mes": f_creacion.strftime("%b") if f_creacion else None,
                    "Año": f_creacion.year if f_creacion else None
                })
            return pd.DataFrame(data)

        df_all = to_summary_df(all_items)
        df_pendientes = to_summary_df(pendientes)
        df_procesados = to_summary_df(procesados)

        with pd.ExcelWriter("reporte_sharepoint_summary.xlsx", engine="openpyxl") as writer:
            print("📊 Generando tablas de resumen...")

            # 1. Cantidad enviada por Lista (Resumen General)
            resumen_general = df_all.groupby("Lista").size().reset_index(name="Cantidad enviada")
            resumen_general.to_excel(writer, sheet_name="Dashboard", startrow=2, index=False)
            
            # 2. Resumen de Ejecuciones (Procesados)
            if not df_procesados.empty:
                # Agrupar por Día y Mes
                ejecuciones = df_procesados.groupby(["Fecha Creación", "Mes"]).size().reset_index(name="Total general")
                ejecuciones.rename(columns={"Fecha Creación": "Fechas / Día"}, inplace=True)
                ejecuciones.to_excel(writer, sheet_name="Dashboard", startrow=2, startcol=5, index=False)

            # 3. Resumen de Pendientes
            if not df_pendientes.empty:
                pendientes_resumen = df_pendientes.groupby(["Fecha Creación", "Lista"]).size().reset_index(name="Total general")
                pendientes_resumen.rename(columns={"Fecha Creación": "Fecha de Envío", "Lista": "Cantidades por Listas"}, inplace=True)
                pendientes_resumen.to_excel(writer, sheet_name="Dashboard", startrow=15, index=False)

            # Opcional: Mantener los datos crudos en hojas separadas si se desea, 
            # pero el usuario pidió "solamente el resumen". 
            # Por ahora solo Dashboard.
            
            print("✨ Dashboard generado exitosamente.")

        # También generamos el reporte detallado anterior por si acaso, 
        # pero con un nombre distinto, o simplemente cumplimos con el "solamente resumen"
