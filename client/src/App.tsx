import { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Dashboard } from './components/Dashboard';

// YENİ VERİ YAPISI INTERFACE'İ
export interface Criteria {
  id: number;
  text: string;
  score: number;
  feedback: string;
}

export interface Section {
  title: string;
  max_section_score: number;
  section_score: number;
  criteria: Criteria[];
}

export interface AnalysisData {
  ai_score_90: number;
  sections: Section[];
  qualitative_feedback: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  };
}

function App() {
  const [isLoading, setIsLoading] = useState(false);
  // State'in tipini yeni interface'e göre belirttik
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);
  // showTestPage state'ini kaldırdım, gerekirse geri ekleyebilirsin.

  useEffect(() => {
    const savedData = sessionStorage.getItem('analysisData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('Saved data structure:', parsedData);
        setAnalysisData(parsedData);
      } catch (err) {
        console.error('SessionStorage parse error:', err);
        sessionStorage.removeItem('analysisData'); // Hatalı veriyi temizle
      }
    }
  }, []);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Backend portu simple-server.js'de 3001 olarak ayarlı.
      // Eğer vite proxy ayarın yoksa tam URL girmen gerekebilir: http://localhost:3001/api/analyze
      const response = await fetch('https://halamanalizi.onrender.com/api/analyze', {  
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Analiz sunucu hatası.');
      }

      const result = await response.json();
      console.log('API response:', result);

      if (result.success && result.data) {
        // Veriyi sadece state'e atıyoruz, kaydetmiyoruz.
        setAnalysisData(result.data);
        // --- sessionStorage YAZMA KISMI KALDIRILDI ---
      } else {
        throw new Error(result.error || 'Beklenmeyen bir veri formatı hatası.');
      }
    } catch (err) {
      console.error("Hata Detayı:", err);
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisData(null);
    // --- sessionStorage SİLME KISMI KALDIRILDI ---
  };

  return (
    <div className="min-h-screen fixed inset-0 w-full h-full overflow-y-hidden" style={{ backgroundImage: 'url(./1.png)', backgroundAttachment: 'fixed', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="fixed inset-0 bg-gradient-to-br from-dusk-navy/40 via-baltic-blue/30 to-glaucous/40 pointer-events-none"></div>

      <div className="relative z-10 container mx-auto px-4 py-8 overflow-y-auto h-full md:py-12">
        <header className="text-center mb-8 md:mb-12">
            {/* ... Başlık kısımları aynı kalabilir ... */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg" style={{ lineHeight: '1.2' }}>
              AI Ders Planı Değerlendirme Sistemi
            </h1>
          
        </header>

        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-6 bg-red-500/90 backdrop-blur-sm border-2 border-red-300 rounded-xl p-4 text-center shadow-lg">
              <p className="text-white font-medium flex items-center justify-center gap-2">
                ⚠️ {error}
              </p>
            </div>
          )}

          {isLoading ? (
            <LoadingSpinner />
          ) : analysisData ? (
            // Dashboard bileşenine yeni veri yapısını gönderiyoruz
            <Dashboard data={analysisData} onReset={handleReset} />
          ) : (
            <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
