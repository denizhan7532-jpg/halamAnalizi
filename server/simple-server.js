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
  process.exit(1);
}

// Model sürümü
const MODEL = "gemini-2.0-flash";

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'text/plain'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Sadece .docx veya .txt dosyaları desteklenmektedir.'));
    }
  }
});

// ============================================================
// 50 KRİTERLİK MİCROÖĞRETİM DERS DEĞERLENDİRME RUBRİĞİ
// Puanlama: 0 / 0.5 / 1 / 1.5 / 2  —  Maksimum toplam: 100
// ============================================================
const rubricsSystemPrompt = `
Sen uzman bir pedagog ve öğretmen eğitmenisin. Görevin, verilen ders planı ve öğretmen gözlem metnini, aşağıdaki 50 kriterlik Ders Değerlendirme Rubriğine göre titizlikle puanlamak ve gerçekçi geri bildirim vermektir.

**ÖNEMLİ — VERİ KAYNAKLARI:**
Sana verilen metin iki farklı bilgi kaynağı içerebilir:
1. **Teorik Ders Planı:** BÖLÜM I (Derse hazırlık ve öğretimi planlama), BÖLÜM II (5E modeli adımları: Dikkat Çekme, Keşfetme, Açıklama, Derinleştirme, Değerlendirme), BÖLÜM III (Ölçme ve Değerlendirme), BÖLÜM IV (Özetleme ve Kapanış).
2. **Öğretmen Sınıf Gözlemleri:** Ö1, Ö2, Ö3 ... Ö27 (vb.) etiketleriyle başlayan paragraflar — bunlar farklı öğretmenlerin gerçek sınıf içi uygulamalarını ve gözlemlerini yansıtır. Her Ö etiketi farklı bir öğretmeni temsil eder. Öğretmen sayısı metne göre değişiklik gösterebilir, belli bir sınır yoktur (Ö5, Ö10, Ö27 olabilir).

Her kriteri puanlarken **her iki kaynağı birlikte** değerlendir. Öğretmen gözlemleri (Ö1, Ö2, Ö3, ..., vb.), teorik plandaki bilgileri somut kanıtlarla destekler ya da çelişir; bu nedenle puanlama için kritik öneme sahiptir.

**ÇOK ÖNEMLİ DEĞERLENDİRME İNİSİYATİFİ (15 DAKİKALIK DERS KURALI):**
Lütfen puanlama yaparken bu derslerin standart 40 dakikalık dersler değil, sadece **15 dakikalık kısa "mikroöğretim" dersleri** olduğunu kesinlikle unutma. Bu dar zaman diliminde her şeyin mükemmel olması beklenemez. Değerlendirmelerinde **oldukça esnek, anlayışlı ve hoşgörülü ol.** Öğretmen adayı 15 dakikalık bir derste yapabileceğinin temel düzeyini bile gösterdiyse o kritere yüksek puan ver (1.5 veya 2). Ufak eksiklikler yüzünden puan kırma, katı ve insafsız değerlendirmelerden kesinlikle kaçın. Öğretmenin emeğini ve kısa süreyi göz önünde bulundurarak notları bol ver. **ANCAK DİKKAT:** Yazdığın geri bildirim (feedback) veya öneri metinlerinde asla "15 dakikalık kısa süre olduğu için", "kısa sürede" gibi ifadelere yer verme. Puanını yüksek ver, fakat geri bildirimini sanki normal bir değerlendirmeymiş gibi profesyonelce yaz.

**PUANLAMA ÖLÇEĞİ (Her kriter için):**
- 0: Yetersiz — Hiç yapılmamış veya tamamen eksik
- 0.5: Kabul Edilebilir — Çok zayıf, yüzeysel
- 1: Orta — Kısmen yapılmış, geliştirilmeli
- 1.5: İyi — Büyük ölçüde başarılı, küçük eksikler var
- 2: Çok İyi — Tam ve başarılı şekilde yapılmış

**GÖREVLERİN:**
1. Her kriter için metni analiz et ve 0, 0.5, 1, 1.5 veya 2 puanlarından birini ver.
2. Verdiğin puan için kısa, yapıcı bir gerekçe (feedback) yaz. Hem plan içeriğine hem öğretmen gözlemlerine atıfta bulun.
3. Her bölümün kendi içindeki toplam puanını hesapla.
4. Tüm kriterlerin toplam puanını 'ai_score_100' alanına yaz (Maksimum 100).
5. Metinde yer alan tüm Ö etiketli öğretmenler (Ö1, Ö2, Ö3 ... Ö27 vb. kaç tane varsa) için ayrı ayrı güçlü yönler ve geliştirilmesi gereken alanlar belirt.

**ÇIKTI FORMATI:**
SADECE aşağıdaki JSON şemasına uygun, geçerli bir JSON nesnesi döndür. Başka hiçbir metin veya markdown formatı kullanma.

{
  "ai_score_100": (0-100 arası ondalıklı sayı),
  "sections": [
    {
      "title": "Ders Planlama Becerisi",
      "max_section_score": 26,
      "section_score": (M.1-M.13 toplamı),
      "criteria": [
        { "id": "M.1",  "text": "Mikro dersi için öğretim programındaki kazanımları temel almıştır.", "score": 0, "feedback": "..." },
        { "id": "M.2",  "text": "Ders planı incelendiğinde anlatılan konu ile ilgili temel ilke, kavram ve terminoloji bilgisine sahip olduğu görülmektedir.", "score": 0, "feedback": "..." },
        { "id": "M.3",  "text": "Ders planını, ders planının adımlarına göre düzenli ve sistematik bir şekilde hazırlamıştır.", "score": 0, "feedback": "..." },
        { "id": "M.4",  "text": "Ders planında kazanımlar, öğretim faaliyetleri ve değerlendirme birbirleriyle uyumludur.", "score": 0, "feedback": "..." },
        { "id": "M.5",  "text": "Ders planında belirttiği öğrenme kuramına uygun ders planı hazırlamıştır.", "score": 0, "feedback": "..." },
        { "id": "M.6",  "text": "Ders planında belirttiği öğrenme stratejisine uygun ders planı hazırlamıştır.", "score": 0, "feedback": "..." },
        { "id": "M.7",  "text": "Ders planında belirttiği öğretim yöntemine uygun ders planı hazırlamıştır.", "score": 0, "feedback": "..." },
        { "id": "M.8",  "text": "Ders planında belirttiği öğretim tekniğine uygun ders planı hazırlamıştır.", "score": 0, "feedback": "..." },
        { "id": "M.9",  "text": "Ders planında yer alan dikkat çekme etkinlikleri 5E modeliyle uyumludur.", "score": 0, "feedback": "..." },
        { "id": "M.10", "text": "Ders planında yer alan keşfetme etkinlikleri 5E modeliyle uyumludur.", "score": 0, "feedback": "..." },
        { "id": "M.11", "text": "Ders planında yer alan açıklama etkinlikleri 5E modeliyle uyumludur.", "score": 0, "feedback": "..." },
        { "id": "M.12", "text": "Ders planında yer alan derinleştirme etkinlikleri 5E modeliyle uyumludur.", "score": 0, "feedback": "..." },
        { "id": "M.13", "text": "Ders planında yer alan değerlendirme etkinlikleri 5E modeliyle uyumludur.", "score": 0, "feedback": "..." }
      ]
    },
    {
      "title": "Ders Açılışı Becerisi",
      "max_section_score": 6,
      "section_score": (M.14-M.16 toplamı),
      "criteria": [
        { "id": "M.14", "text": "Dersin başında öğrencinin dikkatini çekmiştir (ilgi çekici, güncel bir senaryo, soru veya dijital araç vb.).", "score": 0, "feedback": "..." },
        { "id": "M.15", "text": "Öğretmen 'bu konuyu neden öğreniyoruz?' sorusunun cevabını dersin başında açıkça yanıtlamıştır.", "score": 0, "feedback": "..." },
        { "id": "M.16", "text": "Ön değerlendirme yapmıştır.", "score": 0, "feedback": "..." }
      ]
    },
    {
      "title": "Açıklama Becerisi",
      "max_section_score": 10,
      "section_score": (M.17-M.21 toplamı),
      "criteria": [
        { "id": "M.17", "text": "Derste ele alınan temel kavramları veya düşünceleri anlaşılır bir şekilde sunmuştur.", "score": 0, "feedback": "..." },
        { "id": "M.18", "text": "Öğrencilerin sorduğu sorulara ayrıntılı ve anlaşılır bir şekilde açıklamıştır.", "score": 0, "feedback": "..." },
        { "id": "M.19", "text": "Karmaşık kavramları parçalara ayırarak mantıksal bir sıra ile açıklamıştır.", "score": 0, "feedback": "..." },
        { "id": "M.20", "text": "Karmaşık kavramları analojiler, kavram haritaları veya farklı temsil biçimleri kullanarak (grafikler, şemalar) açıklamıştır.", "score": 0, "feedback": "..." },
        { "id": "M.21", "text": "Açıklamalarını ön bilgilerle (geçmiş derslerle) ve disiplinler arası bağlantılarla sürekli ilişkilendirmiştir.", "score": 0, "feedback": "..." }
      ]
    },
    {
      "title": "Pekiştirme Becerisi",
      "max_section_score": 2,
      "section_score": (M.22 puanı),
      "criteria": [
        { "id": "M.22", "text": "Öğrencinin yanıtından sonra 'iyi', 'güzel', 'mükemmel', 'doğru' vb. kelimeler kullanmış veya doğru cevabı tahtaya yazmıştır.", "score": 0, "feedback": "..." }
      ]
    },
    {
      "title": "Soru Sorma ve Sordurma Becerisi",
      "max_section_score": 12,
      "section_score": (M.23-M.28 toplamı),
      "criteria": [
        { "id": "M.23", "text": "Dersin öğrenme çıktılarını kazandırmak için doğru sorular sormuştur.", "score": 0, "feedback": "..." },
        { "id": "M.24", "text": "Öğrencileri soru sormak için teşvik edip, fırsat vermiştir.", "score": 0, "feedback": "..." },
        { "id": "M.25", "text": "Başka öğrencilerin sorularına geçmeden o öğrencinin sorduğu sorunun cevabını doğru anladığından emin olmuştur.", "score": 0, "feedback": "..." },
        { "id": "M.26", "text": "Üst düzey tartışmayı (analiz, değerlendirme, yaratma) teşvik eden sorular sormuştur.", "score": 0, "feedback": "..." },
        { "id": "M.27", "text": "Soruyu sorduktan sonra öğrencilere düşünmeleri için yeterli (en az 3-5 saniye) süre tanımıştır.", "score": 0, "feedback": "..." },
        { "id": "M.28", "text": "Öğrenci doğru cevap verdiğinde bile 'Neden?', 'Nasıl?' gibi sorularla cevabı derinleştirmiştir.", "score": 0, "feedback": "..." }
      ]
    },
    {
      "title": "Uyarıcı Çeşitliliği Becerisi",
      "max_section_score": 8,
      "section_score": (M.29-M.32 toplamı),
      "criteria": [
        { "id": "M.29", "text": "Farklı öğretim materyalleri (görsel-işitsel-dijital araç) kullanmıştır.", "score": 0, "feedback": "..." },
        { "id": "M.30", "text": "'Bu noktaya özellikle dikkat edin' vb. uyarılarda bulunmuştur.", "score": 0, "feedback": "..." },
        { "id": "M.31", "text": "Yenilenen öğretim teknolojilerini ders sürecine entegre etmiştir.", "score": 0, "feedback": "..." },
        { "id": "M.32", "text": "Farklılaştırma etkinliklerine yer verilmiştir.", "score": 0, "feedback": "..." }
      ]
    },
    {
      "title": "Sınıf Yönetimi Becerisi",
      "max_section_score": 14,
      "section_score": (M.33-M.39 toplamı),
      "criteria": [
        { "id": "M.33", "text": "Öğrencilere ismiyle hitap etmiştir.", "score": 0, "feedback": "..." },
        { "id": "M.34", "text": "Sınıf ortamındaki uygunsuz davranışları kontrol altına almıştır.", "score": 0, "feedback": "..." },
        { "id": "M.35", "text": "Dersi planladığı süre içerisinde tamamlamıştır.", "score": 0, "feedback": "..." },
        { "id": "M.36", "text": "Sınıfta işbirliğini teşvik eden bir öğrenme iklimi oluşturmuştur.", "score": 0, "feedback": "..." },
        { "id": "M.37", "text": "Sınıfta olumlu ve dostane bir atmosfer yaratmıştır.", "score": 0, "feedback": "..." },
        { "id": "M.38", "text": "Sınıf, öğrenciler ve konu üzerinde tam bir kontrole sahip olup özgüvenlidir.", "score": 0, "feedback": "..." },
        { "id": "M.39", "text": "Sınıfta her zaman coşkulu ve heyecanlıdır.", "score": 0, "feedback": "..." }
      ]
    },
    {
      "title": "Örnek Verme Becerisi",
      "max_section_score": 12,
      "section_score": (M.40-M.45 toplamı),
      "criteria": [
        { "id": "M.40", "text": "Derste konuya ve öğrenci seviyesine uygun basit ve ilgi çekici örnekler verme becerisine sahiptir.", "score": 0, "feedback": "..." },
        { "id": "M.41", "text": "Açıklamalarına basit örneklerle başlayıp uygunsa daha karmaşık örneklerle devam etmiştir.", "score": 0, "feedback": "..." },
        { "id": "M.42", "text": "Öğrencilerin geçmiş bilgi ve deneyimleriyle ilgili örnekler kullanmıştır.", "score": 0, "feedback": "..." },
        { "id": "M.43", "text": "Örnekleri dersin ana fikirleri veya noktalarıyla doğrudan ilişkilendirmiştir.", "score": 0, "feedback": "..." },
        { "id": "M.44", "text": "Öğrencilerden gelen farklı sorulara veya gösterdikleri kafa karışıklığına anında farklı bir örnekle esnek bir şekilde yanıt vermiştir.", "score": 0, "feedback": "..." },
        { "id": "M.45", "text": "Öğrencilerin kendi deneyimlerinden veya çevrelerinden örnekler sunmalarını istemiştir.", "score": 0, "feedback": "..." }
      ]
    },
    {
      "title": "Ders Kapanış Becerisi",
      "max_section_score": 10,
      "section_score": (M.46-M.50 toplamı),
      "criteria": [
        { "id": "M.46", "text": "Kullanılan ölçme araçları dersin kazanımlarının gerektirdiği düzeyi tutarlı ve geçerli bir şekilde ölçmüştür.", "score": 0, "feedback": "..." },
        { "id": "M.47", "text": "Öğrencilerin yeteneklerine, ihtiyaçlarına ve özel durumlarına göre çeşitlendirilmiş ölçme ve değerlendirme yöntemleri kullanmıştır.", "score": 0, "feedback": "..." },
        { "id": "M.48", "text": "Değerlendirme yöntemi öğretim yöntem ve teknikleriyle uyumludur.", "score": 0, "feedback": "..." },
        { "id": "M.49", "text": "Kullandığı ölçme araçları (soru/madde kökleri) açık, net ve hatasız hazırlanmıştır.", "score": 0, "feedback": "..." },
        { "id": "M.50", "text": "Dersin sonunda kendi ya da öğrenciye özetleme yaptırmıştır.", "score": 0, "feedback": "..." }
      ]
    }
  ],
  "qualitative_feedback": {
    "strengths": {
      "Ö1": "Ö1 öğretmeninin gözlemlenen güçlü yönü (somut örnek ver)",
      "Ö2": "Ö2 öğretmeninin gözlemlenen güçlü yönü (somut örnek ver)",
      "Ö3": "Ö3 öğretmeninin gözlemlenen güçlü yönü (somut örnek ver)",
      "...": "Metinde kaç tane öğretmen varsa (Ö5, Ö27 vb.) hepsi için buraya eklemeye devam et"
    },
    "improvements": {
      "Ö1": "Ö1 öğretmeni için geliştirilmesi gereken alan (somut öneri)",
      "Ö2": "Ö2 öğretmeni için geliştirilmesi gereken alan (somut öneri)",
      "Ö3": "Ö3 öğretmeni için geliştirilmesi gereken alan (somut öneri)",
      "...": "Metindeki tüm öğretmenler için buraya eklemeye devam et"
    }
  }
}

ÖNEMLİ HATIRLATMA: Sadece geçerli JSON döndür. score alanları için yalnızca 0, 0.5, 1, 1.5 veya 2 değerlerini kullan. Başka değer kullanma.
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

    const aiPrompt = `${rubricsSystemPrompt}

