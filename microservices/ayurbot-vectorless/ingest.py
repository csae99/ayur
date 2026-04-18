"""
Vectorless Ingestion Script

Reads PDFs and builds a JSON knowledge base for BM25 search.
No embedding API calls needed — runs instantly offline.

Usage:
    python ingest.py                        # Build from default data/pdfs directory
    python ingest.py --pdf-dir /path/to/pdfs  # Build from custom directory
"""
import os
import sys
import argparse
from dotenv import load_dotenv

# Load environment variables (not strictly needed for vectorless, but keeps compatibility)
load_dotenv()

from services.bm25_knowledge_service import BM25KnowledgeService


def main():
    parser = argparse.ArgumentParser(description="Build BM25 knowledge base from PDFs")
    parser.add_argument(
        "--pdf-dir", 
        type=str, 
        default=None,
        help="Path to directory containing PDFs (default: data/pdfs)"
    )
    args = parser.parse_args()
    
    print("=" * 60)
    print("  AyurBot Vectorless — Knowledge Base Builder")
    print("=" * 60)
    print()
    print("This process will:")
    print("  1. Load PDFs from the specified directory")
    print("  2. Split text into overlapping chunks")
    print("  3. Tokenize chunks for BM25 indexing")
    print("  4. Save as JSON to data/knowledge_chunks.json")
    print()
    print("  ⚡ No embedding API calls — runs instantly!")
    print("-" * 60)
    
    success = BM25KnowledgeService.build_index(args.pdf_dir)
    
    if success:
        print("-" * 60)
        print("✅ Ingestion Complete!")
        print("   The knowledge base has been saved to data/knowledge_chunks.json")
        print("   Restart the service or it will pick up the index on next boot.")
    else:
        print("❌ Ingestion Failed. Please check the logs above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
