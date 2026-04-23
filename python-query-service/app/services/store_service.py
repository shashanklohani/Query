import os
from pathlib import Path

from fastapi import HTTPException, status
from app.models.query import CreateStoreRequest, CreateStoreResponse
from app.utils.config import get_settings
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import (
    RecursiveCharacterTextSplitter,
)  # Helpful in splitting the PDF into smaller chunks
from langchain_openai import OpenAIEmbeddings

settings = get_settings()


def initialize_store_runtime() -> None:
    if settings.openai_api_key:
        os.environ["OPENAI_API_KEY"] = settings.openai_api_key

    if settings.openai_api_base:
        os.environ["OPENAI_API_BASE"] = settings.openai_api_base


class StoreService:
    def __init__(self) -> None:
        self.uploads_root = Path(settings.shared_uploads_root).resolve()
        self.persist_directory = settings.vector_store_dir
        self.collection_name = settings.vector_store_collection
        self.text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            encoding_name="cl100k_base",
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
        )
        self.embedding_model = OpenAIEmbeddings(model=settings.embedding_model)

    def create_store(self, payload: CreateStoreRequest) -> CreateStoreResponse:
        pdf_path = self._resolve_pdf_path(payload.s3_key)
        pages = PyPDFLoader(str(pdf_path)).load()
        page_count = len(pages)

        if page_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded PDF does not contain any readable pages.",
            )

        data_chunks = self.text_splitter.split_documents(pages)
        self._attach_metadata(data_chunks, payload.s3_key)
        self._get_vector_store().add_documents(data_chunks)

        return CreateStoreResponse(
            message="Store created successfully.",
            s3_key=payload.s3_key,
            file_path=str(pdf_path),
            page_count=page_count,
        )

    def _resolve_pdf_path(self, s3_key: str) -> Path:
        pdf_path = (self.uploads_root / s3_key).resolve()

        try:
            pdf_path.relative_to(self.uploads_root)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PDF path.",
            ) from exc

        if not pdf_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Uploaded PDF not found: {s3_key}",
            )

        return pdf_path

    def _attach_metadata(self, chunks: list, s3_key: str) -> None:
        for index, chunk in enumerate(chunks):
            chunk.metadata = {
                **chunk.metadata,
                "file_name": s3_key,
                "chunk_index": index,
            }

    def _get_vector_store(self) -> Chroma:
        return Chroma(
            collection_name=self.collection_name,
            persist_directory=self.persist_directory,
            embedding_function=self.embedding_model,
        )
