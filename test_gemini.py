import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

# Load environment variables
load_dotenv()

def test_gemini_api():
    """
    Test if the Gemini API is working and can chat with it.
    """
    # Get API key from environment or use a default one
    google_api_key = os.getenv("GOOGLE_API_KEY")
    
    if not google_api_key:
        print("Error: No Google API key found in environment variables.")
        print("Please set the GOOGLE_API_KEY environment variable.")
        return False
    
    try:
        # Initialize the Gemini model with the same settings as in the main app
        chat_model = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",  # Using the same model as in settings
            google_api_key=google_api_key,
            temperature=0.2,
            convert_system_message_to_human=True
            # Removed safety_settings as the format has changed in the latest version
        )
        
        # Test with a simple query
        response = chat_model.invoke("Hello! Can you tell me what you can do to help with financial advice?")
        
        print("\n=== Gemini API Test Results ===")
        print("✅ Connection successful!")
        print("\nResponse from Gemini:")
        print(response.content)
        print("\n===============================")
        
        return True
    
    except Exception as e:
        print("\n=== Gemini API Test Results ===")
        print("❌ Connection failed!")
        print(f"Error: {str(e)}")
        print("\n===============================")
        
        return False

if __name__ == "__main__":
    print("Testing Gemini API connection...")
    test_gemini_api()
