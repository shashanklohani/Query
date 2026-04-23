from app.models.query import QueryRequest, QueryResponse
from app.utils.config import get_settings
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma


class QueryService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.embedding_model = OpenAIEmbeddings(model=self.settings.embedding_model)
        self.vectorstore = Chroma(
            collection_name=self.settings.vector_store_collection,
            persist_directory=self.settings.vector_store_dir,
            embedding_function=self.embedding_model,
        )
        self.llm = ChatOpenAI(model=self.settings.openai_model)

    def answer(self, payload: QueryRequest) -> QueryResponse:
        docs = self.vectorstore.similarity_search(
            payload.prompt,
            k=10,
            filter={"file_name": payload.file_name},
        )

        context_text = "\n\n".join(doc.page_content for doc in docs)

        final_prompt = f"""
            Context from user:
            {payload.context}

            Context from PDF:
            {context_text}

            Question:
            {payload.prompt}
        """

        answer = self.llm.invoke(final_prompt)

        return QueryResponse(
            answer=answer.content,
            pdf_id=payload.file_name,
            user_id="",
            model=self.settings.openai_model,
        )
