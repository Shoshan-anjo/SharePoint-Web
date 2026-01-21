from abc import ABC, abstractmethod
from typing import List
from domain.entities.sharepoint_item import SharePointItem

class SharePointReader(ABC):

    @abstractmethod
    def get_items(
        self, 
        list_id: str, 
        source_name: str, 
        filter_query: str = "", 
        select_query: str = ""
    ) -> List[SharePointItem]:
        pass
