import os
import sys

# Add parent directory to path so local imports resolve correctly on Vercel
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
