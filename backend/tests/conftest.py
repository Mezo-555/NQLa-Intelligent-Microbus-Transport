import os
import sys
from pathlib import Path

os.environ.setdefault("JWT_SECRET_KEY", "unit-test-key-that-is-at-least-thirty-two-characters")
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://localhost/nqla")

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))
