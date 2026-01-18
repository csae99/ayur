import os
import asyncio
from services.knowledge_service import KnowledgeService
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    print("Starting manual ingestion process...")
    print("This process will:")
    print("1. Load PDFs from data/pdfs")
    print("2. Split text into chunks")
    print("3. Generate embeddings using Gemini API (with rate limiting)")
    print("4. Save the FAISS index to data/vector_store")
    print("-" * 50)
    
    if not os.getenv("GEMINI_API_KEY"):
        print("Error: GEMINI_API_KEY is not set in .env")
        return

    success = KnowledgeService.build_index()
    
    if success:
        print("-" * 50)
        print("Ingestion Complete! The index has been saved.")
        print("You can now restart the service or it will pick up the index on next boot.")
    else:
        print("Ingestion Failed. Please check the logs above.")

if __name__ == "__main__":
    main()
