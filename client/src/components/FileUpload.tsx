










import { Upload, FileText, AlignLeft } from 'lucide-react';
import { useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
  const [textContent, setTextContent] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File | undefined) => {
    if (file) {
      const isValidType = file.name.endsWith('.docx') || file.type === 'text/plain';
      if (isValidType) {
        onFileSelect(file);
      } else {
        alert('Lütfen sadece .docx veya .txt formatında bir dosya seçin.');
      }
    }
  };

  const handleTextSubmit = () => {
    if (textContent.trim()) {
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const file = new File([blob], 'manuel-giris.txt', { type: 'text/plain' });
      onFileSelect(file);
    } else {
      alert('Lütfen analiz edilecek metni girin.');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Sekme (Tab) Butonları */}


      {/* İçerik Alanı */}
      <div className={`bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-8 border-2 transition-all duration-300 ${dragActive ? 'border-wisteria bg-wisteria/5' : 'border-wisteria/30 hover:border-wisteria/60'}`}>
        
        {/* Dosya Yükleme Sekmesi */}
        {activeTab === 'upload' && (
          <div 
            onDragEnter={handleDrag} 
            onDragLeave={handleDrag} 
            onDragOver={handleDrag} 
            onDrop={handleDrop}
            className="h-full flex flex-col justify-between"
          >
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center cursor-pointer py-12"
            >
              <div className={`p-6 rounded-full mb-6 transition-transform duration-300 ${dragActive ? 'bg-wisteria/20 scale-110' : 'bg-gradient-to-br from-wisteria/10 to-baltic-blue/10'}`}>
                <Upload className={`w-16 h-16 transition-colors duration-300 ${dragActive ? 'text-wisteria' : 'text-wisteria/70'}`} />
              </div>
              <h3 className="text-2xl font-bold text-dusk-navy mb-3">Ders Planını Yükle</h3>
              <p className="text-dusk-dark text-center mb-6 text-lg max-w-md">
                Analiz için <span className="font-semibold"> </span> dosyanızı buraya sürükleyin veya seçin.
              </p>
              <input
                id="file-upload"
                type="file"
                accept=".docx,.txt"
                onChange={handleFileChange}
                disabled={isLoading}
                className="hidden"
              />
              <span className="bg-gradient-to-r from-wisteria to-baltic-blue text-white px-8 py-3 rounded-xl font-bold text-lg shadow-md hover:shadow-lg hover:shadow-wisteria/40 transition-all duration-300">
                {isLoading ? 'Yükleniyor...' : 'Dosya Seç'}
              </span>
            </label>
          </div>
        )}

        {/* Metin Yapıştırma Sekmesi */}
        {activeTab === 'paste' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-wisteria/10 rounded-full">
                    <FileText className="w-6 h-6 text-wisteria" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-dusk-navy">Manuel Giriş</h3>
                    <p className="text-sm text-dusk-dark opacity-80">Ders planı metnini doğrudan aşağıya yapıştırın.</p>
                </div>
            </div>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Örn: Dersin Adı: Matematik, Sınıf: 5/A, Kazanımlar: ... (Metni buraya yapıştırın)"
              className="w-full h-64 p-4 border-2 border-wisteria/30 rounded-xl mb-6 resize-none focus:outline-none focus:ring-2 focus:ring-wisteria/50 focus:border-wisteria transition-all text-dusk-navy placeholder-gray-400 bg-white/50"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleTextSubmit}
              disabled={isLoading || !textContent.trim()}
              className="w-full bg-gradient-to-r from-wisteria to-baltic-blue text-white px-6 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 Analiz Başlatılıyor...
                </>
              ) : (
                <>
                  <AlignLeft className="w-5 h-5" /> Analizi Başlat
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}