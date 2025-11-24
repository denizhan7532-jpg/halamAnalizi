import { useState } from 'react';
import { Download, TrendingUp, Lightbulb, FileText, ChevronDown, ChevronUp, Star, MessageSquare, Plus, Minus } from 'lucide-react';
// docx kütüphanesinden gerekli parçaları import ediyoruz
import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, HeadingLevel, BorderStyle, AlignmentType } from "docx";
// App.tsx'ten gelen tipler (Dosya yolunun doğru olduğundan emin olun)
import type { AnalysisData } from '../App';

interface DashboardProps {
  data: AnalysisData;
  onReset: () => void;
}

export function Dashboard({ data, onReset }: DashboardProps) {
  // Başlangıç değerini 0 olarak belirledik.
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

  // Toplam puan hesaplama (Anlık güncellenir)
  const totalScore = Math.min(100, Math.round(safeData.ai_score_90 + teacherScore));

  // --- YENİ: PUAN ARTIRMA/AZALTMA FONKSİYONLARI ---
  const incrementScore = () => {
    setTeacherScore(prev => Math.min(10, prev + 0.5)); // Max 10'a kadar 0.5 artır
  };

  const decrementScore = () => {
    setTeacherScore(prev => Math.max(0, prev - 0.5)); // Min 0'a kadar 0.5 azalt
  };
  // --------------------------------------------------

  const toggleSection = (index: number) => {
    setExpandedSections(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  // Arayüz için renk belirleme fonksiyonu
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50/80 border-green-300';
    if (score >= 65) return 'text-yellow-600 bg-yellow-50/80 border-yellow-300';
    return 'text-red-600 bg-red-50/80 border-red-300';
  };

  // Word dökümanı için renk kodu
  const getWordColorHex = (score: number) => {
    if (score >= 2.5) return "166534";
    if (score >= 1.5) return "854d0e";
    return "991b1b";
  };

  // WORD DÖKÜMANI OLUŞTURMA (Aynı kalıyor)
  const generateWordDocument = async () => {
    const tableBorderStyle = { style: BorderStyle.SINGLE, size: 1, color: "bfbfbf" };

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({ text: "DERS PLANI ANALİZ RAPORU", heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
                new Paragraph({ text: "GENEL DEĞERLENDİRME", heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 100 } }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "TOPLAM BAŞARI PUANI: ", bold: true, size: 28 }),
                        new TextRun({ text: `${totalScore.toString()}/100`, bold: true, size: 36, color: totalScore >= 85 ? "166534" : totalScore >= 65 ? "854d0e" : "991b1b" }),
                    ],
                    spacing: { after: 100 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `• AI Puanı: ${safeData.ai_score_90.toFixed(1)} / 90` }),
                        new TextRun({ break: 1 }),
                        new TextRun({ text: `• Öğretmen Puanı: ${teacherScore} / 10` }),
                    ],
                    spacing: { after: 300 },
                }),
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
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Üst Panel: Başlık ve Butonlar */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 border-2 border-wisteria/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-dusk-navy">Analiz Sonuçları</h2>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={generateWordDocument}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
          >
            <Download className="w-4 h-4" /> Word Olarak İndir
          </button>
          <button
            onClick={onReset}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-dusk-dark to-baltic-blue text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
          >
            <FileText className="w-4 h-4" /> Yeni Analiz
          </button>
        </div>
      </div>

      {/* Skor Kartı ve Öğretmen Puanı */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Toplam Puan Göstergesi */}
        <div className={`md:col-span-2 rounded-2xl p-6 border-2 flex items-center gap-6 shadow-lg transition-all duration-500 ${getScoreColor(totalScore)}`}>
          <div className="bg-white/50 p-4 rounded-full">
              <TrendingUp className="w-12 h-12" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider opacity-80 mb-1">AI Başarı Puanı</p>
            <p className="text-5xl md:text-6xl font-black tracking-tight">{totalScore}<span className="text-2xl md:text-3xl text-gray-500/80 font-bold">/90</span></p>
            <p className="text-sm mt-2 opacity-90 font-medium">AI Puanı: {safeData.ai_score_90.toFixed(1)}</p>
          </div>
        </div>

        {/* --- YENİ ÖĞRETMEN PUANI GİRİŞ ALANI (STEPPER) --- */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 border-2 border-wisteria/30 flex flex-col justify-center">
            <h3 className="text-lg font-semibold text-dusk-navy mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" fill="currentColor" /> Öğretmen Başarı Puanı
            </h3>
            
            <div className="flex items-center justify-between bg-wisteria/10 rounded-xl p-2 border border-wisteria/20">
                {/* AZALT BUTONU */}
                <button
                    onClick={decrementScore}
                    disabled={teacherScore <= 0}
                    className="w-12 h-12 flex items-center justify-center bg-white text-dusk-navy rounded-lg shadow-sm hover:bg-wisteria hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                    <Minus className="w-6 h-6" />
                </button>

                {/* PUAN GÖSTERGESİ */}
                <div className="text-3xl font-black text-dusk-navy w-20 text-center">
                    {teacherScore.toFixed(1)}
                </div>

                {/* ARTIR BUTONU */}
                <button
                    onClick={incrementScore}
                    disabled={teacherScore >= 10}
                    className="w-12 h-12 flex items-center justify-center bg-white text-dusk-navy rounded-lg shadow-sm hover:bg-wisteria hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>
           
        </div>
        {/* -------------------------------------------------- */}
      </div>

      {/* Detaylı Rubrik Analizi (Akordeon) - DEĞİŞMEDİ */}
      <div className="space-y-4">
        
        {safeData.sections.map((section, index) => (
          <div key={index} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md overflow-hidden border border-wisteria/20">
            <button
              onClick={() => toggleSection(index)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-wisteria/10 to-baltic-blue/5 hover:from-wisteria/20 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm font-bold text-wisteria">
                      {section.section_score.toFixed(1)} / {section.max_section_score}
                  </div>
                  <h4 className="font-bold text-dusk-navy text-left">{section.title}</h4>
              </div>
              {expandedSections.includes(index) ? <ChevronUp className="w-5 h-5 text-dusk-dark" /> : <ChevronDown className="w-5 h-5 text-dusk-dark" />}
            </button>
            
            {expandedSections.includes(index) && (
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-sm text-left text-dusk-dark">
                  <thead className="text-xs text-dusk-navy uppercase bg-gray-100/50">
                    <tr>
                      <th scope="col" className="px-4 py-3 rounded-tl-lg">Kriter ID</th>
                      <th scope="col" className="px-4 py-3">Kriter Tanımı</th>
                      <th scope="col" className="px-4 py-3 text-center">Puan (1-3)</th>
                      <th scope="col" className="px-4 py-3 rounded-tr-lg">AI Gerekçesi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.criteria.map((item) => (
                      <tr key={item.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 font-medium">{item.id}</td>
                        <td className="px-4 py-4 font-medium text-dusk-navy">{item.text}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full font-bold text-sm ${item.score >= 2.5 ? 'bg-green-100 text-green-800' : item.score >= 1.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {item.score}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-600 italic flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 mt-1 flex-shrink-0 text-baltic-blue/70" /> {item.feedback}
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

      {/* Niteliksel Geri Bildirim Kartları - DEĞİŞMEDİ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Güçlü Yönler */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 shadow-md">
          <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Güçlü Yönler
          </h3>
          <ul className="space-y-2">
            {safeData.qualitative_feedback.strengths.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-green-900">
                <span className="text-green-500 mt-1">✓</span> {item}
              </li>
            ))}
            {safeData.qualitative_feedback.strengths.length === 0 && <li className="text-gray-500 italic">Belirtilmemiş.</li>}
          </ul>
        </div>

        {/* Geliştirilmesi Gerekenler ve Öneriler */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-red-200/50 shadow-md space-y-6">
            <div>
                <h3 className="text-lg font-bold text-dusk-navy mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-red-500" /> Geliştirilmesi Gereken Alanlar
                </h3>
                <ul className="space-y-2">
                    {safeData.qualitative_feedback.improvements.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-dusk-dark">
                        <span className="text-red-500 font-bold mt-0.5">!</span> {item}
                    </li>
                    ))}
                    {safeData.qualitative_feedback.improvements.length === 0 && <li className="text-gray-500 italic">Belirtilmemiş.</li>}
                </ul>
            </div>
            <div className="pt-4 border-t border-wisteria/20">
                <h4 className="text-lg font-bold text-dusk-navy mb-3">💡 Pedagojik Öneriler</h4>
                <ul className="space-y-2 text-sm pl-4 list-disc marker:text-baltic-blue">
                    {safeData.qualitative_feedback.suggestions.map((item, i) => (
                        <li key={i} className="text-dusk-dark pl-1">{item}</li>
                    ))}
                    {safeData.qualitative_feedback.suggestions.length === 0 && <li className="text-gray-500 italic">Belirtilmemiş.</li>}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
}