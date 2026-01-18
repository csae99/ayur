import google.generativeai as genai
import os
import time

def test_api():
    print("Testing Gemini API connectivity...")
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("FAIL: No API key found in env")
        return

    genai.configure(api_key=api_key)
    model = "models/text-embedding-004"
    
    text = "Hello world, this is a test check."
    
    try:
        print(f"Attempting to embed string of length {len(text)}...")
        result = genai.embed_content(
            model=model,
            content=text,
            task_type="retrieval_document"
        )
        print("SUCCESS! API returned embeddings.")
        print(f"Embedding vector length: {len(result['embedding'])}")
    except Exception as e:
        print(f"FAIL: API Error: {e}")

if __name__ == "__main__":
    test_api()
