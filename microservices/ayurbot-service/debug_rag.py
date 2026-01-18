import os
import sys
# Add current dir to path
sys.path.append('/app')
from services.knowledge_service import KnowledgeService

print(f"Checking Path: {KnowledgeService.PDF_DATA_PATH}")
if os.path.exists(KnowledgeService.PDF_DATA_PATH):
    print(f"Files: {os.listdir(KnowledgeService.PDF_DATA_PATH)}")
else:
    print("Path does not exist")

print("Building index...")
try:
    success = KnowledgeService.build_index()
    print(f"Success: {success}")
except Exception as e:
    import traceback
    traceback.print_exc()
