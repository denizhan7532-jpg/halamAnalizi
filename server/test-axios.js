import axios from 'axios';

const API_KEY = 'AIzaSyDdFRjK1u5ynOigjDdgZF5GOLRtlVvu-EE';
const MODEL = 'gemini-2.0-flash';

const testPrompt = `Sen uzman bir eğitimci ve pedagogsun. Sana verilen ders programı metnini analiz et. Çıktıyı SADECE geçerli bir JSON formatında ver. JSON şeması:
{
  "score": (0-100 arası sayı),
  "summary": "Kısa değerlendirme",
  "details": {
    "distribution": "Ders dağılımı analizi",
    "gaps": "Tespit edilen eksiklikler",
    "pedagogy": "Pedagojik değerlendirme"
  },
  "improvements": ["Öneri 1", "Öneri 2", "Öneri 3"]
}

DERS PROGRAMI METNİ:
Ders Adı: Matematik
Sınıf: 9-A
Ünite 1: Sayılar ve Cebir
Konular: Tam sayılar, rasyonel sayılar, üslü ifadeler
Haftalık Ders Saati: 5 saat

Ünite 2: Geometri
Konular: Üçgenler, dörtgenler, çember
Haftalık Ders Saati: 4 saat

Ünite 3: Veri ve Olasılık
Konular: Tablo ve grafikler, olasılık
Haftalık Ders Saati: 3 saat`;

async function testGemini() {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        contents: [{
          parts: [{
            text: testPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
          topP: 0.9,
          topK: 40
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testGemini();