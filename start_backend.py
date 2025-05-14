import os
import subprocess
import sys

def start_backend():
    """
    Start the FastAPI backend server with proper CORS configuration
    """
    print("Starting the FastAPI backend server...")
    
    # Get the absolute path to the FastAPI server directory
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", "fastapi_server")
    
    # Command to start the FastAPI server with CORS allowed origins
    cmd = [
        sys.executable, 
        "-m", 
        "uvicorn", 
        "main:app", 
        "--host", 
        "0.0.0.0", 
        "--port", 
        "8000", 
        "--reload"
    ]
    
    # Set the working directory to the FastAPI server directory
    os.chdir(backend_dir)
    
    # Create a .env file if it doesn't exist to ensure required settings are available
    env_file = os.path.join(backend_dir, ".env")
    if not os.path.exists(env_file):
        print("Creating default .env file...")
        with open(env_file, "w") as f:
            f.write("FRONTEND_URL=http://localhost:3001\n")
            f.write("BACKEND_URL=http://localhost:8000\n")
            f.write("SUPABASE_URL=your_supabase_url\n")
            f.write("SUPABASE_KEY=your_supabase_key\n")
            f.write("DEFAULT_GOOGLE_API_KEY=your_google_api_key\n")
            f.write("DEFAULT_ALPHA_VANTAGE_KEY=your_alpha_vantage_key\n")
    
    print(f"Server will be available at: http://localhost:8000")
    print(f"Make sure your frontend is configured to connect to this URL")
    print("Press Ctrl+C to stop the server")
    
    # Start the server
    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\nShutting down the FastAPI server...")
    except Exception as e:
        print(f"Error starting the FastAPI server: {e}")

if __name__ == "__main__":
    start_backend()
