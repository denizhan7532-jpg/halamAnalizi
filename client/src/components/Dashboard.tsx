import { useState } from 'react';
import { 
  Download, 
  TrendingUp, 
  Lightbulb, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  MessageSquare, 
  Plus, 
  Minus,
  Brain,       // AI ikonu için
  UserCheck,   // Öğretmen ikonu için
  Calculator   // Hesaplama/Toplam ikonu için
} from 'lucide-react';
// docx kütüphanesinden gerekli parçaları import ediyoruz
import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, HeadingLevel, BorderStyle, AlignmentType } from "docx";
// App.tsx'ten gelen tipler
import type { AnalysisData } from '../App';

interface DashboardProps {
  data: AnalysisData;
  onReset: () => void;
}

export function Dashboard({ data, onReset }: DashboardProps) {
  const [teacherScore, setTeacherScore] = useState(0);
  const [expandedSections, setExpandedSections] = useState([] as number[]);

  // Veri güvenliği
  const safeData = {
    ai_score_90: data?.ai_score_90 || 0,
    sections: data?.sections || [],
    qualitative_feedback: {
      strengths: data?.qualitative_feedback?.strengths || [],
      improvements: data?.qualitative_feedback?.improvements || [],
      suggestions: data?.qualitative_feedback?.suggestions || []
    }
  };

  // --- HESAPLAMALAR ---
  const aiScore = safeData.ai_score_90; // 90 üzerinden
  // Toplam puanı 100'ü geçmeyecek şekilde hesapla
  const totalScore = Math.min(100, Number((aiScore + teacherScore).toFixed(1)));

  // --- PUAN ARTIRMA/AZALTMA ---
  const incrementScore = () => {
    setTeacherScore(prev => Math.min(10, prev + 0.5)); 
  };

  const decrementScore = () => {
    setTeacherScore(prev => Math.max(0, prev - 0.5));
  };

  const toggleSection = (index: number) => {
    setExpandedSections(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  // Renk belirleme (Toplam puan için)
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-700 bg-green-50 border-green-200';
    if (score >= 65) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  // Word dökümanı için renk kodu
  const getWordColorHex = (score: number) => {
    if (score >= 2.5) return "166534";
    if (score >= 1.5) return "854d0e";
    return "991b1b";
  };

  // --- WORD DÖKÜMANI OLUŞTURMA ---
  const generateWordDocument = async () => {
    const tableBorderStyle = { style: BorderStyle.SINGLE, size: 1, color: "bfbfbf" };

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({ text: "DERS PLANI ANALİZ RAPORU", heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
                
                // --- Puan Özeti Bölümü (Word) ---
                new Paragraph({ text: "GENEL DEĞERLENDİRME VE PUANLAMA", heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }),
                
                // AI Puanı Satırı
                new Paragraph({
                    children: [
                        new TextRun({ text: "• Yapay Zeka (AI) Değerlendirmesi: ", bold: true }),
                        new TextRun({ text: `${aiScore.toFixed(1)} / 90` })
                    ]
                }),
                // Öğretmen Puanı Satırı
                new Paragraph({
                    children: [
                        new TextRun({ text: "• Öğretmen Kanaat Notu: ", bold: true }),
                        new TextRun({ text: `${teacherScore} / 10` })
                    ]
                }),
                // Toplam Puan (Vurgulu)
                new Paragraph({
                    children: [
                        new TextRun({ text: "TOPLAM BAŞARI PUANI: ", bold: true, size: 28 }),
                        new TextRun({ text: `${totalScore.toString()}/100`, bold: true, size: 36, color: totalScore >= 85 ? "166534" : totalScore >= 65 ? "854d0e" : "991b1b" }),
                    ],
                    spacing: { before: 200, after: 300 },
                    alignment: AlignmentType.CENTER
                }),
                // --------------------------------

                new Paragraph({ text: "DETAYLI AI ANALİZİ", heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 } }),
                ...safeData.sections.flatMap(section => [
                    new Paragraph({ children: [new TextRun({ text: `${section.title.toUpperCase()} (Puan: ${section.section_score.toFixed(1)} / ${section.max_section_score})`, bold: true, color: "1e3a8a" })], heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: { top: tableBorderStyle, bottom: tableBorderStyle, left: tableBorderStyle, right: tableBorderStyle, insideHorizontal: tableBorderStyle, insideVertical: tableBorderStyle },
                        rows: [
                            new TableRow({ tableHeader: true, children: [ new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Kriter", bold: true })] })], width: { size: 60, type: WidthType.PERCENTAGE }, shading: { fill: "f3f4f6" } }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Puan (1-3)", bold: true })], alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE }, shading: { fill: "f3f4f6" } }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "AI Gerekçesi", bold: true })] })], width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: "f3f4f6" } }) ] }),
                            ...section.criteria.map(criteria => new TableRow({ children: [ new TableCell({ children: [new Paragraph({ text: criteria.text })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: criteria.score.toString(), bold: true, color: getWordColorHex(criteria.score) })], alignment: AlignmentType.CENTER })], verticalAlign: AlignmentType.CENTER }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: criteria.feedback, italics: true })] })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }) ] }))
                        ],
                    }),
                    new Paragraph({ text: "", spacing: { after: 200 } })
                ]),
                new Paragraph({ text: "NİTELİKSEL GERİ BİLDİRİM", heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 }, pageBreakBefore: true }),
                new Paragraph({ children: [new TextRun({ text: "GÜÇLÜ YÖNLER", bold: true, color: "166534" })], heading: HeadingLevel.HEADING_3 }),
                ...safeData.qualitative_feedback.strengths.map(item => new Paragraph({ text: `• ${item}` })),
                safeData.qualitative_feedback.strengths.length === 0 ? new Paragraph({ children: [new TextRun({ text: "Belirtilmemiş.", italics: true })] }) : new Paragraph({}),
                new Paragraph({ children: [new TextRun({ text: "GELİŞTİRİLMESİ GEREKEN ALANLAR", bold: true, color: "991b1b" })], heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
                ...safeData.qualitative_feedback.improvements.map(item => new Paragraph({ text: `• ${item}` })),
                safeData.qualitative_feedback.improvements.length === 0 ? new Paragraph({ children: [new TextRun({ text: "Belirtilmemiş.", italics: true })] }) : new Paragraph({}),
                 new Paragraph({ children: [new TextRun({ text: "ÖNERİLER", bold: true, color: "1e40af" })], heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }),
                 ...safeData.qualitative_feedback.suggestions.map(item => new Paragraph({ text: `• ${item}` })),
                 safeData.qualitative_feedback.suggestions.length === 0 ? new Paragraph({ children: [new TextRun({ text: "Belirtilmemiş.", italics: true })] }) : new Paragraph({}),
            ],
        }],
    });

    Packer.toBlob(doc).then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Ders_Plani_Analiz_Raporu_${new Date().toISOString().slice(0,10)}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* Üst Panel: Başlık ve Butonlar */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
           <FileText className="w-6 h-6 text-blue-600" /> Analiz Sonuçları
        </h2>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={generateWordDocument}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            <Download className="w-4 h-4" /> Raporu İndir
          </button>
          <button
            onClick={onReset}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300"
          >
            <TrendingUp className="w-4 h-4" /> Yeni Analiz
          </button>
        </div>
      </div>

      {/* --- YENİ PUANLAMA SİSTEMİ (3'LÜ KART YAPISI) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KART 1: AI PUANI (SABİT) */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100 shadow-md flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Brain className="w-24 h-24 text-blue-600" />
            </div>
            <div className="bg-white p-3 rounded-full shadow-sm mb-3 z-10">
                <Brain className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-blue-900 font-semibold mb-1 z-10">Yapay Zeka Puanı</h3>
            <div className="text-4xl font-black text-blue-700 z-10">
                {aiScore.toFixed(1)} <span className="text-xl text-blue-400 font-medium">/90</span>
            </div>
            <p className="text-xs text-blue-600/70 mt-2 z-10">Otomatik hesaplanan teknik puan</p>
        </div>

        {/* KART 2: ÖĞRETMEN PUANI (ETKİLEŞİMLİ) */}
        <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-2xl p-6 border-2 border-purple-100 shadow-md flex flex-col items-center justify-center text-center relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <UserCheck className="w-24 h-24 text-purple-600" />
            </div>
            <div className="bg-white p-3 rounded-full shadow-sm mb-3 z-10">
                <UserCheck className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-purple-900 font-semibold mb-2 z-10">Öğretmen Kanaati</h3>
            
            {/* Stepper Kontrolü */}
            <div className="flex items-center gap-4 z-10 bg-white/60 rounded-xl p-1 border border-purple-200">
                <button 
                    onClick={decrementScore} disabled={teacherScore <= 0}
                    className="w-10 h-10 flex items-center justify-center bg-white hover:bg-purple-100 text-purple-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                    <Minus className="w-5 h-5" />
                </button>
                <div className="text-3xl font-black text-purple-700 w-16">
                    {teacherScore}
                </div>
                <button 
                    onClick={incrementScore} disabled={teacherScore >= 10}
                    className="w-10 h-10 flex items-center justify-center bg-white hover:bg-purple-100 text-purple-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
            <p className="text-xs text-purple-600/70 mt-2 z-10">Maksimum 10 puan ekleyebilirsiniz</p>
        </div>

        {/* KART 3: TOPLAM PUAN (SONUÇ) */}
        <div className={`rounded-2xl p-6 border-2 shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-500 ${getScoreColor(totalScore)}`}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Calculator className="w-24 h-24" />
            </div>
            <div className="bg-white/80 p-3 rounded-full shadow-sm mb-3 z-10">
                <Star className="w-8 h-8 fill-current" />
            </div>
            <h3 className="font-bold uppercase tracking-wider opacity-80 mb-1 z-10">Toplam Başarı Puanı</h3>
            <div className="text-6xl font-black tracking-tight z-10">
                {totalScore} <span className="text-2xl opacity-60 font-bold">/100</span>
            </div>
            <p className="text-sm font-medium mt-2 px-3 py-1 bg-white/50 rounded-full z-10">
                {totalScore >= 85 ? "Mükemmel" : totalScore >= 65 ? "İyi / Geliştirilebilir" : "Düşük / Kritik"}
            </p>
        </div>
      </div>
      {/* -------------------------------------------------- */}

      {/* Detaylı Rubrik Analizi (Akordeon) */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-700 ml-1">Bölüm Bazlı Detaylı Analiz</h3>
        {safeData.sections.map((section, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleSection(index)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg ${section.section_score / section.max_section_score > 0.8 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {section.section_score.toFixed(0)}
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-800">{section.title}</h4>
                    <p className="text-xs text-gray-500">Maksimum Puan: {section.max_section_score}</p>
                  </div>
              </div>
              {expandedSections.includes(index) ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            
            {expandedSections.includes(index) && (
              <div className="p-4 overflow-x-auto border-t border-gray-100">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-3">Kriter</th>
                      <th className="px-4 py-3 text-center">Puan</th>
                      <th className="px-4 py-3">AI Gerekçesi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.criteria.map((item) => (
                      <tr key={item.id} className="bg-white border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-4 font-medium text-gray-800 w-1/3">{item.text}</td>
                        <td className="px-4 py-4 text-center align-middle">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${item.score >= 2.5 ? 'bg-green-100 text-green-800' : item.score >= 1.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {item.score}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-600 italic">
                            <div className="flex gap-2">
                                <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" /> 
                                {item.feedback}
                            </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Niteliksel Geri Bildirim Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Güçlü Yönler */}
        <div className="bg-green-50/50 rounded-xl p-6 border border-green-200 shadow-sm">
          <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Güçlü Yönler
          </h3>
          <ul className="space-y-3">
            {safeData.qualitative_feedback.strengths.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-green-900 bg-white/60 p-2 rounded-lg">
                <span className="text-green-600 font-bold">✓</span> {item}
              </li>
            ))}
            {safeData.qualitative_feedback.strengths.length === 0 && <li className="text-gray-500 italic">Belirtilmemiş.</li>}
          </ul>
        </div>

        {/* Geliştirilmesi Gerekenler ve Öneriler */}
        <div className="space-y-6">
            <div className="bg-red-50/50 rounded-xl p-6 border border-red-200 shadow-sm">
                <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" /> Geliştirilmesi Gerekenler
                </h3>
                <ul className="space-y-3">
                    {safeData.qualitative_feedback.improvements.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-red-900 bg-white/60 p-2 rounded-lg">
                        <span className="text-red-500 font-bold">!</span> {item}
                    </li>
                    ))}
                    {safeData.qualitative_feedback.improvements.length === 0 && <li className="text-gray-500 italic">Belirtilmemiş.</li>}
                </ul>
            </div>

            <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-200 shadow-sm">
                <h4 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <Brain className="w-5 h-5" /> Pedagojik Öneriler
                </h4>
                <ul className="space-y-2 text-sm pl-4 list-disc marker:text-blue-500">
                    {safeData.qualitative_feedback.suggestions.map((item, i) => (
                        <li key={i} className="text-blue-900/80 pl-1">{item}</li>
                    ))}
                    {safeData.qualitative_feedback.suggestions.length === 0 && <li className="text-gray-500 italic">Belirtilmemiş.</li>}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
}
