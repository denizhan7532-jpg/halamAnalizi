import { useState } from 'react';

const TestGemini = () => {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const testGemini = async () => {
    setLoading(true);
    setResponse('');
    
    try {
      // Create a simple text file with curriculum content for testing
      const curriculumContent = `
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
Haftalık Ders Saati: 3 saat
      `.trim();
      
      const blob = new Blob([curriculumContent], { type: 'text/plain' });
      const file = new File([blob], 'test.txt', { type: 'text/plain' });
      
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      }
      
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gemini AI Test</h1>
      
      <div className="mb-6">
        <button
          className="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          onClick={testGemini}
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Gemini AI'}
        </button>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-3">Response:</h2>
        <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap max-h-96 overflow-y-auto">
          {response || 'No response yet. Click "Test Gemini AI" to send a request.'}
        </pre>
      </div>
    </div>
  );
};

export default TestGemini;