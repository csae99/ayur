"""
Comprehensive Test Suite for AyurBot Vectorless RAG

Tests:
  1. PDF ingestion (build knowledge base from real Ayurvedic PDFs)
  2. BM25 index statistics & diagnostics
  3. BM25 keyword search (multiple queries)
  4. Synonym expansion validation
  5. BM25-only vs full pipeline comparison
  6. Edge cases (empty queries, unknown terms)
  7. Performance benchmarking

Usage:
    python test_vectorless.py
    python test_vectorless.py --pdf-dir ../trainingdata-ayurbot
"""
import os
import sys
import time
import json
import argparse

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.bm25_knowledge_service import BM25KnowledgeService


# ──────────────────────────────────────────────
# Test Helpers
# ──────────────────────────────────────────────

PASS = "✅ PASS"
FAIL = "❌ FAIL"
WARN = "⚠️  WARN"

test_results = {"passed": 0, "failed": 0, "warnings": 0}


def report(test_name: str, passed: bool, detail: str = "", warning: bool = False):
    """Report a test result."""
    if warning:
        status = WARN
        test_results["warnings"] += 1
    elif passed:
        status = PASS
        test_results["passed"] += 1
    else:
        status = FAIL
        test_results["failed"] += 1
    
    print(f"  {status} {test_name}")
    if detail:
        for line in detail.split("\n"):
            print(f"         {line}")


def section(title: str):
    """Print a section header."""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


# ──────────────────────────────────────────────
# Test 1: PDF Ingestion
# ──────────────────────────────────────────────

def test_ingestion(pdf_dir: str):
    section("TEST 1: PDF Ingestion")
    
    if not os.path.exists(pdf_dir):
        report("PDF directory exists", False, f"Not found: {pdf_dir}")
        return False
    
    report("PDF directory exists", True, f"Path: {pdf_dir}")
    
    # Count PDFs
    pdf_count = sum(1 for f in os.listdir(pdf_dir) if f.lower().endswith('.pdf'))
    report(f"PDF files found", pdf_count > 0, f"Count: {pdf_count}")
    
    if pdf_count == 0:
        return False
    
    # Build the index
    start_time = time.time()
    success = BM25KnowledgeService.build_index(pdf_dir)
    elapsed = time.time() - start_time
    
    report("Index build succeeded", success)
    report(f"Build time", True, f"{elapsed:.2f} seconds (zero API calls)")
    
    # Verify the JSON file was created
    json_exists = os.path.exists(BM25KnowledgeService.KNOWLEDGE_STORE_PATH)
    report("knowledge_chunks.json created", json_exists)
    
    if json_exists:
        file_size = os.path.getsize(BM25KnowledgeService.KNOWLEDGE_STORE_PATH)
        report("JSON file size", file_size > 0, f"{file_size / 1024:.1f} KB")
    
    return success


# ──────────────────────────────────────────────
# Test 2: Index Statistics
# ──────────────────────────────────────────────

def test_index_stats():
    section("TEST 2: Index Statistics & Diagnostics")
    
    stats = BM25KnowledgeService.get_stats()
    
    report("Index loaded", stats["index_loaded"])
    report(f"Total chunks", stats["total_chunks"] > 0, f"Count: {stats['total_chunks']}")
    report(f"Unique terms", stats["unique_terms"] > 0, f"Count: {stats['unique_terms']}")
    report(f"Avg document length", stats["avg_doc_length"] > 0, f"Tokens: {stats['avg_doc_length']}")
    report(f"Reranker status", True, f"Enabled: {stats['rerank_enabled']}")
    report(f"PDF sources indexed", len(stats["sources"]) > 0, f"Sources: {stats['sources']}")


# ──────────────────────────────────────────────
# Test 3: BM25 Keyword Search
# ──────────────────────────────────────────────