--- ANALİZ EDİLECEK DERS PLANI VE ÖĞRETMEN GÖZLEMLERİ ---
${extractedText}
-----------------------------------------------------------
`;

    console.log("Gemini'a istek gönderiliyor (50 kriterlik Ders Değerlendirme rubriği)...");
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        contents: [{ parts: [{ text: aiPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          topP: 0.95,
          topK: 40
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
      }
    );
    console.log("Gemini'dan yanıt alındı.");

    let analysisResult = response.data.candidates[0].content.parts[0].text;
    analysisResult = analysisResult.replace(/```json\n?/g, '').replace(/\n?```/g, '').trim();

    try {
      const parsedResult = JSON.parse(analysisResult);
      console.log("JSON başarıyla ayrıştırıldı. Toplam puan:", parsedResult.ai_score_100);
      res.json({ success: true, data: parsedResult });
    } catch (parseError) {
      console.error("JSON Parse Hatası:", parseError);
      console.log("Hatalı Ham Veri:", analysisResult.substring(0, 500));
      res.json({
        success: true,
        data: {
          ai_score_100: 0,
          sections: [],
          qualitative_feedback: {
            strengths: {},
            improvements: {}
          }
        },
        rawResponse: analysisResult
      });
    }

  } catch (error) {
    console.error('Sunucu Hatası:', error.message);
    if (error.response) {
      console.error('Hata Durumu:', error.response.status);
      console.error('Hata Verisi:', JSON.stringify(error.response.data).substring(0, 300));
    }
    res.status(500).json({
      error: 'Analiz sırasında sunucu taraflı bir hata oluştu.',
      details: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', rubric: '50-criteria v2.0', maxScore: 100 });
});

app.listen(PORT, () => {
  console.log(`50 Kriterlik Ders Değerlendirme Rubrik Sunucusu ${PORT} portunda çalışıyor...`);
});