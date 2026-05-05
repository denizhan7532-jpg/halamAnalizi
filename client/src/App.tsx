import { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Dashboard } from './components/Dashboard';

// ============================================================
// YENİ VERİ YAPISI — 50 Kriterlik Microöğretim Rubriği (0-2 puan)
// ============================================================
export interface Criteria {
  id: string;       // "M.1", "M.2", ... "M.50"
  text: string;
  score: number;    // 0 / 0.5 / 1 / 1.5 / 2
  feedback: string;
}

export interface Section {
  title: string;
  max_section_score: number;
  section_score: number;
  criteria: Criteria[];
}

export interface QualitativeFeedback {
  strengths: Record<string, string>;
  improvements: Record<string, string>;
}

export interface AnalysisData {
  ai_score_100: number;
  sections: Section[];
  qualitative_feedback: QualitativeFeedback;
}

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedData = sessionStorage.getItem('analysisData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setAnalysisData(parsedData);
      } catch (err) {
        console.error('SessionStorage parse error:', err);
        sessionStorage.removeItem('analysisData');
      }
    }
  }, []);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://halamanalizi.onrender.com/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as any).error || 'Analiz sunucu hatası.');
      }

      const result = await response.json();
      console.log('API response:', result);

      if (result.success && result.data) {
        setAnalysisData(result.data);
      } else {
        throw new Error(result.error || 'Beklenmeyen bir veri formatı hatası.');
      }
    } catch (err) {
      console.error('Hata Detayı:', err);
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisData(null);
    sessionStorage.removeItem('analysisData');
  };

  return (
    <div
      className="min-h-screen fixed inset-0 w-full h-full overflow-y-hidden"
      style={{
        backgroundImage: 'url(./1.png)',
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="fixed inset-0 bg-gradient-to-br from-dusk-navy/40 via-baltic-blue/30 to-glaucous/40 pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-8 overflow-y-auto h-full md:py-12">
        <header className="text-center mb-8 md:mb-12">
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg"
            style={{ lineHeight: '1.2' }}
          >
            AI Ders Planı Değerlendirme Sistemi
          </h1>
          <p className="text-white/70 mt-2 text-sm md:text-base">
            Ders Değerlendirme Rubriği — 50 Kriter
          </p>
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