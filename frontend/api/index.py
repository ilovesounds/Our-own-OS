import os
import sys

# Add parent directory (frontend/) to path so local imports resolve correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