def test_bm25_search():
    section("TEST 3: BM25 Keyword Search")
    
    test_queries = [
        ("ashwagandha stress", "Should find content about Ashwagandha and stress management"),
        ("triphala digestion", "Should find content about Triphala for digestive health"),
        ("turmeric inflammation", "Should find content about Turmeric's anti-inflammatory properties"),
        ("brahmi memory focus", "Should find content about Brahmi for cognitive function"),
        ("vata pitta kapha dosha", "Should find content about the three doshas"),
        ("I feel bloated after meals", "Synonym expansion should map to agni/digestive fire"),
        ("natural remedies for joint pain", "Should match arthritis/sandhi content"),
        ("herbs for sleep problems", "Should find content about insomnia/nidra herbs"),
        ("ayurvedic skin care", "Should find content about skin health herbs"),
        ("detox and cleansing", "Should find panchakarma/cleansing content"),
    ]
    
    for query, description in test_queries:
        context = BM25KnowledgeService.get_relevant_context_bm25_only(query, k=3)
        has_results = len(context) > 0
        
        if has_results:
            # Show first 150 chars of first result
            preview = context[:150].replace("\n", " ") + "..."
            report(f'"{query}"', True, f"{description}\n         Preview: {preview}")
        else:
            report(f'"{query}"', False, description)


# ──────────────────────────────────────────────
# Test 4: Synonym Expansion
# ──────────────────────────────────────────────

def test_synonym_expansion():
    section("TEST 4: Synonym Expansion Validation")
    
    test_cases = [
        ("bloating", ["agni", "mandagni", "ama"]),
        ("stress", ["anxiety", "nervine", "adaptogenic"]),
        ("digestion", ["agni", "triphala", "pachana"]),
        ("insomnia", ["nidra", "jatamansi", "shankhpushpi"]),
        ("joint", ["sandhi", "asthi", "guggul"]),
        ("liver", ["yakrit", "kutki"]),
        ("diabetes", ["prameha", "gudmar"]),
        ("heart", ["hridaya", "arjuna"]),
    ]
    
    for input_word, expected_expansions in test_cases:
        tokens = BM25KnowledgeService._tokenize(input_word)
        expanded = BM25KnowledgeService._expand_query(tokens)
        
        found_expansions = [exp for exp in expected_expansions if exp in expanded]
        all_found = len(found_expansions) == len(expected_expansions)
        
        report(
            f'"{input_word}" → {len(expanded)} tokens',
            all_found,
            f"Expected: {expected_expansions}\n         Found:    {found_expansions}"
        )


# ──────────────────────────────────────────────
# Test 5: Raw Search Diagnostics
# ──────────────────────────────────────────────

def test_raw_search():
    section("TEST 5: Raw Search Diagnostics")
    
    queries = ["ashwagandha", "digestive fire", "panchakarma detox"]
    
    for query in queries:
        print(f"\n  Query: \"{query}\"")
        results = BM25KnowledgeService.search_raw(query, top_n=3)
        
        if results:
            report(f"Results found", True, f"Count: {len(results)}")
            for i, r in enumerate(results):
                print(f"         #{i+1} [Score: {r['score']:.4f}] Source: {r['source']}, Page: {r['page']}")
                print(f"              Matched tokens: {r['tokens_matched'][:10]}")
                print(f"              Text: {r['text'][:120]}...")
        else:
            report(f"Results found", False, "No results returned")


# ──────────────────────────────────────────────
# Test 6: Edge Cases
# ──────────────────────────────────────────────

def test_edge_cases():
    section("TEST 6: Edge Cases")
    
    # Empty query
    result = BM25KnowledgeService.get_relevant_context_bm25_only("", k=3)
    report("Empty query returns empty", result == "")
    
    # Stopwords only
    result = BM25KnowledgeService.get_relevant_context_bm25_only("the is a an", k=3)
    report("Stopwords-only query returns empty", result == "")
    
    # Completely unknown terms
    result = BM25KnowledgeService.get_relevant_context_bm25_only("xyzzy foobar baz", k=3)
    report("Unknown terms return empty", result == "")
    
    # Very long query
    long_query = "I have been experiencing significant digestive issues including bloating gas and constipation for the past several weeks and I am looking for natural Ayurvedic remedies that can help improve my digestive fire and overall gut health"
    result = BM25KnowledgeService.get_relevant_context_bm25_only(long_query, k=3)
    report("Long query returns results", len(result) > 0, f"Context length: {len(result)} chars")
    
    # Hindi-ish query (transliterated)
    result = BM25KnowledgeService.get_relevant_context_bm25_only("ashwagandha churna", k=3)
    report("Transliterated query", len(result) > 0, f"Context length: {len(result)} chars")
    
    # k=1 (single result)
    result = BM25KnowledgeService.get_relevant_context_bm25_only("turmeric", k=1)
    has_single = len(result) > 0 and result.count("[Source:") == 1
    report("k=1 returns exactly 1 result", has_single)


