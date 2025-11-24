import express from 'express';
import cors from 'cors';
import multer from 'multer';
import mammoth from 'mammoth';
import axios from 'axios';
// GÜVENLİK İÇİN EKLENDİ: .env dosyasını okumak için
import dotenv from 'dotenv';

// .env konfigürasyonunu başlat
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// GÜVENLİK UYARISI: Anahtarı .env dosyasından çekiyoruz.
const API_KEY = process.env.GEMINI_API_KEY;

// Anahtar kontrolü
if (!API_KEY) {
  console.error("KRİTİK HATA: GEMINI_API_KEY .env dosyasında bulunamadı!");
  process.exit(1); // Sunucuyu durdur
}

// Yeni model sürümü
const MODEL = 'gemini-2.0-flash'; 

app.use(cors());
app.use(express.json());

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

// YENİ DETAYLI RUBRİK SİSTEMİ PROMPTU (Ufak yazım hataları düzeltildi)
const rubricsSystemPrompt = `
Sen uzman bir pedagog ve öğretmen eğitmenisin. Görevin, aşağıda verilen öğrenci ders planı metnini, belirtilen 30 kriterlik rubriğe (değerlendirme ölçeğine) göre titizlikle puanlamak ve geri bildirim vermektir.

**PUANLAMA ÖLÇEĞİ (Her kriter için):**
- 1: Yetersiz
- 1.5: Kabul Edilebilir
- 2: Orta
- 2.5: İyi
- 3: Çok İyi

**GÖREVLERİN:**
1. Her bir kriter için metni analiz et ve 1 ile 3 arasında bir puan ver.
2. Verdiğin puan için kısa, yapıcı bir gerekçe (feedback) yaz.
3. Her bölümün kendi içindeki toplam puanını hesapla.
4. Tüm bölümlerin toplam puanını 'ai_score_90' alanına yaz (Maksimum 90 olabilir).
5. Ders planının geneli için güçlü yönler, geliştirilmesi gereken alanlar ve somut öneriler sun.

**ÇIKTI FORMATI:**
SADECE aşağıdaki JSON şemasına uygun, geçerli bir JSON nesnesi döndür. Başka hiçbir metin veya markdown formatı kullanma.

**JSON ŞEMASI VE KRİTERLER:**
{
  "ai_score_90": (0-90 arası ondalıklı sayı, tüm kriter puanlarının toplamı),
  "sections": [
    {
      "title": "1. Derse hazırlık ve öğretimi planlama",
      "max_section_score": 24,
      "section_score": (Bu bölümdeki 8 kriterin toplam puanı),
      "criteria": [
        { "id": 1, "text": "Micro dersi için öğretim programındaki kazanımları temel almıştır.", "score": (1-3 arası), "feedback": "..." },
        { "id": 2, "text": "Ders planı incelendiğinde öğretmen adayının anlatacağı konu ile ilgili temel ilke, kavram ve terminoloji bilgisine sahip olduğu görülmektedir.", "score": (1-3 arası), "feedback": "..." },
        { "id": 3, "text": "Ders planını, ders planının adımlarına göre düzenli ve sistematik bir şekildedir.", "score": (1-3 arası), "feedback": "..." },
        { "id": 4, "text": "Ders planında kazanımlar, öğretim faaliyetleri ve değerlendirme birbirleriyle uyumludur.", "score": (1-3 arası), "feedback": "..." },
        { "id": 5, "text": "Ders planında belirtiği öğrenme kuramına uygun ders planı hazırlamıştır.", "score": (1-3 arası), "feedback": "..." },
        { "id": 6, "text": "Ders planında belirtiği öğretim stratejisine uygun ders planı hazırlamıştır.", "score": (1-3 arası), "feedback": "..." },
        { "id": 7, "text": "Ders planında belirtiği öğretim yöntemine uygun ders planı hazırlamıştır.", "score": (1-3 arası), "feedback": "..." },
        { "id": 8, "text": "Ders planında belirtiği öğretim tekniğine uygun ders planı hazırlamıştır.", "score": (1-3 arası), "feedback": "..." }
      ]
    },
    {
      "title": "2. Öğrenme-öğretme yaşantıları",
      "max_section_score": 60,
      "section_score": (Bu bölümdeki 20 kriterin toplam puanı),
      "criteria": [
        { "id": 9, "text": "Derse başlangıç (Dersin başında öğrencinin dikkatini çekmiştir)", "score": (1-3 arası), "feedback": "..." },
        { "id": 10, "text": "Öğrencilere, dersin kazanımlarını açıklamıştır.", "score": (1-3 arası), "feedback": "..." },
        { "id": 11, "text": "Ön değerlendirme süreci gerçekleştirmiştir.", "score": (1-3 arası), "feedback": "..." },
        { "id": 12, "text": "Mevcut bilgi ile edinilecek bilgi arasında köprü kurmuştur.", "score": (1-3 arası), "feedback": "..." },
        { "id": 13, "text": "Derste ele alınan temel kavramları veya düşünceleri açıklama becerisine sahiptir (Terimleri ve temel noktaları tanımlamış, başlangıç ve sonuç cümlelerini kullanmış, bağlantılar kurmuş, örneklerin sadeliği ve ilgi çekiciliği vb.)", "score": (1-3 arası), "feedback": "..." },
        { "id": 14, "text": "Derste ele alınan temel kavramları veya düşünceleri pekiştirme becerisine sahiptir. (Övgü sözcükleri kullanma, öğrencilerin ifadelerini tekrarlama ve yeniden ifade etme, öğrencilerin cevaplarını tahtaya yazma vb.)", "score": (1-3 arası), "feedback": "..." },
        { "id": 15, "text": "Dersin öğrenme çıktılarını kazandırmak için soru sorma becerisine sahiptir.", "score": (1-3 arası), "feedback": "..." },
        { "id": 16, "text": "Derste uyarıcı çeşitliliği becerisine sahiptir.", "score": (1-3 arası), "feedback": "..." },
        { "id": 17, "text": "Sınıf yönetimi becerisine sahiptir.", "score": (1-3 arası), "feedback": "..." },
        { "id": 18, "text": "Derste konuya ve öğrenci seviyesine uygun basit ve ilgi çekici örnekler verme becerisine sahiptir.", "score": (1-3 arası), "feedback": "..." },
        { "id": 19, "text": "Derste çeşitli öğretim tekniklerini kullanır.", "score": (1-3 arası), "feedback": "..." },
        { "id": 20, "text": "Kazanımlarla tutarlı farklı öğretim materyalleri kullanır.", "score": (1-3 arası), "feedback": "..." },
        { "id": 21, "text": "Yenilenen öğretim teknolojilerini ders sürecine entegre eder.", "score": (1-3 arası), "feedback": "..." },
        { "id": 22, "text": "Ders planında 5E modelinin basamakları eksiksiz olarak yer almaktadır.", "score": (1-3 arası), "feedback": "..." },
        { "id": 23, "text": "Ders planında yer alan dikkat çekme etkinlikleri 5E modeliyle uyumludur.", "score": (1-3 arası), "feedback": "..." },
        { "id": 24, "text": "Ders planında yer alan keşfetme etkinlikleri 5E modeliyle uyumludur.", "score": (1-3 arası), "feedback": "..." },
        { "id": 25, "text": "Ders planında yer alan açıklama etkinlikleri 5E modeliyle uyumludur.", "score": (1-3 arası), "feedback": "..." },
        { "id": 26, "text": "Ders planında yer alan derinleştirme etkinlikleri 5E modeliyle uyumludur.", "score": (1-3 arası), "feedback": "..." },
        { "id": 27, "text": "Ders planında yer alan değerlendirme etkinlikleri 5E modeliyle uyumludur.", "score": (1-3 arası), "feedback": "..." },
        { "id": 28, "text": "Özetleme ve dersi kapanış becerisine sahiptir.", "score": (1-3 arası), "feedback": "..." }
      ]
    },
    {
      "title": "3. Ölçme ve Değerlendirme",
      "max_section_score": 3,
      "section_score": (Bu bölümdeki 1 kriterin puanı),
      "criteria": [
         { "id": 29, "text": "Öğrencilerin yeteneklerine, ihtiyaçlarına ve özel durumlarına göre çeşitlendirilmiş ölçme ve değerlendirme yöntemleri kullanır.", "score": (1-3 arası), "feedback": "..." }
      ]
    },
    {
      "title": "4. Farklılaştırma",
      "max_section_score": 3,
      "section_score": (Bu bölümdeki 1 kriterin puanı),
      "criteria": [
         { "id": 30, "text": "Öğretim sürecini, öğrencilerin bireysel farklılıkları dikkate alınarak farklılaştırma uygulamalarıyla çeşitlendirir.", "score": (1-3 arası), "feedback": "..." }
      ]
    }
  ],
  "qualitative_feedback": {
    "strengths": ["Güçlü yön 1", "Güçlü yön 2"],
    "improvements": ["Geliştirilmesi gereken 1", "Geliştirilmesi gereken 2"],
    "suggestions": ["Öneri 1", "Öneri 2"]
  }
}
`;

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

    // AI'a gönderilecek nihai metin
    const aiPrompt = `${rubricsSystemPrompt}

--- ANALİZ EDİLECEK ÖĞRENCİ DERS PLANI METNİ ---
${extractedText}
--------------------------------------------------
`;

    console.log("Gemini'a istek gönderiliyor...");
    // Gemini API endpoint'i - farklı model ismiyle
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        contents: [{
          parts: [{
            text: aiPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.2, 
          maxOutputTokens: 4096, 
          topP: 0.95,
          topK: 40
        }
      },
      { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000 // 30 saniye timeout
      }
    );
    console.log("Gemini'dan yanıt alındı.");

    let analysisResult = response.data.candidates[0].content.parts[0].text;
    
    // Temizlik işlemleri (Markdown JSON bloklarını kaldırır)
    analysisResult = analysisResult.replace(/```json\n/g, "").replace(/\n```/g, "").trim();
    
    try {
      const parsedResult = JSON.parse(analysisResult);
      console.log("JSON başarıyla ayrıştırıldı.");
      res.json({
        success: true,
        data: parsedResult
      });
    } catch (parseError) {
      console.error("JSON Parse Hatası:", parseError);
      console.log("Hatalı Ham Veri:", analysisResult);
      // Hata durumunda frontend'in çökmemesi için boş bir yapı dönüyoruz
      res.json({
        success: true,
        data: {
          ai_score_90: 0,
          sections: [],
          qualitative_feedback: {
             strengths: ["Analiz hatası nedeniyle veri alınamadı."],
             improvements: ["Lütfen tekrar deneyin veya dosya formatını kontrol edin."],
             suggestions: []
          }
        },
        rawResponse: analysisResult
      });
    }

  } catch (error) {
    console.error('Sunucu Hatası:', error.message);
    // Detaylı hata mesajı
    if (error.response) {
      console.error('Hata Durumu:', error.response.status);
      console.error('Hata Verisi:', error.response.data);
    }
    res.status(500).json({
      error: 'Analiz sırasında sunucu taraflı bir hata oluştu.',
      details: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`Yeni Rubrik Sistemli Server ${PORT} portunda çalışıyor...`);
});