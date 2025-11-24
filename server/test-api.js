import axios from 'axios';
import dotenv from 'dotenv';

// .env konfigürasyonunu başlat
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.0-flash'; 

console.log('API Key:', API_KEY);
console.log('Model:', MODEL);

// Test prompt
const testPrompt = "What is 2+2?";

console.log("Testing Gemini API connection...");

axios.post(
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
  {
    contents: [{
      parts: [{
        text: testPrompt
      }]
    }]
  },
  { 
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000
  }
)
.then(response => {
  console.log("Success! API is working.");
  console.log("Response:", response.data);
})
.catch(error => {
  console.error("API Connection Error:", error.message);
  if (error.response) {
    console.error("Status:", error.response.status);
    console.error("Data:", error.response.data);
  }
});