# ──────────────────────────────────────────────
# Test 7: Performance Benchmark
# ──────────────────────────────────────────────

def test_performance():
    section("TEST 7: Performance Benchmark")
    
    queries = [
        "ashwagandha for stress",
        "herbs for digestion",
        "vata dosha imbalance",
        "natural immunity boosters",
        "triphala benefits",
        "ayurvedic skin care routine",
        "joint pain relief herbs",
        "brahmi memory enhancement",
        "liver detox herbs",
        "kapha weight management",
    ]
    
    # BM25-only benchmark
    times = []
    for query in queries:
        start = time.time()
        BM25KnowledgeService.get_relevant_context_bm25_only(query, k=3)
        elapsed = time.time() - start
        times.append(elapsed)
    
    avg_time = sum(times) / len(times)
    max_time = max(times)
    min_time = min(times)
    
    report(
        f"BM25-only retrieval speed",
        avg_time < 0.1,
        f"Avg: {avg_time*1000:.2f}ms | Min: {min_time*1000:.2f}ms | Max: {max_time*1000:.2f}ms | Queries: {len(queries)}"
    )
    
    # Bulk search benchmark
    start = time.time()
    for _ in range(100):
        BM25KnowledgeService.get_relevant_context_bm25_only("ashwagandha stress anxiety", k=3)
    elapsed_100 = time.time() - start
    
    report(
        f"100 consecutive searches",
        elapsed_100 < 5.0,
        f"Total: {elapsed_100:.2f}s | Per query: {elapsed_100*10:.2f}ms"
    )


# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Test AyurBot Vectorless RAG")
    parser.add_argument(
        "--pdf-dir",
        type=str,
        default="../trainingdata-ayurbot",
        help="Path to directory containing Ayurvedic PDFs"
    )
    parser.add_argument(
        "--skip-ingest",
        action="store_true",
        help="Skip PDF ingestion (use existing knowledge_chunks.json)"
    )
    args = parser.parse_args()
    
    print("\n" + "🧪" * 30)
    print("  AyurBot Vectorless RAG — Full Test Suite")
    print("🧪" * 30)
    
    # Disable reranker for pure BM25 testing
    BM25KnowledgeService.RERANK_ENABLED = False
    print(f"\n  (Reranker disabled for pure BM25 testing)")
    
    # Test 1: Ingestion
    if not args.skip_ingest:
        ingestion_ok = test_ingestion(args.pdf_dir)
        if not ingestion_ok:
            print("\n❌ Ingestion failed. Cannot proceed with remaining tests.")
            print("   Make sure PDFs are in the specified directory.")
            return
    else:
        print("\n  Skipping ingestion, loading existing index...")
        loaded = BM25KnowledgeService.load_index()
        if not loaded:
            print("\n❌ No existing index found. Run without --skip-ingest first.")
            return
    
    # Tests 2-7
    test_index_stats()
    test_bm25_search()
    test_synonym_expansion()
    test_raw_search()
    test_edge_cases()
    test_performance()
    
    # Summary
    section("TEST SUMMARY")
    total = test_results["passed"] + test_results["failed"] + test_results["warnings"]
    print(f"  {PASS}: {test_results['passed']}")
    print(f"  {FAIL}: {test_results['failed']}")
    print(f"  {WARN}: {test_results['warnings']}")
    print(f"  Total: {total}")
    
    if test_results["failed"] == 0:
        print(f"\n  🎉 All tests passed! Vectorless RAG is working correctly.")
    else:
        print(f"\n  ⚠️  {test_results['failed']} test(s) failed. Check output above.")
    
    print()


if __name__ == "__main__":
    main()
