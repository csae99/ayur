import os
from typing import List
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import traceback

class KnowledgeService:
    _vector_store = None
    _embeddings = None
    
    # Configuration
    VECTOR_STORE_PATH = "data/vector_store"
    PDF_DATA_PATH = "data/pdfs" # Mounted via Docker Compose

    @classmethod
    def get_embeddings(cls):
        if not cls._embeddings:
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                raise ValueError("GEMINI_API_KEY not set")
            cls._embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=api_key)
        return cls._embeddings

    @classmethod
    def load_index(cls):
        """Load existing FAISS index from disk"""
        try:
            if os.path.exists(cls.VECTOR_STORE_PATH):
                print(f"Loading vector store from {cls.VECTOR_STORE_PATH}...")
                cls._vector_store = FAISS.load_local(
                    cls.VECTOR_STORE_PATH, 
                    cls.get_embeddings(),
                    allow_dangerous_deserialization=True # Local file, safe to allow
                )
                print("Vector store loaded successfully.")
                return True
        except Exception as e:
            print(f"Error loading vector store: {e}")
            traceback.print_exc()
        return False

    @classmethod
    def build_index(cls, pdf_directory: str = None):
        """Builds a new index from PDFs in the directory"""
        try:
            target_dir = pdf_directory or cls.PDF_DATA_PATH
            print(f"Building index from PDFs in: {target_dir}")
            
            if not os.path.exists(target_dir):
                print(f"Directory not found: {target_dir}")
                return False

            # Initialize text splitter
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                separators=["\n\n", "\n", ". ", " ", ""]
            )
            
            cls._vector_store = None
            import time

            # Walk through directory
            files_processed = 0
            for root, dirs, files in os.walk(target_dir):
                for file in files:
                    if file.lower().endswith('.pdf'):
                        file_path = os.path.join(root, file)
                        print(f"Processing PDF: {file_path}")
                        
                        try:
                            # Load single PDF
                            loader = PyPDFLoader(file_path)
                            file_docs = loader.load()
                            if not file_docs:
                                continue
                                
                            print(f"  Loaded {len(file_docs)} pages.")
                            
                            # Split into chunks
                            chunks = text_splitter.split_documents(file_docs)
                            print(f"  Created {len(chunks)} chunks.")
                            
                            # Embed in batches
                            # Embed in batches
                            batch_size = 10
                            for i in range(0, len(chunks), batch_size):
                                batch = chunks[i : i + batch_size]
                                print(f"    Embedding batch {i//batch_size + 1}/{(len(chunks) + batch_size - 1)//batch_size}...")
                                
                                while True:
                                    try:
                                        if cls._vector_store is None:
                                            cls._vector_store = FAISS.from_documents(batch, cls.get_embeddings())
                                        else:
                                            time.sleep(2) # Small delay before adding
                                            cls._vector_store.add_documents(batch)
                                        break # Success, exit retry loop
                                    except Exception as e:
                                        if "429" in str(e) or "Quota" in str(e):
                                            print(f"    Rate limit hit: {e}") 
                                            print(f"    Waiting 120s for quota...")
                                            time.sleep(120)
                                        else:
                                            print(f"    Error processing batch: {e}")
                                            break
                                
                                # Standard rate limit sleep
                                time.sleep(10)
                            
                            files_processed += 1
                            print(f"  Successfully indexed {file}")
                            
                            # Save intermediate progress ensures we don't restart from scratch
                            if cls._vector_store:
                                cls._vector_store.save_local(cls.VECTOR_STORE_PATH)
                                print(f"  Saved index progress to {cls.VECTOR_STORE_PATH}")

                        except Exception as e:
                            print(f"Failed to process {file}: {e}")
                            traceback.print_exc()

            if files_processed == 0:
                print("No PDF files processed.")
                return False

            # Final save
            print("Finalizing index...")
            if cls._vector_store:
                if not os.path.exists(os.path.dirname(cls.VECTOR_STORE_PATH)):
                    os.makedirs(os.path.dirname(cls.VECTOR_STORE_PATH), exist_ok=True)
                cls._vector_store.save_local(cls.VECTOR_STORE_PATH)
                print(f"Index saved to {cls.VECTOR_STORE_PATH}")
                return True
            return False

        except Exception as e:
            print(f"Error building index: {e}")
            traceback.print_exc()
            return False

    @classmethod
    def get_relevant_context(cls, query: str, k: int = 3) -> str:
        """Retrieve relevant context for a query"""
        try:
            if not cls._vector_store:
                success = cls.load_index()
                if not success:
                    # Try building if load fails (first run)
                    print("Index not found, attempting to build from default path...")
                    success = cls.build_index()
                    if not success:
                        return ""
            
            if not cls._vector_store:
                 return ""

            docs = cls._vector_store.similarity_search(query, k=k)
            
            context_parts = []
            for doc in docs:
                source = os.path.basename(doc.metadata.get('source', 'unknown'))
                page = doc.metadata.get('page', 0)
                content = doc.page_content.replace('\n', ' ')
                context_parts.append(f"[Source: {source}, Page: {page}]\n{content}")
            
            return "\n\n".join(context_parts)

        except Exception as e:
            print(f"Error retrieving context: {e}")
            return ""
