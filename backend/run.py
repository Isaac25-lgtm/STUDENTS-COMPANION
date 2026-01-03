"""
Run script for Data Analysis Lab Backend
"""
import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

if __name__ == '__main__':
    app = create_app()
    
    print("\n" + "="*60)
    print("🔬 DATA ANALYSIS LAB BACKEND")
    print("="*60)
    print(f"✅ Server starting on http://localhost:5000")
    print(f"📊 API endpoints available at http://localhost:5000/api")
    print(f"💚 Health check: http://localhost:5000/health")
    print("="*60)
    print("\nPress Ctrl+C to stop the server\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)

