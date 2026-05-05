import { useState } from 'react';
import {
  Download, TrendingUp, Lightbulb, FileText,
  ChevronDown, ChevronUp, MessageSquare, Users, CheckCircle
} from 'lucide-react';
import {
  Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow,
  WidthType, HeadingLevel, BorderStyle, AlignmentType
} from 'docx';
import type { AnalysisData } from '../App';

interface DashboardProps {
  data: AnalysisData;
  onReset: () => void;
}

export function Dashboard({ data, onReset }: DashboardProps) {
  const [expandedSections, setExpandedSections] = useState<number[]>([]);

  // Veri güvenliği
  const safeData: AnalysisData = {
    ai_score_100: data?.ai_score_100 ?? 0,
    sections: data?.sections ?? [],
    qualitative_feedback: {
      strengths: data?.qualitative_feedback?.strengths ?? {},
      improvements: data?.qualitative_feedback?.improvements ?? {}
    }
  };

  const totalScore = Math.min(100, Math.round(safeData.ai_score_100 * 10) / 10);

  const toggleSection = (index: number) => {
    setExpandedSections(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  // Renk belirleme — 0-2 ölçeğine göre
  const getScoreBadgeColor = (score: number) => {
    if (score >= 1.5) return 'bg-green-100 text-green-800 border border-green-300';
    if (score >= 1.0) return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    if (score >= 0.5) return 'bg-orange-100 text-orange-800 border border-orange-300';
    return 'bg-red-100 text-red-800 border border-red-300';
  };

  // Toplam puan rengi — 100 üzerinden
  const getTotalScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 bg-green-50/80 border-green-300';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50/80 border-yellow-300';
    return 'text-red-600 bg-red-50/80 border-red-300';
  };

  // Word için hex renk
  const getWordColorHex = (score: number) => {
    if (score >= 1.5) return '166534';
    if (score >= 1.0) return '854d0e';
    if (score >= 0.5) return 'c2410c';
    return '991b1b';
  };

  // Puan etiketi
  const getScoreLabel = (score: number) => {
    if (score === 2) return 'Çok İyi';
    if (score === 1.5) return 'İyi';
    if (score === 1) return 'Orta';
    if (score === 0.5) return 'Kabul Edilebilir';
    return 'Yetersiz';
  };

  // Öğretmen adları API'den doğrudan Ö1, Ö2, vs. olarak geleceği için ekstra dönüşüm yapmıyoruz.

  // WORD DÖKÜMAN OLUŞTURMA
  const generateWordDocument = async () => {
    const tableBorderStyle = { style: BorderStyle.SINGLE, size: 1, color: 'bfbfbf' };

    const teacherFeedbackRows = (
      feedbackObj: Record<string, string>,
      color: string
    ) =>
      Object.entries(feedbackObj).map(
        ([key, value]) =>
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: key, bold: true })] })],
                width: { size: 10, type: WidthType.PERCENTAGE },
                shading: { fill: 'f9fafb' }
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: value || 'Belirtilmemiş.', color })] })],
                width: { size: 90, type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 120, right: 120 }
              })
            ]
          })
      );

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Başlık
          new Paragraph({
            text: 'DERS DEĞERLENDİRME RAPORU',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
          }),
          // Genel puan
          new Paragraph({
            text: 'GENEL DEĞERLENDİRME',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'TOPLAM PUAN: ', bold: true, size: 28 }),
              new TextRun({
                text: `${totalScore.toFixed(1)} / 100`,
                bold: true,
                size: 36,
                color: totalScore >= 75 ? '166534' : totalScore >= 50 ? '854d0e' : '991b1b'
              })
            ],
            spacing: { after: 300 }
          }),

          // Detaylı rubrik analizi
          new Paragraph({
            text: 'DETAYLI RUBRİK ANALİZİ (50 Kriter — Puan: 0 / 0.5 / 1 / 1.5 / 2)',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 }
          }),

          ...safeData.sections.flatMap(section => [
            new Paragraph({
              children: [
                new TextRun({
                  text: `${section.title.toUpperCase()}  (${section.section_score.toFixed(1)} / ${section.max_section_score})`,
                  bold: true,
                  color: '1e3a8a'
                })
              ],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: tableBorderStyle, bottom: tableBorderStyle,
                left: tableBorderStyle, right: tableBorderStyle,
                insideHorizontal: tableBorderStyle, insideVertical: tableBorderStyle
              },
              rows: [
                new TableRow({
                  tableHeader: true,
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Kriter No', bold: true })] })], width: { size: 8, type: WidthType.PERCENTAGE }, shading: { fill: 'f3f4f6' } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Kriter Tanımı', bold: true })] })], width: { size: 50, type: WidthType.PERCENTAGE }, shading: { fill: 'f3f4f6' } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Puan (0-2)', bold: true })], alignment: AlignmentType.CENTER })], width: { size: 12, type: WidthType.PERCENTAGE }, shading: { fill: 'f3f4f6' } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'AI Gerekçesi', bold: true })] })], width: { size: 30, type: WidthType.PERCENTAGE }, shading: { fill: 'f3f4f6' } })
                  ]
                }),
                ...section.criteria.map(
                  c =>
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph({ text: c.id })], margins: { top: 80, bottom: 80, left: 100, right: 100 } }),
                        new TableCell({ children: [new Paragraph({ text: c.text })], margins: { top: 80, bottom: 80, left: 100, right: 100 } }),
                        new TableCell({
                          children: [new Paragraph({
                            children: [new TextRun({ text: `${c.score} (${getScoreLabel(c.score)})`, bold: true, color: getWordColorHex(c.score) })],
                            alignment: AlignmentType.CENTER
                          })]
                        }),
                        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c.feedback, italics: true })] })], margins: { top: 80, bottom: 80, left: 100, right: 100 } })
                      ]
                    })
                )
              ]
            }),
            new Paragraph({ text: '', spacing: { after: 200 } })
          ]),

          // Güçlü yönler
          new Paragraph({ text: 'ÖĞRETMEN BAZLI GERİ BİLDİRİM', heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 }, pageBreakBefore: true }),

          new Paragraph({ children: [new TextRun({ text: 'GÜÇLÜ YÖNLER', bold: true, color: '166534' })], heading: HeadingLevel.HEADING_2 }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: tableBorderStyle, bottom: tableBorderStyle, left: tableBorderStyle, right: tableBorderStyle, insideHorizontal: tableBorderStyle, insideVertical: tableBorderStyle },
            rows: teacherFeedbackRows(safeData.qualitative_feedback.strengths as unknown as Record<string, string>, '166534')
          }),
          new Paragraph({ text: '', spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: 'GELİŞTİRİLMESİ GEREKEN ALANLAR', bold: true, color: '991b1b' })], heading: HeadingLevel.HEADING_2 }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: { top: tableBorderStyle, bottom: tableBorderStyle, left: tableBorderStyle, right: tableBorderStyle, insideHorizontal: tableBorderStyle, insideVertical: tableBorderStyle },
            rows: teacherFeedbackRows(safeData.qualitative_feedback.improvements as unknown as Record<string, string>, '991b1b')
          }),
          new Paragraph({ text: '', spacing: { after: 200 } })
        ]
      }]
    });

    Packer.toBlob(doc).then(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Microogretim_Degerlendirme_Raporu_${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">

      {/* Üst Panel */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 border-2 border-wisteria/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dusk-navy">Analiz Sonuçları</h2>
          <p className="text-sm text-dusk-dark/70 mt-1">Ders Değerlendirme Rubriği — 50 Kriter</p>
        </div>
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

      {/* Toplam Puan Kartı */}
      <div className={`rounded-2xl p-6 border-2 flex items-center gap-6 shadow-lg transition-all duration-500 ${getTotalScoreColor(totalScore)}`}>
        <div className="bg-white/50 p-4 rounded-full">
          <TrendingUp className="w-12 h-12" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-wider opacity-80 mb-1">Toplam AI Puanı</p>
          <p className="text-5xl md:text-6xl font-black tracking-tight">
            {totalScore.toFixed(1)}
            <span className="text-2xl md:text-3xl text-gray-500/80 font-bold"> / 100</span>
          </p>
        </div>
        {/* Ölçek göstergesi */}
        <div className="hidden md:flex flex-col gap-2 text-sm font-medium bg-white/80 p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">Puanlama Ölçeği</div>
          {[['2', 'Çok İyi', 'text-green-800 bg-green-100'], ['1.5', 'İyi', 'text-emerald-800 bg-emerald-100'], ['1', 'Orta', 'text-yellow-800 bg-yellow-100'], ['0.5', 'Kabul Edilebilir', 'text-orange-800 bg-orange-100'], ['0', 'Yetersiz', 'text-red-800 bg-red-100']].map(([val, lbl, cls]) => (
            <span key={val} className={`flex items-center gap-3 px-3 py-1.5 rounded-md ${cls}`}>
              <span className="font-bold w-6 text-center bg-white/60 rounded px-1">{val}</span> {lbl}
            </span>
          ))}
        </div>
      </div>

      {/* Detaylı Rubrik Analizi — Akordeon */}
      <div className="space-y-3">
        <h3 className="text-white font-bold text-lg drop-shadow">Detaylı Kriter Analizi</h3>
        {safeData.sections.map((section, index) => (
          <div key={index} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md overflow-hidden border border-wisteria/20">
            <button
              onClick={() => toggleSection(index)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-wisteria/10 to-baltic-blue/5 hover:from-wisteria/20 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white px-3 py-1 rounded-lg shadow-sm font-bold text-wisteria text-sm whitespace-nowrap">
                  {section.section_score.toFixed(1)} / {section.max_section_score}
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-dusk-navy">{section.title}</h4>
                  <p className="text-xs text-dusk-dark/60">{section.criteria.length} kriter</p>
                </div>
              </div>
              {expandedSections.includes(index)
                ? <ChevronUp className="w-5 h-5 text-dusk-dark flex-shrink-0" />
                : <ChevronDown className="w-5 h-5 text-dusk-dark flex-shrink-0" />}
            </button>

            {expandedSections.includes(index) && (
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-sm text-left text-dusk-dark">
                  <thead className="text-xs text-dusk-navy uppercase bg-gray-100/50">
                    <tr>
                      <th className="px-3 py-3 rounded-tl-lg w-16">No</th>
                      <th className="px-3 py-3">Kriter Tanımı</th>
                      <th className="px-3 py-3 text-center w-32">Puan (0-2)</th>
                      <th className="px-3 py-3 rounded-tr-lg">AI Gerekçesi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.criteria.map(item => (
                      <tr key={item.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3 font-bold text-wisteria">{item.id}</td>
                        <td className="px-3 py-3 font-medium text-dusk-navy">{item.text}</td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`inline-block px-2 py-1 rounded-full font-bold text-sm ${getScoreBadgeColor(item.score)}`}>
                              {item.score}
                            </span>
                            <span className="text-xs text-gray-500">{getScoreLabel(item.score)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-gray-600 italic">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 mt-1 flex-shrink-0 text-baltic-blue/70" />
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

      {/* Öğretmen Bazlı Geri Bildirim */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

        {/* Güçlü Yönler */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 shadow-md">
          <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> Güçlü Yönler
          </h3>
          <div className="space-y-3">
            {Object.entries(safeData.qualitative_feedback.strengths).map(([key, value]) => (
              <div key={key} className="flex items-start gap-3">
                <span className="bg-green-200 text-green-800 font-bold text-xs px-2 py-1 rounded-full flex-shrink-0 mt-0.5">
                  {key}
                </span>
                <p className="text-green-900 text-sm">{value || 'Belirtilmemiş.'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Geliştirilmesi Gerekenler */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border-2 border-red-200 shadow-md">
          <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" /> Geliştirilmesi Gereken Alanlar
          </h3>
          <div className="space-y-3">
            {Object.entries(safeData.qualitative_feedback.improvements).map(([key, value]) => (
              <div key={key} className="flex items-start gap-3">
                <span className="bg-red-200 text-red-800 font-bold text-xs px-2 py-1 rounded-full flex-shrink-0 mt-0.5">
                  {key}
                </span>
                <p className="text-red-900 text-sm">{value || 'Belirtilmemiş.'}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}