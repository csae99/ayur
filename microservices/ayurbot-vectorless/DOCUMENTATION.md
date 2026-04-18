# AyurBot Vectorless Service — Technical Documentation

> **Version:** 2.0.0  
> **Last Updated:** April 18, 2026  
> **Stack:** Python 3.13 · FastAPI · BM25 RAG · Gemini 2.5 Flash · MongoDB · Docker  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Project Structure](#3-project-structure)
4. [Technology Stack](#4-technology-stack)
5. [BM25 RAG Engine (Knowledge Retrieval)](#5-bm25-rag-engine-knowledge-retrieval)
6. [Chat Pipeline (End-to-End)](#6-chat-pipeline-end-to-end)
7. [Smart Cart v2 — Product Recommendation System](#7-smart-cart-v2--product-recommendation-system)
8. [Catalog Service Integration](#8-catalog-service-integration)
9. [Symptom-Herb Mapping](#9-symptom-herb-mapping)
10. [Dosha-Aware Personalization](#10-dosha-aware-personalization)
11. [API Endpoints Reference](#11-api-endpoints-reference)
12. [Data Files](#12-data-files)
13. [Environment Variables](#13-environment-variables)
14. [Docker Deployment](#14-docker-deployment)
15. [Comparison: Vectorless vs FAISS (v1)](#15-comparison-vectorless-vs-faiss-v1)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Overview

AyurBot Vectorless is an AI-powered Ayurvedic wellness chatbot that provides herbal recommendations, dosha assessments, diet plans, and product suggestions. It uses a **vectorless RAG (Retrieval Augmented Generation)** architecture — replacing the previous FAISS-based vector search with a lightweight **BM25 keyword search** engine.

### Key Features
- **Conversational AI** — Gemini 2.5 Flash with Ayurvedic knowledge
- **RAG Knowledge Retrieval** — BM25 search over 1,495 Ayurvedic text chunks (zero API cost)
- **Smart Product Recommendations** — Intelligent catalog integration with 4 herb-discovery sources
- **Dosha Assessment** — 10-question Prakriti quiz with personalized results
- **Diet Plan Generator** — PDF diet plans per dosha type
- **Visual Assessment** — Gemini Vision for face/tongue/skin dosha analysis
- **Multilingual** — Auto-detects user language (English/Hindi)
- **Conversation History** — Full session persistence in MongoDB

### Why Vectorless?
| Aspect | FAISS (v1) | BM25 Vectorless (v2) |
|---|---|---|
| Docker Image | 1.42 GB | 612 MB (**-57%**) |
| Startup Time | ~30s (embedding load) | ~2s (JSON parse + index build) |
| API Calls for RAG | 1 embedding call per query | **Zero** (fully offline) |
| Dependencies | numpy, faiss-cpu, sentence-transformers | None (pure Python math) |
| Recall Quality | High (semantic) | Good (keyword + synonym expansion) |
| Reranking | N/A | Optional Gemini reranker |

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        AYURBOT VECTORLESS SERVICE                    │
│                        (FastAPI · Port 8000)                        │
│                                                                      │
│  ┌─────────────┐    ┌──────────────────┐    ┌────────────────────┐  │
│  │   main.py   │───▶│  BM25 Knowledge  │    │  Recommendation    │  │
│  │  (FastAPI   │    │  Service         │    │  Service           │  │
│  │   Routes)   │    │                  │    │                    │  │
│  │             │    │  • Tokenizer     │    │  • Symptom→Herb    │  │
│  │  /chat      │    │  • Synonym Map   │    │    Mapping         │  │
│  │  /dosha/*   │    │  • BM25 Scorer   │    │  • Catalog Search  │  │
│  │  /recommend │    │  • Reranker      │    │    (single batch)  │  │
│  │  /diet-plan │    │                  │    │                    │  │
│  │  /vision    │    └──────────────────┘    └───────┬────────────┘  │
│  └──────┬──────┘                                    │               │
│         │              ┌────────────────┐           │               │
│         │              │  Dosha Service │           │               │
│         │              │  Diet Planner  │           │               │
│         │              │  Vision Service│           │               │
│         │              └────────────────┘           │               │
└─────────┼──────────────────────────────────────────┼───────────────┘
          │                                          │
          ▼                                          ▼
┌──────────────────┐                      ┌──────────────────┐
│   MongoDB Atlas  │                      │  Catalog Service │
│                  │                      │  (Node.js/PG)    │
│  • Conversations │                      │                  │
│  • Dosha Results │                      │ GET /items/      │
│  • Chat History  │                      │     recommend    │
└──────────────────┘                      └──────────────────┘
          │                                          │
          ▼                                          ▼
┌──────────────────┐                      ┌──────────────────┐
│  Gemini 2.5 Flash│                      │  PostgreSQL      │
│  (Google AI)     │                      │  (Supabase)      │
│                  │                      │                  │
│  • Chat Response │                      │  • Product Items │
│  • Reranking     │                      │  • Inventory     │
│  • Vision        │                      │  • Pricing       │
└──────────────────┘                      └──────────────────┘
```

---

## 3. Project Structure

```
ayurbot-vectorless/
├── main.py                          # FastAPI app entry point & all routes
├── Dockerfile                       # Docker build (python:3.13-slim-bookworm)
├── requirements.txt                 # Python dependencies
├── ingest.py                        # PDF → knowledge_chunks.json builder
├── test_vectorless.py               # Unit tests
├── DOCUMENTATION.md                 # This file
│
├── data/
│   ├── knowledge_chunks.json        # Pre-built BM25 index (1,495 chunks, ~2.7MB)
│   └── symptom_herb_map.json        # Symptom → herb mapping (30 conditions)
│
├── database/
│   └── mongodb.py                   # MongoDB connection (Atlas TLS auto-detect)
│
├── models/
│   ├── __init__.py
│   ├── conversation.py              # Chat session CRUD model
│   └── dosha_assessment.py          # Dosha quiz results model
│
└── services/
    ├── __init__.py
    ├── bm25_knowledge_service.py    # BM25 RAG engine (620 lines)
    ├── recommendation_service.py    # Catalog integration & herb mapping
    ├── dosha_service.py             # Dosha quiz & assessment logic
    ├── diet_planner_service.py      # PDF diet plan generator
    └── vision_service.py            # Gemini Vision analysis
```

---

## 4. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Web Framework** | FastAPI 0.115+ | Async REST API with auto-docs |
| **AI Model** | Google Gemini 2.5 Flash | Chat responses, reranking, vision |
| **RAG Engine** | Custom BM25 (Okapi BM25) | Knowledge retrieval from Ayurvedic texts |
| **Database** | MongoDB (via Motor async driver) | Conversation history, dosha assessments |
| **Product Catalog** | Catalog Service (Node.js + PostgreSQL) | Product search & recommendations |
| **HTTP Client** | httpx | Async HTTP calls to catalog service |
| **PDF Processing** | pypdf | Extract text from Ayurvedic PDFs |
| **PDF Generation** | ReportLab + Pillow | Diet plan PDF output |
| **Auth/TLS** | certifi | MongoDB Atlas TLS certificates |
| **Container** | Docker (python:3.13-slim-bookworm) | 612 MB image |

### Python Dependencies (`requirements.txt`)
```
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
google-generativeai>=0.4.1
pymongo>=4.6.3
motor>=3.3.2
pydantic>=2.5.0
python-dotenv>=1.0.0
httpx>=0.25.2
certifi>=2024.7.4
rank-bm25>=0.2.2
pypdf>=4.0.0
reportlab
pillow>=12.1.1
cryptography>=46.0.5
protobuf>=5.29.6
```

---

## 5. BM25 RAG Engine (Knowledge Retrieval)

**File:** `services/bm25_knowledge_service.py` (620 lines)

### What is BM25?

BM25 (Best Matching 25, also known as Okapi BM25) is a probabilistic information retrieval algorithm. Unlike vector embeddings (FAISS), BM25 works on **keyword matching** with two key improvements over simple TF-IDF:

1. **Term Frequency Saturation** — Prevents a word appearing 100 times from scoring 100x more than appearing once
2. **Document Length Normalization** — Adjusts for short vs long documents

### BM25 Formula

For each query term `q` in document `d`:

```
Score(q, d) = IDF(q) × [ tf(q,d) × (k₁ + 1) ] / [ tf(q,d) + k₁ × (1 - b + b × |d|/avgdl) ]
```

Where:
- **IDF(q)** = `log((N - df(q) + 0.5) / (df(q) + 0.5) + 1)` — Inverse Document Frequency
- **tf(q,d)** = Term frequency of `q` in document `d`
- **k₁ = 1.5** — Term frequency saturation parameter
- **b = 0.75** — Document length normalization parameter
- **N** = Total number of documents (1,495)
- **df(q)** = Number of documents containing term `q`
- **|d|** = Length of document `d` (in tokens)
- **avgdl** = Average document length (68.5 tokens)

### Retrieval Pipeline

```
User Query: "What herbs help with bloating?"
        │
        ▼
┌─── STEP 1: Tokenize ───────────────────────────────────────────────┐
│  Input:  "What herbs help with bloating?"                          │
│  Output: ["herbs", "help", "bloating"]                             │
│  (Lowercase → alpha split → stopword removal → min length 2)      │
└────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─── STEP 2: Synonym Expansion ──────────────────────────────────────┐
│  "bloating" matches SYNONYM_MAP:                                   │
│  → ["agni", "digestive", "fire", "mandagni", "ama", "vata", "gas"]│
│                                                                    │
│  Expanded tokens: ["herbs", "help", "bloating", "agni",           │
│                     "digestive", "fire", "mandagni", "ama",       │
│                     "vata", "gas", "aadhmana"]                    │
│                                                                    │
│  40+ synonym groups covering doshas, herbs, conditions,           │
│  Sanskrit terms, and Ayurvedic formulations                       │
└────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─── STEP 3: BM25 Search ───────────────────────────────────────────┐
│  Uses INVERTED INDEX for efficient candidate selection:            │
│  - Only scores documents containing at least 1 query token        │
│  - Calculates BM25 score for each candidate                      │
│  - Returns top-N results sorted by score                          │
│                                                                    │
│  Index stats: 1,495 docs · 23,027 unique terms · avg_dl=68.5     │
└────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─── STEP 4: Optional Gemini Reranker ──────────────────────────────┐
│  (When BM25_RERANK_ENABLED=true)                                   │
│  Takes BM25 top-10 candidates → sends to Gemini with prompt →    │
│  Gemini returns reranked indices → top 3 used                     │
│  Cost: 1 additional Gemini call per query                         │
│                                                                    │
│  Currently DISABLED to conserve Gemini free-tier rate limits      │
└────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─── STEP 5: Format Context ────────────────────────────────────────┐
│  Output: "[Source: ayurveda_herbs.pdf, Page: 42, Relevance: 8.73]│
│           Agni, the digestive fire, is central to Ayurvedic..."  │
│                                                                    │
│  This context is injected into the Gemini prompt as               │
│  "Reference Material" for RAG-augmented responses                 │
└────────────────────────────────────────────────────────────────────┘
```

### Synonym Map (40+ Entries)

The synonym map expands user queries with Ayurvedic-specific terminology:

| Category | Example Mapping |
|---|---|
| **Digestive** | `bloating` → agni, digestive fire, mandagni, ama, vata, gas |
| **Mental Health** | `stress` → vata, anxiety, cortisol, nervine, adaptogenic, medhya |
| **Musculoskeletal** | `joint` → sandhi, asthi, vata, boswellia, guggul, arthritis |
| **Herbs** | `ashwagandha` → withania, somnifera, adaptogen, rasayana, strength |
| **Doshas** | `vata` → vayu, air, space, dry, cold, light, mobile |
| **Formulations** | `churna` → powder, herbal powder, formulation, preparation |

This mapping dramatically improves recall for queries that use modern English terms while the knowledge base uses Sanskrit/Ayurvedic terminology.

### Knowledge Chunks

**File:** `data/knowledge_chunks.json` (2.7 MB, 1,495 chunks)

Built from Ayurvedic PDF textbooks via `ingest.py`:
- Chunks are ~1,000 characters with 200-character overlap
- Each chunk stores: `text`, `source` (PDF filename), `page` number, `tokens` (pre-tokenized)
- Sentence boundary detection prevents mid-sentence splits

---

## 6. Chat Pipeline (End-to-End)

When a user sends a message to `/chat`, the following happens:

```
┌─────────────────────────────────────────────────────────────────┐
│  POST /chat { message, session_id, user_id }                    │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─── 1. Session Management ─────────────────────────────────────┐
│  • Generate session_id if not provided                        │
│  • Fetch or create conversation in MongoDB                    │
│  • Load last 6 messages as history                            │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌─── 2. BM25 RAG Context Retrieval ─────────────────────────────┐
│  • BM25 search with synonym expansion (zero API cost)         │
│  • Returns top 3 relevant Ayurvedic text chunks               │
│  • Injected as "Reference Material" in the prompt             │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌─── 3. Gemini API Call ────────────────────────────────────────┐
│  • Combines: SYSTEM_PROMPT + RAG_CONTEXT + HISTORY + MESSAGE  │
│  • System prompt defines AyurBot persona + guidelines         │
│  • Model: gemini-2.5-flash (1 API call)                       │
│  • Safety filter fallback for blocked responses               │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌─── 4. Save to MongoDB ───────────────────────────────────────┐
│  • Save user message + bot response to conversation           │
│  • Timestamp each message                                     │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌─── 5. Generate Suggestions ──────────────────────────────────┐
│  • Context-aware follow-up suggestions                        │
│  • If response mentions dosha → dosha-related questions        │
│  • If response mentions herbs → herb-related questions         │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌─── 6. Smart Cart v2 (Product Recommendations) ───────────────┐
│  • 4 sources of herb discovery (see Section 7 below)          │
│  • Intent-filtered or open herb search                        │
│  • Single batch call to Catalog Service                       │
│  • Returns max 4 relevance-ranked products                    │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌─── 7. Response ──────────────────────────────────────────────┐
│  {                                                            │
│    "response": "Namaste! For bloating, Ayurveda suggests...",│
│    "session_id": "uuid-...",                                  │
│    "suggestions": ["What is my dosha?", ...],                 │
│    "products": [{ item_title, price, ... }, ...]              │
│  }                                                            │
└───────────────────────────────────────────────────────────────┘
```

### Gemini API Cost Per Chat Message

| Component | API Calls | Cost |
|---|---|---|
| BM25 Context Retrieval | 0 (offline) | Free |
| Gemini Chat Response | 1 | ~0.0001 USD |
| Gemini Reranker (if enabled) | 1 | ~0.0001 USD |
| Catalog Product Search | 0 (internal HTTP) | Free |
| **Total (reranker off)** | **1** | **~0.0001 USD** |
| **Total (reranker on)** | **2** | **~0.0002 USD** |

---

## 7. Smart Cart v2 — Product Recommendation System

**Location:** `main.py` lines 200–282

The Smart Cart is the core product recommendation engine. When the bot responds to a health query, it automatically suggests relevant products from the catalog.

### How Products Are Recommended (4 Sources)

The system discovers herbs from **4 independent sources** and combines them:

```
┌───────────────────────────────────────────────────────────┐
│                    4 SOURCES OF HERBS                      │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  SOURCE 1: User Intent Tags                               │
│  ─────────────────────                                    │
│  Scans the USER MESSAGE for known symptom keywords        │
│  from symptom_herb_map.json (30 conditions)               │
│                                                           │
│  Example: "I have bloating and acidity"                   │
│  → Detected: ["bloating", "acidity"]                      │
│                                                           │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  SOURCE 2: Bot Response Herbs                             │
│  ─────────────────────────                                │
│  Scans Gemini's RESPONSE TEXT for known herb names        │
│  (40 herbs from the symptom map)                          │
│                                                           │
│  Example response: "...Fennel and Ginger can help..."     │
│  → Detected: ["Fennel", "Ginger"]                         │
│                                                           │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  SOURCE 3: BM25 Context Herbs                             │
│  ─────────────────────────                                │
│  Scans the BM25-RETRIEVED CONTEXT for herb names          │
│  (herbs from the Ayurvedic knowledge chunks)              │
│                                                           │
│  Example: BM25 retrieved a passage mentioning "Amla"      │
│  → Detected: ["Amla"]                                     │
│                                                           │
│  This makes BM25 do DOUBLE DUTY:                          │
│  1. Provide knowledge for Gemini's answer                 │
│  2. Discover herbs for product recommendations            │
│                                                           │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  SOURCE 4: Dosha Affinity Herbs (Personalized)            │
│  ──────────────────────────────────────────                │
│  If the user has a stored dosha assessment, fetch their   │
│  primary dosha and add affinity herbs                     │
│                                                           │
│  Vata  → Ashwagandha, Shatavari                          │
│  Pitta → Brahmi, Amla                                    │
│  Kapha → Ginger, Turmeric                                │
│                                                           │
│  (Only activated when user_id is provided)                │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Intent-Based Filtering

After collecting herbs from all 4 sources, the system applies **intent filtering**:

#### Strict Mode (intent tags found)
When symptom keywords are detected in the user message:
1. Look up valid herbs for each symptom in `symptom_herb_map.json`
2. Only keep herbs that are mapped to the detected symptoms
3. Always include dosha affinity herbs (personalized)
4. Send to catalog with both herbs AND symptom tags

```
User: "I have bloating"
→ Intent: ["bloating"]
→ Valid herbs for bloating: ["Fennel", "Ajwain", "Ginger"]
→ All candidates: ["Fennel", "Ginger", "Amla", "Ashwagandha"]  (from sources 2-4)
→ Filtered:       ["Fennel", "Ginger"]  (only bloating-valid herbs kept)
→ + dosha herbs:  ["Fennel", "Ginger", "Brahmi"]  (user is Pitta)
→ Sent to catalog: herbs=Fennel,Ginger,Brahmi  symptoms=bloating
```

#### Relaxed Mode (no intent tags)
When no symptom keywords are detected (e.g., "Tell me about Ashwagandha"):
1. Use ALL herb candidates from sources 2-4
2. No filtering applied
3. Rely on catalog's relevance ranking

```
User: "Tell me about Ashwagandha for stress"
→ Intent: [] (no symptom map keyword)
→ All candidates: ["Ashwagandha", "Brahmi"]  (from bot + context)
→ No filtering, sent as-is
→ Sent to catalog: herbs=Ashwagandha,Brahmi  symptoms=
```

### End-to-End Example

```
User Message: "I have bloating and acidity problems"

STEP 1 — BM25 retrieves context about Agni, digestive fire, Amla
STEP 2 — Gemini responds mentioning Fennel, Ginger, Coriander, Amla
STEP 3 — Smart Cart discovers herbs:
         Source 1 (intent):    ["bloating", "acidity"]
         Source 2 (bot):       ["Fennel", "Ginger", "Coriander"]
         Source 3 (BM25):      ["Amla"]
         Source 4 (dosha):     [] (no user_id)
STEP 4 — Intent filter: bloating→[Fennel,Ajwain,Ginger], acidity→[Amla,Licorice,Coriander]
         Filtered herbs: ["Fennel", "Ginger", "Coriander", "Amla"]
STEP 5 — Single call: GET /items/recommend?herbs=Coriander,Fennel,Amla&symptoms=acidity,bloating&limit=4
STEP 6 — Catalog returns 4 ranked products:
         1. Patanjali Amla Juice (₹150)       — acidity tag + Amla title
         2. Baidyanath Ajwain Ark (₹89)       — bloating tag
         3. Himalaya Anti-Hair Fall Oil (₹225) — Amla in tags
         4. Zandu Triphala Tablets (₹149)      — bloating + digestion tags
```

---

## 8. Catalog Service Integration

### New Endpoint: `GET /items/recommend`

**File:** `catalog-service/src/routes/catalog.js`

This endpoint was specifically built for AyurBot's product recommendations. It replaces the old pattern of making N sequential `GET /items?search=<herb>` calls.

#### Request
```
GET /items/recommend?herbs=Triphala,Ginger&symptoms=digestion,bloating&limit=4
```

| Parameter | Type | Description |
|---|---|---|
| `herbs` | string (CSV) | Comma-separated herb names to search |
| `symptoms` | string (CSV) | Comma-separated symptom/condition tags |
| `limit` | number | Maximum products to return (default: 4) |

#### How It Works

1. **Combine Terms** — Merges herbs and symptoms into a single search term list
2. **Multi-field OR Query** — For each term, generates 3 Sequelize `Op.iLike` conditions:
   - `item_title ILIKE '%term%'`
   - `item_tags ILIKE '%term%'`
   - `item_details ILIKE '%term%'`
3. **Filters Applied:**
   - `status = 'Approved'` (only admin-approved products)
   - `item_quantity > 0` (in-stock only)
4. **Relevance Ranking** — Each matching product gets a score:
   - Title match: **+3 points** per term
   - Tag match: **+2 points** per term
   - Details match: **+1 point** per term
5. **Deduplication** — Removes duplicate products by title
6. **Sort & Limit** — Returns top N products by relevance score

#### Example Response
```json
[
  {
    "id": 58,
    "item_title": "Himalaya Ashwagandha Tablets",
    "item_brand": "Himalaya",
    "item_cat": "Herbal Supplement",
    "item_details": "Organic Ashwagandha extract for stress relief...",
    "item_tags": "stress, energy, vitality, ashwagandha, anxiety",
    "item_price": 349,
    "item_quantity": 200,
    "item_image": "https://...",
    "status": "Approved"
  }
]
```

### Old vs New Catalog Call Pattern

| Aspect | Old (v1) | New (v2) |
|---|---|---|
| HTTP Calls | N sequential calls (1 per herb, up to 5) | **1 single call** |
| Search Fields | `item_title` only | `item_title` + `item_tags` + `item_details` |
| Stock Filter | None (out-of-stock shown) | `item_quantity > 0` |
| Ranking | None (first-come order) | Relevance scoring (title=3, tag=2, detail=1) |
| Deduplication | Client-side set | Server-side set |
| Post-Filter | Complex client-side filter | Not needed (catalog handles it) |

---

## 9. Symptom-Herb Mapping

**File:** `data/symptom_herb_map.json`

This file maps 30 health conditions to their recommended Ayurvedic herbs. It serves two purposes:
1. **Intent Detection** — Detecting symptoms from user messages
2. **Herb Validation** — Ensuring recommended products are relevant to the detected intent

### Full Mapping (30 Conditions)

| Condition | Herbs | Description |
|---|---|---|
| `stress` | Ashwagandha, Brahmi, Tulsi | Adaptogenic herbs for cortisol |
| `anxiety` | Ashwagandha, Brahmi, Jatamansi | Nervine tonics for mental clarity |
| `insomnia` | Ashwagandha, Jatamansi, Shankhpushpi | Sleep-inducing nervine herbs |
| `digestion` | Triphala, Ginger, Fennel | Digestive fire (Agni) kindlers |
| `constipation` | Triphala, Psyllium Husk, Aloe Vera | Gentle bowel regulators |
| `immunity` | Tulsi, Turmeric, Amla | Antioxidant immune boosters |
| `inflammation` | Turmeric, Boswellia, Ginger | Anti-inflammatory herbs |
| `joint_pain` | Boswellia, Turmeric, Guggul | Joint health support |
| `memory` | Brahmi, Shankhpushpi, Gotu Kola | Nootropic cognitive herbs |
| `focus` | Brahmi, Gotu Kola, Ashwagandha | Concentration enhancers |
| `fatigue` | Ashwagandha, Shatavari, Gokshura | Rejuvenating rasayana |
| `women_health` | Shatavari, Ashoka, Lodhra | Female reproductive tonics |
| `mens_health` | Ashwagandha, Gokshura, Safed Musli | Male vitality support |
| `skin` | Neem, Turmeric, Manjistha | Blood-purifying skin herbs |
| `hair` | Bhringraj, Amla, Brahmi | Hair follicle nourishment |
| `respiratory` | Tulsi, Vasaka, Licorice | Lung health tonics |
| `diabetes` | Gudmar, Bitter Melon, Fenugreek | Blood sugar regulators |
| `cholesterol` | Guggul, Arjuna, Garlic | Lipid metabolism support |
| `liver` | Kutki, Punarnava, Bhumi Amla | Hepatoprotective herbs |
| `detox` | Triphala, Neem, Manjistha | Body toxin elimination |
| `bloating` | Fennel, Ajwain, Ginger | Gas and bloating relief |
| `acidity` | Amla, Licorice, Coriander | Stomach acid neutralizers |
| `weight_loss` | Guggul, Triphala, Garcinia | Metabolism boosters |
| `weight_gain` | Ashwagandha, Shatavari, Vidari | Nourishing rasayana |
| `cold_cough` | Tulsi, Ginger, Licorice | Cold and cough expectorants |
| `fever` | Tulsi, Giloy, Neem | Antipyretic immunity herbs |
| `blood_pressure` | Arjuna, Garlic, Brahmi | Heart health cardiotonics |
| `thyroid` | Guggul, Ashwagandha, Brahmi | Thyroid hormone balance |
| `energy` | Ashwagandha, Shilajit, Gokshura | Vitality and stamina |
| `menstrual` | Shatavari, Ashoka, Dashamoola | Menstrual cycle regulation |

### Total Unique Herbs: 40

---

## 10. Dosha-Aware Personalization

**Location:** `main.py` lines 119–124 and 230–243

If a user has completed the dosha quiz (`/dosha/assess`), their primary dosha is stored in MongoDB. During chat, the Smart Cart fetches this and adds **dosha-affinity herbs** to the product search.

### Dosha → Herb Affinity Map

```python
DOSHA_HERB_AFFINITY = {
    "vata":  ["Ashwagandha", "Shatavari", "Sesame"],    # Grounding, warming
    "pitta": ["Brahmi", "Amla", "Shatavari"],            # Cooling, soothing
    "kapha": ["Ginger", "Turmeric", "Trikatu"]           # Warming, stimulating
}
```

### How It Works

1. Check if `user_id` is provided in the chat message
2. Query MongoDB for the latest dosha assessment for that user
3. Extract `primary_dosha` from the assessment results
4. Look up the dosha in `DOSHA_HERB_AFFINITY`
5. Append the top 2 affinity herbs to the product search

This means a Vata user asking about "cold and cough" will see products matching their dosha (Ashwagandha) alongside the condition-specific herbs (Tulsi, Ginger).

### Fallback Behavior
- If no `user_id` provided → skip dosha lookup
- If no dosha assessment found → skip (non-fatal)
- If dosha lookup fails → log error, continue without personalization

---

## 11. API Endpoints Reference

### Core Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Service info (name, version, RAG type) |
| `GET` | `/health` | Health check (model, database, engine) |
| `POST` | `/chat` | Main chat endpoint (RAG + products) |
| `GET` | `/history/{session_id}` | Get conversation history |
| `DELETE` | `/session/{session_id}` | Delete a conversation |
| `GET` | `/user/{user_id}/conversations` | List user's conversations |

### Dosha Assessment

| Method | Path | Description |
|---|---|---|
| `GET` | `/dosha/quiz` | Get 10 dosha quiz questions |
| `POST` | `/dosha/assess` | Submit answers, get dosha result |
| `GET` | `/dosha/history/{user_id}` | Get past dosha assessments |

### Recommendations & Tools

| Method | Path | Description |
|---|---|---|
| `POST` | `/recommend/herbs` | Get herb recommendations for symptoms |
| `GET` | `/diet-plan/{dosha}` | Download 7-day diet plan PDF |
| `POST` | `/vision-assessment` | Analyze face/tongue/skin image |

### Chat Request/Response Schema

**Request:**
```json
{
  "message": "I have bloating and acidity problems",
  "session_id": "optional-uuid",
  "user_id": 1
}
```

**Response:**
```json
{
  "response": "Namaste! For bloating and acidity, Ayurveda focuses on...",
  "session_id": "uuid-...",
  "suggestions": ["What is my dosha?", "How do I balance my dosha?", "Dosha-specific diet tips"],
  "products": [
    {
      "id": 63,
      "item_title": "Baidyanath Ajwain Ark",
      "item_brand": "Baidyanath",
      "item_price": 89,
      "item_quantity": 250,
      "item_tags": "bloating, digestion, gas, acidity, ajwain",
      "item_image": "https://..."
    }
  ]
}
```

---

## 12. Data Files

### `data/knowledge_chunks.json`

| Property | Value |
|---|---|
| Size | 2.7 MB |
| Chunks | 1,495 |
| Unique Terms | 23,027 |
| Average Chunk Length | 68.5 tokens |
| Sources | Ayurvedic PDF textbooks |
| Chunk Size | ~1,000 chars with 200-char overlap |

Each chunk structure:
```json
{
  "text": "Ashwagandha (Withania somnifera) is one of the most...",
  "source": "ayurveda_herbs_guide.pdf",
  "page": 42,
  "tokens": ["ashwagandha", "withania", "somnifera", "one", "most", ...]
}
```

### `data/symptom_herb_map.json`

| Property | Value |
|---|---|
| Size | 6.3 KB |
| Conditions | 30 |
| Unique Herbs | 40 |
| Format | `{ "condition": { "herbs": [...], "description": "..." } }` |

---

## 13. Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | — | Google AI API key for Gemini 2.5 Flash |
| `MONGO_URI` | No | `mongodb://mongo-db:27017` | MongoDB connection string |
| `PORT` | No | `8000` | Service port |
| `BM25_RERANK_ENABLED` | No | `false` | Enable Gemini reranker (1 extra API call) |
| `CATALOG_SERVICE_URL` | No | `http://catalog-service:3002` | Catalog service base URL |

### Docker Compose Environment (Cloud)

```yaml
ayurbot-service:
  image: shubham554/ayur-ayurbot-service:vectorless
  build: ./ayurbot-vectorless
  environment:
    - PORT=8000
    - GEMINI_API_KEY=<your-key>
    - MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/...
    - BM25_RERANK_ENABLED=false
  volumes:
    - ./trainingdata-ayurbot:/app/data/pdfs
    - ./ayurbot-vectorless/data/knowledge_chunks.json:/app/data/knowledge_chunks.json
```

---

## 14. Docker Deployment

### Dockerfile

```dockerfile
FROM python:3.13-slim-bookworm
WORKDIR /app
RUN apt-get update && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Image Size

| Image | Tag | Size |
|---|---|---|
| `ayur-ayurbot-service` | `dev5` (FAISS) | 1.42 GB |
| `ayur-ayurbot-service` | `vectorless` (BM25) | **612 MB** |

### Build & Run

```bash
# Build
docker compose -f docker-compose.cloud.yml build ayurbot-service

# Run all services
docker compose -f docker-compose.cloud.yml up -d

# View logs
docker logs microservices-ayurbot-service-1 --follow

# Expected startup output:
# STARTUP: Loaded 40 herbs from map.
# Connected to MongoDB at mongodb+srv://...
# Initializing Vectorless Knowledge Base (BM25)...
# BM25 index built: 1495 docs, 23027 unique terms, avg_dl=68.5
# Knowledge base loaded: 1495 chunks ready for BM25 search.
# Gemini reranker: DISABLED
# Application startup complete.
# Uvicorn running on http://0.0.0.0:8000
```

---

## 15. Comparison: Vectorless vs FAISS (v1)

| Feature | FAISS (v1) | BM25 Vectorless (v2) |
|---|---|---|
| **Retrieval Method** | Vector similarity (cosine) | BM25 keyword scoring |
| **Embedding Model** | sentence-transformers | None needed |
| **Index Storage** | `.faiss` binary file | JSON text file |
| **API Calls for RAG** | 1 embedding call/query | 0 (fully offline) |
| **Synonym Expansion** | None | 40+ Ayurvedic synonym groups |
| **Catalog Integration** | N serial HTTP calls | 1 batch call |
| **Product Search Fields** | `item_title` only | `item_title` + `item_tags` + `item_details` |
| **In-Stock Filter** | None | `item_quantity > 0` |
| **Relevance Ranking** | None | Score: title(3) + tag(2) + detail(1) |
| **Dosha Personalization** | None | Dosha affinity herbs |
| **BM25 → Product Discovery** | None | BM25 context herb extraction |
| **Docker Image** | 1.42 GB | 612 MB |
| **Startup Time** | ~30 seconds | ~2 seconds |
| **Dependencies** | numpy, faiss-cpu, torch | Pure Python (math, json, re) |

---

## 16. Troubleshooting

### Common Issues

**1. "SMART_CART: Catalog returned 0 products"**
- Check if catalog-service is running: `docker logs microservices-catalog-service-1`
- Verify products exist: query `/api/catalog/items` in browser
- Ensure products have `status: 'Approved'` and `item_quantity > 0`
- Check `CATALOG_SERVICE_URL` env var matches the Docker network name

**2. "Knowledge base not found"**
- Ensure `data/knowledge_chunks.json` is mounted or copied into the container
- Check volume mount in docker-compose: `./ayurbot-vectorless/data/knowledge_chunks.json:/app/data/knowledge_chunks.json`
- Run `ingest.py` to rebuild from PDFs if the file is missing

**3. "502 Bad Gateway" after rebuild**
- Restart the API gateway: `docker restart microservices-api-gateway-1`
- The gateway caches container IPs; after a rebuild, IPs change and need refresh

**4. "Gemini API rate limit exceeded"**
- Set `BM25_RERANK_ENABLED=false` to reduce from 2 → 1 Gemini call per message
- Free tier is limited to 5 requests/minute
- Consider upgrading to Gemini API paid plan for production

**5. BM25 returning irrelevant results**
- Check if the query terms exist in the synonym map
- Add new synonym entries to `SYNONYM_MAP` in `bm25_knowledge_service.py`
- Rebuild knowledge chunks with additional PDFs using `ingest.py`

---

*Documentation generated for AyurBot Vectorless Service v2.0.0*
