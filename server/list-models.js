import axios from 'axios';
import dotenv from 'dotenv';

// .env konfigürasyonunu başlat
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

console.log('API Key:', API_KEY);

console.log("Listing available models...");

axios.get(
  `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`,
  { 
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000
  }
)
.then(response => {
  console.log("Success! Available models:");
  console.log(JSON.stringify(response.data, null, 2));
})
.catch(error => {
  console.error("API Connection Error:", error.message);
  if (error.response) {
    console.error("Status:", error.response.status);
    console.error("Data:", error.response.data);
  }
});