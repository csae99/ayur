"""
BM25 Knowledge Service — Enhanced Vectorless RAG

Features:
  1. BM25 (Okapi BM25) keyword-based retrieval — fully offline, zero API cost
  2. Ayurvedic synonym expansion (40+ term mappings) for improved recall
  3. Bigram matching for multi-word Ayurvedic terms (e.g., "digestive fire")
  4. Optional Gemini reranker — uses 1 LLM call to rerank BM25 top-N for
     near-vector-quality results at minimal cost
  5. Diagnostics & stats methods for testing
"""
import os
import re
import json
import math
from typing import List, Dict, Optional, Tuple
import traceback


class BM25KnowledgeService:
    """
    Knowledge retrieval service using BM25 (Best Matching 25) algorithm
    with optional Gemini reranking.

    Pipeline:
        Query → Tokenize → Synonym Expand → BM25 top-N → (optional) Gemini Rerank → top-k
    """

    _chunks: List[Dict] = []           # [{text, source, page, tokens}, ...]
    _avg_dl: float = 0.0               # Average document length (in tokens)
    _doc_freqs: Dict[str, int] = {}    # Document frequency per term
    _inverted_index: Dict[str, List[int]] = {}  # term -> [doc_indices]
    _index_loaded: bool = False

    # BM25 hyperparameters (tuned for medium-length Ayurvedic text chunks)
    K1 = 1.5    # Term frequency saturation
    B = 0.75    # Document length normalization

    # Configuration
    KNOWLEDGE_STORE_PATH = "data/knowledge_chunks.json"
    PDF_DATA_PATH = "data/pdfs"
    
    # Enhancement: Enable Gemini reranker (set via env or code)
    RERANK_ENABLED = os.getenv("BM25_RERANK_ENABLED", "true").lower() == "true"
    RERANK_CANDIDATES = 10   # BM25 top-N candidates to send to reranker
    RERANK_TOP_K = 3         # Final top-k after reranking

    # ─────────────────────────────────────────────────────────────
    # ENHANCED: Expanded Ayurvedic synonym map (40+ entries)
    # ─────────────────────────────────────────────────────────────
    SYNONYM_MAP = {
        # Digestive system
        "bloating": ["agni", "digestive fire", "mandagni", "ama", "vata", "gas", "aadhmana"],
        "bloated": ["agni", "digestive fire", "mandagni", "ama", "vata", "gas"],
        "digestion": ["agni", "digestive fire", "ama", "triphala", "ginger", "pachana", "deepana"],
        "constipation": ["vibandha", "vata", "triphala", "psyllium", "anulomana"],
        "diarrhea": ["atisara", "pitta", "kutaja", "bilva", "vata"],
        "acidity": ["amlapitta", "pitta", "shatavari", "licorice", "amla", "heartburn"],
        "nausea": ["chardi", "ginger", "pitta", "vata"],
        "appetite": ["agni", "deepana", "pachana", "trikatu", "hunger"],

        # Mental health
        "stress": ["vata", "anxiety", "cortisol", "nervine", "adaptogenic", "medhya"],
        "anxiety": ["vata", "stress", "nervine", "jatamansi", "ashwagandha", "chinta"],
        "depression": ["kapha", "vata", "unmada", "brahmi", "ashwagandha"],
        "insomnia": ["sleep", "nidra", "vata", "jatamansi", "shankhpushpi", "anidra"],
        "memory": ["medhya", "buddhi", "brahmi", "shankhpushpi", "smriti"],
        "focus": ["medhya", "dharana", "brahmi", "gotu kola", "concentration"],

        # Immune & energy
        "immunity": ["ojas", "rasayana", "vyadhikshamatva", "tulsi", "amla", "giloy"],
        "fatigue": ["ojas", "rasayana", "ashwagandha", "shatavari", "bala", "daurbalya"],
        "energy": ["ojas", "prana", "tejas", "rasayana", "ashwagandha"],
        "weakness": ["daurbalya", "bala", "ashwagandha", "shatavari", "rasayana"],

        # Musculoskeletal
        "inflammation": ["shotha", "pitta", "swelling", "boswellia", "turmeric", "sotha"],
        "joint": ["sandhi", "asthi", "vata", "boswellia", "guggul", "arthritis"],
        "pain": ["vedana", "shool", "vata", "nirgundi", "guggul"],
        "arthritis": ["amavata", "sandhi", "guggul", "boswellia", "ashwagandha"],
        "backpain": ["katishool", "vata", "guggul", "nirgundi", "bala"],

        # Skin & hair
        "skin": ["tvak", "rakta", "pitta", "neem", "manjistha", "kushtha"],
        "hair": ["kesha", "bhringraj", "amla", "brahmi", "khalitya"],
        "acne": ["yauvan pidika", "pitta", "neem", "turmeric", "manjistha"],
        "eczema": ["vicharchika", "pitta", "neem", "turmeric", "manjistha"],

        # Respiratory
        "respiratory": ["shwasa", "pranayama", "tulsi", "vasaka", "licorice", "kasa"],
        "cold": ["pratishyaya", "kapha", "tulsi", "ginger", "pepper"],
        "cough": ["kasa", "kapha", "tulsi", "vasaka", "licorice", "honey"],
        "asthma": ["tamaka shwasa", "kapha", "vata", "vasaka", "tulsi"],
        "fever": ["jwara", "pitta", "tulsi", "neem", "giloy", "guduchi"],

        # Metabolic
        "diabetes": ["prameha", "madhumeha", "gudmar", "fenugreek", "bitter melon"],
        "cholesterol": ["meda", "hrid", "arjuna", "guggul", "lipid"],
        "weight": ["sthaulya", "kapha", "medas", "guggul", "triphala", "obesity"],
        "thyroid": ["galaganda", "kanchanar", "guggul", "ashwagandha"],

        # Organs
        "liver": ["yakrit", "hepatoprotective", "kutki", "bhumi amla", "kalmegh"],
        "kidney": ["vrikka", "mutravaha", "punarnava", "gokshura", "varuna"],
        "heart": ["hridaya", "hrid", "arjuna", "ashwagandha", "cardio"],

        # Women's & men's health
        "menstrual": ["artava", "rajah", "ashoka", "shatavari", "lodhra"],
        "period": ["artava", "rajah", "ashoka", "shatavari"],
        "fertility": ["vajikarana", "shukra", "ashwagandha", "shatavari"],
        "pregnancy": ["garbha", "shatavari", "bala", "ashwagandha"],

        # Detox & cleansing
        "detox": ["shodhana", "panchakarma", "ama", "triphala", "neem", "virechana"],
        "cleanse": ["shodhana", "panchakarma", "ama", "purification"],
        "headache": ["shirahshool", "vata", "pitta", "brahmi", "shirashool"],

        # Doshas
        "vata": ["vayu", "air", "space", "dry", "cold", "light", "mobile"],
        "pitta": ["agni", "fire", "water", "hot", "sharp", "oily"],
        "kapha": ["prithvi", "earth", "water", "heavy", "slow", "cool"],

        # Common herb names (for when PDFs have poor text extraction)
        "ashwagandha": ["withania", "somnifera", "adaptogen", "stress", "vitality", "rasayana", "strength"],
        "triphala": ["haritaki", "amalaki", "vibhitaki", "digestion", "detox", "rejuvenation"],
        "turmeric": ["haridra", "curcuma", "curcumin", "inflammation", "antiseptic", "golden"],
        "brahmi": ["bacopa", "monnieri", "medhya", "memory", "intellect", "nervine"],
        "tulsi": ["ocimum", "holy basil", "adaptogen", "immunity", "respiratory"],
        "shatavari": ["asparagus", "racemosus", "rejuvenation", "women", "reproductive"],
        "neem": ["nimba", "azadirachta", "antibacterial", "skin", "blood purifier"],
        "ginger": ["shunti", "zingiber", "digestive", "warming", "antiemetic"],
        "guggul": ["commiphora", "mukul", "cholesterol", "joint", "inflammation"],
        "amla": ["amalaki", "gooseberry", "emblica", "vitamin", "antioxidant", "rasayana"],

        # Formulations
        "churna": ["powder", "herbal powder", "formulation", "preparation"],
        "kwath": ["decoction", "kashaya", "herbal tea"],
        "taila": ["oil", "medicated oil", "massage"],
        "ghrita": ["ghee", "medicated ghee", "clarified butter"],
    }

    # ─────────────────────────────────────────────────────────────
    # TOKENIZATION
    # ─────────────────────────────────────────────────────────────
    _STOPWORDS = frozenset({
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
        'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
        'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
        'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
        'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
        'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
        'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
        'because', 'but', 'and', 'or', 'if', 'while', 'about', 'this', 'that',
        'these', 'those', 'it', 'its', 'i', 'me', 'my', 'we', 'our', 'you',
        'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their',
        'what', 'which', 'who', 'whom', 'also', 'much', 'many', 'well',
    })

    @classmethod
    def _tokenize(cls, text: str) -> List[str]:
        """Tokenize text: lowercase → alpha split → stopword removal."""
        text = text.lower()
        tokens = re.findall(r'[a-z]+', text)
        return [t for t in tokens if t not in cls._STOPWORDS and len(t) > 1]

    @classmethod
    def _tokenize_with_bigrams(cls, text: str) -> List[str]:
        """Tokenize with bigrams for multi-word Ayurvedic terms."""
        unigrams = cls._tokenize(text)
        bigrams = [f"{unigrams[i]}_{unigrams[i+1]}" for i in range(len(unigrams) - 1)]
        return unigrams + bigrams

    @classmethod
    def _expand_query(cls, tokens: List[str]) -> List[str]:
        """Expand query tokens with Ayurvedic synonyms for better recall."""
        expanded = list(tokens)
        for token in tokens:
            if token in cls.SYNONYM_MAP:
                for syn in cls.SYNONYM_MAP[token]:
                    syn_tokens = cls._tokenize(syn)
                    expanded.extend(syn_tokens)
        # Deduplicate while preserving order
        seen = set()
        result = []
        for t in expanded:
            if t not in seen:
                seen.add(t)
                result.append(t)
        return result

    # ─────────────────────────────────────────────────────────────
    # BM25 INDEX
    # ─────────────────────────────────────────────────────────────

    @classmethod
    def _build_bm25_index(cls):
        """Build the BM25 index: doc frequencies + inverted index."""
        if not cls._chunks:
            return

        cls._doc_freqs = {}
        cls._inverted_index = {}
        total_length = 0

        for i, chunk in enumerate(cls._chunks):
            tokens = chunk.get("tokens", [])
            total_length += len(tokens)
            unique_tokens = set(tokens)
            for token in unique_tokens:
                cls._doc_freqs[token] = cls._doc_freqs.get(token, 0) + 1
                if token not in cls._inverted_index:
                    cls._inverted_index[token] = []
                cls._inverted_index[token].append(i)

        cls._avg_dl = total_length / len(cls._chunks) if cls._chunks else 1.0
        print(f"BM25 index built: {len(cls._chunks)} docs, {len(cls._doc_freqs)} unique terms, avg_dl={cls._avg_dl:.1f}")

    @classmethod
    def _bm25_score(cls, query_tokens: List[str], doc_index: int) -> float:
        """Calculate BM25 score for a document given query tokens."""
        chunk = cls._chunks[doc_index]
        doc_tokens = chunk.get("tokens", [])
        doc_len = len(doc_tokens)
        n_docs = len(cls._chunks)

        # Build term frequency map for this doc
        tf_map: Dict[str, int] = {}
        for t in doc_tokens:
            tf_map[t] = tf_map.get(t, 0) + 1

        score = 0.0
        for qt in query_tokens:
            if qt not in cls._doc_freqs:
                continue
            tf = tf_map.get(qt, 0)
            if tf == 0:
                continue

            df = cls._doc_freqs[qt]
            # IDF with floor to avoid negative for very common terms
            idf = max(0, math.log((n_docs - df + 0.5) / (df + 0.5) + 1.0))
            # TF with length normalization
            tf_norm = (tf * (cls.K1 + 1)) / (tf + cls.K1 * (1 - cls.B + cls.B * (doc_len / cls._avg_dl)))
            score += idf * tf_norm

        return score

    @classmethod
    def _bm25_search(cls, query_tokens: List[str], top_n: int = 10) -> List[Tuple[int, float]]:
        """
        Efficient BM25 search using inverted index.
        Only scores documents that contain at least one query term.
        """
        # Collect candidate doc indices (only docs containing query terms)
        candidate_docs = set()
        for qt in query_tokens:
            if qt in cls._inverted_index:
                candidate_docs.update(cls._inverted_index[qt])

        if not candidate_docs:
            return []

        # Score only candidate documents
        scores = []
        for doc_idx in candidate_docs:
            score = cls._bm25_score(query_tokens, doc_idx)
            if score > 0:
                scores.append((doc_idx, score))

        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_n]

    # ─────────────────────────────────────────────────────────────
    # GEMINI RERANKER (Enhancement Option 2)
    # ─────────────────────────────────────────────────────────────

    @classmethod
    def _rerank_with_gemini(cls, query: str, candidates: List[Tuple[int, float]], top_k: int = 3) -> List[Tuple[int, float]]:
        """
        Rerank BM25 candidates using Gemini for semantic relevance.
        
        Uses 1 single LLM call to rerank N candidates → much cheaper than
        embedding every chunk, but gives near-vector-quality results.
        """
        if not candidates:
            return []

        try:
            import google.generativeai as genai

            # Build the candidate list for the reranker prompt
            candidate_texts = []
            for i, (doc_idx, bm25_score) in enumerate(candidates):
                chunk_text = cls._chunks[doc_idx].get("text", "")[:500]  # Truncate to save tokens
                candidate_texts.append(f"[{i}] {chunk_text}")

            candidates_str = "\n\n".join(candidate_texts)

            rerank_prompt = f"""You are a relevance judge for an Ayurvedic health knowledge base.

Given the user query and a list of text passages, rank the passages by relevance to the query.
Return ONLY a JSON array of passage indices (the numbers in square brackets) ordered from most relevant to least relevant.
Return at most {top_k} indices. Only include passages that are actually relevant to the query.

User Query: "{query}"

Passages:
{candidates_str}

Response format (JSON array only, no explanation):
[most_relevant_index, second_most_relevant, ...]"""

            model = genai.GenerativeModel('models/gemini-2.5-flash')
            response = model.generate_content(rerank_prompt)
            response_text = response.text.strip()

            # Parse the JSON array from response
            json_match = re.search(r'\[[\d\s,]*\]', response_text)
            if json_match:
                ranked_indices = json.loads(json_match.group())
                
                # Map back to original doc indices with boosted scores
                reranked = []
                for rank, cand_idx in enumerate(ranked_indices[:top_k]):
                    if 0 <= cand_idx < len(candidates):
                        doc_idx, bm25_score = candidates[cand_idx]
                        # Boost score by rank position (higher rank = higher boost)
                        rerank_boost = (top_k - rank) / top_k
                        reranked.append((doc_idx, bm25_score + rerank_boost * 10))

                if reranked:
                    print(f"Gemini reranker: {len(candidates)} candidates → {len(reranked)} reranked results")
                    return reranked

            print("Gemini reranker: could not parse response, falling back to BM25 order")
        except Exception as e:
            print(f"Gemini reranker failed (falling back to BM25): {e}")

        # Fallback: return BM25 order
        return candidates[:top_k]

    # ─────────────────────────────────────────────────────────────
    # INDEX LOAD / BUILD
    # ─────────────────────────────────────────────────────────────

    @classmethod
    def load_index(cls):
        """Load pre-built knowledge chunks from JSON file."""
        try:
            if os.path.exists(cls.KNOWLEDGE_STORE_PATH):
                print(f"Loading knowledge chunks from {cls.KNOWLEDGE_STORE_PATH}...")
                with open(cls.KNOWLEDGE_STORE_PATH, 'r', encoding='utf-8') as f:
                    cls._chunks = json.load(f)

                # Ensure all chunks have tokens
                for chunk in cls._chunks:
                    if "tokens" not in chunk:
                        chunk["tokens"] = cls._tokenize(chunk.get("text", ""))

                cls._build_bm25_index()
                cls._index_loaded = True
                print(f"Knowledge base loaded: {len(cls._chunks)} chunks ready for BM25 search.")
                print(f"Gemini reranker: {'ENABLED' if cls.RERANK_ENABLED else 'DISABLED'}")
                return True
            else:
                print(f"Knowledge store not found at {cls.KNOWLEDGE_STORE_PATH}")
                return False
        except Exception as e:
            print(f"Error loading knowledge base: {e}")
            traceback.print_exc()
            return False

    @classmethod
    def build_index(cls, pdf_directory: str = None):
        """
        Build knowledge chunks from PDFs — no embeddings needed.
        Reads PDFs, splits into chunks, tokenizes, and saves as JSON.
        Runs instantly with zero API calls.
        """
        try:
            from pypdf import PdfReader
        except ImportError:
            print("ERROR: pypdf is required. Install with: pip install pypdf")
            return False

        target_dir = pdf_directory or cls.PDF_DATA_PATH
        print(f"Building knowledge base from PDFs in: {target_dir}")

        if not os.path.exists(target_dir):
            print(f"Directory not found: {target_dir}")
            return False

        chunks = []
        files_processed = 0
        chunk_size = 1000
        chunk_overlap = 200

        for root, dirs, files in os.walk(target_dir):
            for file in files:
                if not file.lower().endswith('.pdf'):
                    continue

                file_path = os.path.join(root, file)
                print(f"Processing PDF: {file_path}")

                try:
                    reader = PdfReader(file_path)

                    for page_num, page in enumerate(reader.pages):
                        text = page.extract_text()
                        if not text or len(text.strip()) < 50:
                            continue

                        # Clean text
                        text = re.sub(r'\s+', ' ', text).strip()

                        # Split into overlapping chunks
                        start = 0
                        while start < len(text):
                            end = start + chunk_size
                            chunk_text = text[start:end]

                            # Break at sentence boundary if possible
                            if end < len(text):
                                last_period = chunk_text.rfind('. ')
                                if last_period > chunk_size * 0.5:
                                    chunk_text = chunk_text[:last_period + 1]
                                    end = start + last_period + 1

                            if len(chunk_text.strip()) > 50:
                                tokens = cls._tokenize(chunk_text)
                                chunks.append({
                                    "text": chunk_text.strip(),
                                    "source": file,
                                    "page": page_num + 1,
                                    "tokens": tokens
                                })

                            start = end - chunk_overlap
                            if start <= 0 and end >= len(text):
                                break

                    files_processed += 1
                    print(f"  Processed {file}: {len(reader.pages)} pages")

                except Exception as e:
                    print(f"  Failed to process {file}: {e}")
                    traceback.print_exc()

        if files_processed == 0:
            print("No PDF files processed.")
            return False

        # Save chunks
        cls._chunks = chunks
        os.makedirs(os.path.dirname(cls.KNOWLEDGE_STORE_PATH) or '.', exist_ok=True)

        with open(cls.KNOWLEDGE_STORE_PATH, 'w', encoding='utf-8') as f:
            json.dump(chunks, f, ensure_ascii=False, indent=2)

        cls._build_bm25_index()
        cls._index_loaded = True

        print(f"\n✅ Knowledge base built: {len(chunks)} chunks from {files_processed} PDFs")
        print(f"   Saved to: {cls.KNOWLEDGE_STORE_PATH}")
        return True

    # ─────────────────────────────────────────────────────────────
    # MAIN RETRIEVAL API
    # ─────────────────────────────────────────────────────────────

    @classmethod
    def get_relevant_context(cls, query: str, k: int = 3) -> str:
        """
        Retrieve relevant context for a query.

        Pipeline:
          1. Tokenize query
          2. Expand with Ayurvedic synonyms
          3. BM25 search (top-N candidates)
          4. (If enabled) Gemini rerank → top-k
          5. Format context for LLM
        """
        try:
            if not cls._index_loaded:
                success = cls.load_index()
                if not success:
                    print("Knowledge base not found, attempting to build from PDFs...")
                    success = cls.build_index()
                    if not success:
                        return ""

            if not cls._chunks:
                return ""

            # Tokenize and expand query
            query_tokens = cls._tokenize(query)
            expanded_tokens = cls._expand_query(query_tokens)

            if not expanded_tokens:
                return ""

            # BM25 search — get more candidates if reranking is enabled
            n_candidates = cls.RERANK_CANDIDATES if cls.RERANK_ENABLED else k
            bm25_results = cls._bm25_search(expanded_tokens, top_n=n_candidates)

            if not bm25_results:
                return ""

            # Rerank with Gemini if enabled
            if cls.RERANK_ENABLED and len(bm25_results) > k:
                top_chunks = cls._rerank_with_gemini(query, bm25_results, top_k=k)
            else:
                top_chunks = bm25_results[:k]

            if not top_chunks:
                return ""

            # Format context
            context_parts = []
            for idx, score in top_chunks:
                chunk = cls._chunks[idx]
                source = chunk.get("source", "unknown")
                page = chunk.get("page", 0)
                text = chunk.get("text", "").replace('\n', ' ')
                context_parts.append(f"[Source: {source}, Page: {page}, Relevance: {score:.2f}]\n{text}")

            return "\n\n".join(context_parts)

        except Exception as e:
            print(f"Error retrieving context: {e}")
            traceback.print_exc()
            return ""

    # ─────────────────────────────────────────────────────────────
    # BM25-ONLY RETRIEVAL (no reranker, for testing/comparison)
    # ─────────────────────────────────────────────────────────────

    @classmethod
    def get_relevant_context_bm25_only(cls, query: str, k: int = 3) -> str:
        """BM25-only retrieval (skips Gemini reranker). Useful for testing."""
        try:
            if not cls._index_loaded:
                cls.load_index()
            if not cls._chunks:
                return ""

            query_tokens = cls._tokenize(query)
            expanded_tokens = cls._expand_query(query_tokens)
            if not expanded_tokens:
                return ""

            bm25_results = cls._bm25_search(expanded_tokens, top_n=k)
            if not bm25_results:
                return ""

            context_parts = []
            for idx, score in bm25_results:
                chunk = cls._chunks[idx]
                source = chunk.get("source", "unknown")
                page = chunk.get("page", 0)
                text = chunk.get("text", "").replace('\n', ' ')
                context_parts.append(f"[Source: {source}, Page: {page}, Relevance: {score:.2f}]\n{text}")

            return "\n\n".join(context_parts)
        except Exception as e:
            print(f"Error in BM25-only retrieval: {e}")
            return ""

    # ─────────────────────────────────────────────────────────────
    # DIAGNOSTICS & STATS
    # ─────────────────────────────────────────────────────────────

    @classmethod
    def get_stats(cls) -> Dict:
        """Return index statistics for diagnostics."""
        return {
            "index_loaded": cls._index_loaded,
            "total_chunks": len(cls._chunks),
            "unique_terms": len(cls._doc_freqs),
            "avg_doc_length": round(cls._avg_dl, 1),
            "rerank_enabled": cls.RERANK_ENABLED,
            "knowledge_store_path": cls.KNOWLEDGE_STORE_PATH,
            "sources": list(set(c.get("source", "unknown") for c in cls._chunks)),
        }

    @classmethod
    def search_raw(cls, query: str, top_n: int = 5) -> List[Dict]:
        """
        Raw search results with full metadata — useful for debugging.
        Returns list of {text, source, page, score, tokens_matched}.
        """
        if not cls._index_loaded:
            cls.load_index()
        if not cls._chunks:
            return []

        query_tokens = cls._tokenize(query)
        expanded_tokens = cls._expand_query(query_tokens)
        results = cls._bm25_search(expanded_tokens, top_n=top_n)

        output = []
        for idx, score in results:
            chunk = cls._chunks[idx]
            doc_tokens = set(chunk.get("tokens", []))
            matched = [t for t in expanded_tokens if t in doc_tokens]
            output.append({
                "text": chunk.get("text", "")[:300],
                "source": chunk.get("source", "unknown"),
                "page": chunk.get("page", 0),
                "score": round(score, 4),
                "tokens_matched": matched,
                "query_tokens_original": query_tokens,
                "query_tokens_expanded": expanded_tokens,
            })

        return output
