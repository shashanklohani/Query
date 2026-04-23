from fastapi import APIRouter

from app.models.query import (
    CreateStoreRequest,
    CreateStoreResponse,
    QueryRequest,
    QueryResponse,
)
from app.services.query_service import QueryService
from app.services.store_service import StoreService

router = APIRouter(prefix="/api", tags=["query"])
query_service = QueryService()
store_service = StoreService()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/query", response_model=QueryResponse)
def run_query(payload: QueryRequest) -> QueryResponse:
    return query_service.answer(payload)

@router.post("/create-store", response_model=CreateStoreResponse)
def create_store(payload: CreateStoreRequest) -> CreateStoreResponse:
    return store_service.create_store(payload)
