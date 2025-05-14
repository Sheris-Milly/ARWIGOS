/**
 * Test file for Gemini AI integration
 * Run with: node test_gemini.js
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test query
const testQuery = "What are the best strategies for long-term investing?";

async function testGemini() {
  try {
    console.log("Testing Gemini AI integration...");
    
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("ERROR: No Gemini API key found in environment variables!");
      console.error("Please set GOOGLE_API_KEY in your .env file");
      return;
    }
    
    console.log("API Key found, initializing Gemini model...");
    
    const model = new ChatGoogleGenerativeAI({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      apiKey: apiKey,
      temperature: 0.2,
      convertSystemMessageToHuman: true
    });
    
    console.log("Sending test query to Gemini...");
    console.log(`Query: "${testQuery}"`);
    
    const response = await model.invoke(testQuery);
    
    console.log("\n----- GEMINI RESPONSE -----");
    console.log(response.content);
    console.log("--------------------------\n");
    
    console.log("Gemini test completed successfully!");
  } catch (error) {
    console.error("Gemini test failed with error:", error);
    console.error("Error message:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

// Run the test
testGemini();
