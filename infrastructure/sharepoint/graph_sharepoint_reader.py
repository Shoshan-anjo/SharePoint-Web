import os
import requests
from typing import List
from dotenv import load_dotenv

from domain.entities.sharepoint_item import SharePointItem
from domain.ports.sharepoint_reader import SharePointReader
from infrastructure.auth.graph_auth import get_access_token

load_dotenv()

class GraphSharePointReader(SharePointReader):

    def get_items(
        self, 
        list_id: str, 
        source_name: str, 
        filter_query: str = "", 
        select_query: str = "",
        orderby_query: str = "", 
        max_items: int = 1000,
        min_date_threshold: str = None
    ) -> List[SharePointItem]:
        token = get_access_token()
        site_id = os.getenv("SP_SITE_ID")

        url = (
            f"https://graph.microsoft.com/v1.0/"
            f"sites/{site_id}/lists/{list_id}/items"
            f"?expand=fields"
        )

        if select_query:
            url += f"($select={select_query})"
        
        # OData $orderby debe ir antes de $top o filtros para ser limpio, pero en Graph el orden es laxo.
        if orderby_query:
            url += f"&$orderby={orderby_query}"
        
        url += "&$top=999"

        if filter_query:
            url += f"&$filter={filter_query}"

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Prefer": "HonorNonIndexedQueriesWarningMayFailOverTime" # Útil para listas grandes si no hay índices
        }

        items = []
        page_count = 0
        while url:
            page_count += 1
            print(f"📄 [{source_name}] Cargando página {page_count}...")
            try:
                response = requests.get(url, headers=headers, timeout=30)
                response.raise_for_status()
                data = response.json()

                for item in data["value"]:
                    fields = item["fields"]
                    
                    # Chequeo de Fecha Inteligente (Optimización de Fetch)
                    # Si ya estamos viendo items más viejos que el umbral, paramos TODO.
                    # Requiere que la lista venga ordenada "Created desc".
                    if min_date_threshold:
                        created_val = fields.get("Created") # e.g. 2023-04-20T12:59:37Z
                        if created_val and created_val < min_date_threshold:
                            print(f"🛑 Umbral de fecha alcanzado ({min_date_threshold}). Deteniendo descarga en {created_val}.")
                            return items

                    items.append(
                        SharePointItem(
                            id=item["id"],
                            title=str(fields.get("Title", "")).strip(),
                            raw_fields=fields,
                            source_list=source_name
                        )
                    )
                    
                    if len(items) >= max_items:
                        print(f"🛑 Límite de {max_items} alcanzado.")
                        return items

                url = data.get("@odata.nextLink")
            except requests.exceptions.RequestException as e:
                print(f"❌ Error en {source_name} (página {page_count}): {e}")
                if hasattr(e, 'response') and e.response is not None:
                    print(f"🔍 Detalle del error: {e.response.text}")
                raise e # Re-lanzar para que el UseCase lo maneje

        print(f"✅ {source_name}: {len(items)} recuperados")
        return items
