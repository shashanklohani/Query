from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    file_name: str = Field(..., description="File name")
    prompt: str = Field(..., min_length=1, description="User prompt")
    context: str = Field(..., min_length=1, description="Query context")

class QueryResponse(BaseModel):
    answer: str
    pdf_id: str
    user_id: str
    model: str

class CreateStoreRequest(BaseModel):
    s3_key: str = Field(..., min_length=1, description="Stored PDF key/file name")

class CreateStoreResponse(BaseModel):
    message: str
    s3_key: str
    file_path: str
    page_count: int
