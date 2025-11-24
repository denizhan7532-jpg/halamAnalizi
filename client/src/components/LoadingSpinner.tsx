import { Loader2 } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div className="w-full max-w-xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-12">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="w-16 h-16 text-wisteria animate-spin mb-4" />
        <h3 className="text-xl font-semibold text-dusk-navy mb-2">
          Analiz Ediliyor
        </h3>
        <p className="text-dusk-dark text-center">
          AI ders programınızı değerlendiriyor...
        </p>
      </div>
    </div>
  );
}
