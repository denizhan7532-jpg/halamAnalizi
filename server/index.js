import express from 'express';
import cors from 'cors';
import multer from 'multer';
import mammoth from 'mammoth';
import axios from 'axios';
// dotenv kütüphanesini import etmeyi unutmayın
import dotenv from 'dotenv';

// .env dosyasındaki değişkenleri yükle
dotenv.config();

const app = express();
// Portu .env'den al, yoksa 3001 kullan
const PORT = process.env.PORT || 3001;

// --- ÖNEMLİ GÜVENLİK DEĞİŞİKLİĞİ ---
// Anahtarı ASLA buraya açık yazmayın. process.env üzerinden okuyun.
const API_KEY = process.env.GEMINI_API_KEY;

// Sizin belirttiğiniz çalışan model
const MODEL = "gemini-1.5-flash";

// API Anahtarı kontrolü (Sunucu başlarken uyarsın)
if (!API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY .env dosyasında bulunamadı!");
  process.exit(1); // Anahtar yoksa sunucuyu durdur
}

app.use(cors());
app.use(express.json());

// Multer ayarları
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Sadece .docx veya .txt dosyaları desteklenmektedir.'));
    }
  }
});

app.post('/api/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Dosya yüklenmedi.' });
    }

    let extractedText = '';
    
    if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      extractedText = result.value;
    } else if (req.file.mimetype === 'text/plain') {
      extractedText = req.file.buffer.toString('utf-8');
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ error: 'Dosyadan metin çıkarılamadı.' });
    }

    // Sizin çalışan prompt yapınız
    const systemPrompt = `... JSON şemanız ...`;
    const aiPrompt = `${systemPrompt}\n\nDERS PROGRAMI METNİ:\n${extractedText}`;

    console.log(`${MODEL} modeline istek gönderiliyor...`);

    // AXIOS İSTEĞİ (Sizin yapınız, güvenli anahtar ile)
    const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent?key=${API_KEY}`
,
      {
        contents: [{
          parts: [{
            text: aiPrompt
          }]
        }],
        generationConfig: {
          // İsterseniz buraya parametre ekleyebilirsiniz
          temperature: 0.3,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("Yanıt alındı.");
    let analysisResult = response.data.candidates[0].content.parts[0].text;

    // JSON Temizleme (Markdown bloklarını kaldırma)
    analysisResult = analysisResult.replace(/```json\n/g, "").replace(/\n```/g, "").trim();

    // JSON Parse Denemesi
    try {
      const parsedResult = JSON.parse(analysisResult);
      res.json({
        success: true,
        data: parsedResult
      });
    } catch (parseError) {
      console.error("JSON Parse Hatası. Ham veri dönülüyor.");
      // Parse edilemezse bile ham veriyi dönelim ki hatayı görelim
      res.json({
        success: false,
        error: "AI yanıtı geçerli JSON formatında değildi.",
        rawResponse: analysisResult
      });
    }

  } catch (error) {
    console.error('API Hatası Detayı:', error.response ? error.response.data : error.message);
    res.status(500).json({
      error: 'Analiz sırasında bir hata oluştu.',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor. Model: ${MODEL}`);
});
