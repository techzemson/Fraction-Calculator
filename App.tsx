import React, { useState, useRef } from 'react';
import { 
  Calculator, 
  Activity, 
  ArrowRight, 
  Download, 
  Lightbulb, 
  RotateCcw,
  CheckCircle2,
  BrainCircuit,
  Share2,
  Copy,
  ArrowLeftRight,
  Repeat2,
  History,
  Trash2,
  BookOpen,
  X
} from 'lucide-react';
import { jsPDF } from "jspdf";
import { FractionData, OperationType, CalculationResult, VisualizationData, AIExplanation, HistoryItem } from './types';
import { calculateFraction } from './utils/math';
import { generateExplanation } from './services/geminiService';
import { Visualizer } from './components/Visualizer';
import { ManualSolver } from './components/ManualSolver';

// --- Reusable Input Component ---
const FractionInputBlock: React.FC<{
  label: string;
  value: FractionData;
  onChange: (val: FractionData) => void;
  color: string;
  onInverse: () => void;
}> = ({ label, value, onChange, color, onInverse }) => {
  const handleChange = (field: keyof FractionData, num: number) => {
    onChange({ ...value, [field]: isNaN(num) ? 0 : num });
  };

  return (
    <div className={`p-5 rounded-2xl bg-white border-2 border-${color}-100 shadow-sm transition-all hover:shadow-md hover:border-${color}-300 relative group`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-${color}-600 font-bold text-sm uppercase tracking-wider`}>{label}</h3>
        <button 
           onClick={onInverse}
           title="Flip Fraction (Inverse)"
           className="p-1.5 rounded-full bg-gray-50 text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
        >
          <Repeat2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex flex-col w-20">
          <input
            type="number"
            className="w-full p-3 text-center text-xl font-bold border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
            placeholder="0"
            value={value.whole || ''}
            onChange={(e) => handleChange('whole', parseInt(e.target.value))}
          />
          <span className="text-[10px] uppercase font-semibold text-center text-gray-400 mt-2">Whole</span>
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="number"
            className="w-24 p-2 text-center font-semibold border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Num"
            value={value.numerator || ''}
            onChange={(e) => handleChange('numerator', parseInt(e.target.value))}
          />
          <div className="h-0.5 bg-gray-200 w-full rounded-full"></div>
          <input
            type="number"
            className="w-24 p-2 text-center font-semibold border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Den"
            value={value.denominator || ''}
            onChange={(e) => handleChange('denominator', parseInt(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
};

// --- Operator Button ---
const OperatorBtn: React.FC<{
  op: OperationType;
  current: OperationType;
  setOp: (o: OperationType) => void;
  symbol: string;
}> = ({ op, current, setOp, symbol }) => (
  <button
    onClick={() => setOp(op)}
    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-200 ${
      current === op 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' 
        : 'bg-white text-gray-400 border border-gray-200 hover:border-blue-300 hover:text-blue-500'
    }`}
  >
    {symbol}
  </button>
);

const App: React.FC = () => {
  // State
  const [f1, setF1] = useState<FractionData>({ whole: 0, numerator: 1, denominator: 2 });
  const [f2, setF2] = useState<FractionData>({ whole: 0, numerator: 1, denominator: 4 });
  const [op, setOp] = useState<OperationType>('add');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [visData, setVisData] = useState<VisualizationData[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showDocs, setShowDocs] = useState(false);
  
  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [explanation, setExplanation] = useState<AIExplanation | null>(null);

  // Constants
  const defaultDenom = 1;

  // Handlers
  const handleSwap = () => {
    const temp = { ...f1 };
    setF1({ ...f2 });
    setF2(temp);
  };

  const handleInverse = (isF1: boolean) => {
    if (isF1) {
       // Inverse f1: (w * d + n)/d -> d / (w*d+n), new whole = 0
       const num = (f1.whole * f1.denominator) + f1.numerator;
       if (num === 0) return alert("Cannot invert zero!");
       setF1({ whole: 0, numerator: f1.denominator, denominator: num });
    } else {
       const num = (f2.whole * f2.denominator) + f2.numerator;
       if (num === 0) return alert("Cannot invert zero!");
       setF2({ whole: 0, numerator: f2.denominator, denominator: num });
    }
  };

  const handleCalculate = () => {
    // Basic validation
    if (f1.denominator === 0 || f2.denominator === 0) {
      alert("Denominator cannot be zero!");
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setResult(null);
    setExplanation(null); // Reset AI

    // Simulate analysis progress for UX
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5; 
      });
    }, 30);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      
      const res = calculateFraction(f1, f2, op);
      setResult(res);
      
      // Add to History
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        f1: { ...f1 },
        f2: { ...f2 },
        op,
        result: `${res.fraction.whole ? res.fraction.whole + ' ' : ''}${res.fraction.numerator}/${res.fraction.denominator}`,
        timestamp: Date.now()
      };
      setHistory(prev => [newItem, ...prev].slice(0, 10)); // Keep last 10

      // Prepare Viz Data
      const val1 = f1.whole + (f1.numerator / (f1.denominator || defaultDenom));
      const val2 = f2.whole + (f2.numerator / (f2.denominator || defaultDenom));
      
      setVisData([
        { name: 'Input 1', value: parseFloat(val1.toFixed(3)), fill: '#60a5fa' }, // blue-400
        { name: 'Input 2', value: parseFloat(val2.toFixed(3)), fill: '#a78bfa' }, // purple-400
        { name: 'Result', value: res.decimal, fill: '#10b981' }, // emerald-500
      ]);

      setIsAnalyzing(false);
      
      // Scroll to result
      setTimeout(() => {
          document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    }, 800); 
  };

  const loadFromHistory = (item: HistoryItem) => {
    setF1(item.f1);
    setF2(item.f2);
    setOp(item.op);
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAIExplain = async () => {
    if (!result) return;
    setAiLoading(true);
    const aiRes = await generateExplanation(f1, f2, op, result.decimal);
    setExplanation(aiRes);
    setAiLoading(false);
  };

  const copyToClipboard = (text: string) => {
     navigator.clipboard.writeText(text);
     alert("Copied to clipboard!");
  };

  const shareScenario = (text: string) => {
      if (navigator.share) {
          navigator.share({
              title: 'Fraction Scenario',
              text: text,
          }).catch(console.error);
      } else {
          copyToClipboard(text);
      }
  };

  const downloadPDF = () => {
    if (!result) return;
    
    const doc = new jsPDF();
    const lineHeight = 10;
    let y = 20;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Blue color
    doc.text("Fraction Calculator Report", 10, y);
    y += lineHeight * 2;

    // Inputs
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Operation: ${op.toUpperCase()}`, 10, y);
    y += lineHeight;
    doc.text(`Input 1: ${f1.whole ? f1.whole : ''} ${f1.numerator}/${f1.denominator}`, 10, y);
    y += lineHeight;
    doc.text(`Input 2: ${f2.whole ? f2.whole : ''} ${f2.numerator}/${f2.denominator}`, 10, y);
    y += lineHeight * 1.5;

    // Result
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("RESULT:", 10, y);
    y += lineHeight;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text(`Mixed Fraction: ${result.fraction.whole ? result.fraction.whole : ''} ${result.fraction.numerator}/${result.fraction.denominator}`, 10, y);
    y += lineHeight;
    doc.text(`Improper Fraction: ${result.improper.numerator}/${result.improper.denominator}`, 10, y);
    y += lineHeight;
    doc.text(`Decimal: ${result.decimal}`, 10, y);
    y += lineHeight;
    doc.text(`Percentage: ${result.percentage}%`, 10, y);
    y += lineHeight * 2;

    // Steps
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("STEPS TO SOLVE:", 10, y);
    y += lineHeight;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    
    result.steps.forEach((step, index) => {
        const splitText = doc.splitTextToSize(`${index + 1}. ${step}`, 180);
        if (y + (splitText.length * 7) > 280) {
            doc.addPage();
            y = 20;
        }
        doc.text(splitText, 10, y);
        y += (splitText.length * 7) + 3;
    });

    if (explanation) {
        doc.addPage();
        y = 20;
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("AI Explanation & Scenario", 10, y);
        y += lineHeight;
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        const expLines = doc.splitTextToSize(`Explanation: ${explanation.simpleExplanation}`, 180);
        doc.text(expLines, 10, y);
        y += (expLines.length * 7) + 10;
        
        const scenLines = doc.splitTextToSize(`Scenario: ${explanation.realWorldScenario}`, 180);
        doc.text(scenLines, 10, y);
    }

    doc.save("fraction_calculator_report.pdf");
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 text-slate-800 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 bg-opacity-80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
               <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Fraction Calculator</h1>
            </div>
          </div>
          
          <button 
            onClick={() => setShowDocs(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Documentation</span>
          </button>
        </div>
      </header>

      {/* Documentation Modal */}
      {showDocs && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                User Guide & Documentation
              </h2>
              <button onClick={() => setShowDocs(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-8">
              {/* Section 1: Introduction */}
              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-3">Welcome to Fraction Calculator</h3>
                <p className="text-slate-600 leading-relaxed">
                  This tool is designed to go beyond simple calculation. It acts as a comprehensive math tutor, helping students, teachers, and professionals understand fraction operations through visualization, step-by-step logic, and AI-powered real-world context.
                </p>
              </section>

              {/* Section 2: How to Use */}
              <section className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-bold text-blue-900 mb-4">How to Use</h3>
                <ol className="list-decimal list-inside space-y-3 text-slate-700">
                  <li className="pl-2"><span className="font-semibold">Enter Fractions:</span> Input the Whole number (optional), Numerator, and Denominator for both fractions.</li>
                  <li className="pl-2"><span className="font-semibold">Select Operation:</span> Choose Addition (+), Subtraction (-), Multiplication (×), or Division (÷).</li>
                  <li className="pl-2"><span className="font-semibold">Tools:</span> Use the <span className="inline-flex items-center justify-center p-1 bg-gray-200 rounded-full w-5 h-5 mx-1"><Repeat2 className="w-3 h-3"/></span> Flip button to invert a fraction, or <span className="inline-flex items-center justify-center p-1 bg-gray-200 rounded-full w-5 h-5 mx-1"><ArrowLeftRight className="w-3 h-3"/></span> Swap button to exchange positions.</li>
                  <li className="pl-2"><span className="font-semibold">Calculate:</span> Press the blue "Calculate Result" button to process.</li>
                </ol>
              </section>

              {/* Section 3: Features */}
              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Features & Functions</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    {icon: Activity, title: "Step-by-Step Breakdown", desc: "Detailed textual explanation of every math step taken to reach the solution."},
                    {icon: CheckCircle2, title: "Manual Solver View", desc: "Visual math representation showing how to solve the equation on paper."},
                    {icon: BrainCircuit, title: "AI Real-World Scenarios", desc: "Generates unique word problems and simple explanations using Google Gemini AI."},
                    {icon: Download, title: "PDF Reports", desc: "Download a professional PDF report of your calculation and steps."},
                    {icon: History, title: "History Tracker", desc: "Automatically saves your last 10 calculations for quick restoration."},
                    {icon: RotateCcw, title: "Visualizer", desc: "Interactive charts and area models to visualize fraction magnitude and multiplication."}
                  ].map((feature, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="mt-1"><feature.icon className="w-5 h-5 text-blue-500" /></div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{feature.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 4: Benefits */}
              <section className="bg-green-50/50 rounded-2xl p-6 border border-green-100">
                 <h3 className="text-lg font-bold text-green-900 mb-3">Why use this tool?</h3>
                 <ul className="list-disc list-inside space-y-2 text-slate-700">
                    <li><span className="font-semibold">Visual Learning:</span> Seeing fractions as charts and grids helps intuitively understand magnitudes.</li>
                    <li><span className="font-semibold">Homework Helper:</span> Great for verifying answers and learning the methodology.</li>
                    <li><span className="font-semibold">Professional Reporting:</span> Generate clean PDF reports for assignments or records.</li>
                 </ul>
              </section>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
              <button 
                onClick={() => setShowDocs(false)}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm"
              >
                Close Documentation
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Top Section: Inputs & History */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Input Area */}
          <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-10 relative overflow-hidden">
             {/* Decorative blob */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              
              {/* Left Fraction */}
              <FractionInputBlock 
                 label="Fraction A" 
                 value={f1} 
                 onChange={setF1} 
                 color="blue" 
                 onInverse={() => handleInverse(true)}
              />

              {/* Operator Selection & Swap */}
              <div className="flex flex-col items-center gap-6">
                 {/* Swap Button */}
                 <button 
                   onClick={handleSwap}
                   className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                   title="Swap Inputs"
                 >
                    <ArrowLeftRight className="w-5 h-5" />
                 </button>

                 <div className="flex gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <OperatorBtn op="add" current={op} setOp={setOp} symbol="+" />
                    <OperatorBtn op="subtract" current={op} setOp={setOp} symbol="−" />
                    <OperatorBtn op="multiply" current={op} setOp={setOp} symbol="×" />
                    <OperatorBtn op="divide" current={op} setOp={setOp} symbol="÷" />
                 </div>
              </div>

              {/* Right Fraction */}
              <FractionInputBlock 
                 label="Fraction B" 
                 value={f2} 
                 onChange={setF2} 
                 color="indigo" 
                 onInverse={() => handleInverse(false)}
              />
            </div>

            {/* Action Button */}
            <div className="mt-10 flex flex-col items-center relative z-10">
              <button
                onClick={handleCalculate}
                disabled={isAnalyzing}
                className={`
                  group relative px-10 py-4 bg-blue-600 
                  text-white text-lg font-bold rounded-xl shadow-xl shadow-blue-600/30
                  hover:shadow-2xl hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all duration-300
                  disabled:opacity-70 disabled:cursor-not-allowed
                  w-full md:w-auto flex items-center gap-3
                `}
              >
                 {isAnalyzing ? (
                   <>Analyzing...</>
                 ) : (
                   <>
                     Calculate Result 
                     <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                   </>
                 )}
              </button>
              
              {/* Progress Bar */}
              {isAnalyzing && (
                <div className="w-full max-w-xs mt-6">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-100 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* History Sidebar */}
          <div className="hidden lg:block lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col h-[400px]">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                   <History className="w-4 h-4" /> History
                </h3>
                {history.length > 0 && (
                  <button onClick={() => setHistory([])} className="text-xs text-red-400 hover:text-red-600">
                    Clear
                  </button>
                )}
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {history.length === 0 ? (
                   <div className="text-center text-slate-400 text-sm py-10">No recent calculations</div>
                ) : (
                   history.map(item => (
                      <button 
                        key={item.id} 
                        onClick={() => loadFromHistory(item)}
                        className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all group"
                      >
                         <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span className="uppercase font-bold">{item.op}</span>
                            <span className="opacity-0 group-hover:opacity-100 text-blue-500">Restore</span>
                         </div>
                         <div className="text-sm font-medium text-slate-700">
                            Result: {item.result}
                         </div>
                      </button>
                   ))
                )}
             </div>
          </div>
        </div>

        {/* Result Section */}
        {result && !isAnalyzing && (
          <div id="result-section" className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* 1. Main Numeric Result */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 bg-blue-600 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                 <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                 <h2 className="text-blue-200 font-medium text-xs uppercase tracking-widest mb-4">Calculated Answer</h2>
                 
                 <div className="flex items-center gap-4 text-5xl font-bold my-8 relative z-10">
                    {result.fraction.whole !== 0 && (
                       <span>{result.fraction.whole}</span>
                    )}
                    {result.fraction.denominator !== 0 && result.fraction.numerator !== 0 && (
                      <div className="flex flex-col items-center text-3xl">
                        <span className="border-b-2 border-white/40 px-3 pb-1 mb-1">{result.fraction.numerator}</span>
                        <span className="px-3">{result.fraction.denominator}</span>
                      </div>
                    )}
                    {(result.fraction.whole === 0 && result.fraction.numerator === 0) && (
                      <span>0</span>
                    )}
                 </div>

                 <div className="grid grid-cols-2 gap-4 text-sm text-blue-100 border-t border-white/20 pt-6 mt-2 relative z-10">
                   <div>
                     <span className="block text-xs opacity-70">Decimal</span>
                     <span className="font-mono text-lg font-semibold">{result.decimal}</span>
                   </div>
                   <div>
                     <span className="block text-xs opacity-70">Percentage</span>
                     <span className="font-mono text-lg font-semibold">{result.percentage}%</span>
                   </div>
                 </div>
              </div>

              {/* 2. Manual Solution Steps (Visual) */}
              <div className="md:col-span-2">
                 <ManualSolver f1={f1} f2={f2} op={op} />
              </div>
            </div>

            {/* 3. Detailed Step-by-Step Text List */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                     <CheckCircle2 className="text-green-500 w-5 h-5" />
                     Step-by-Step Breakdown
                   </h2>
                   <button onClick={downloadPDF} className="text-slate-400 hover:text-blue-600 transition flex items-center gap-1 text-sm font-medium">
                      <Download className="w-4 h-4" /> Download PDF
                   </button>
                </div>
                <div className="space-y-4">
                  {result.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-slate-600 text-base leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
            </div>

            {/* 4. Visualizer & AI Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Visuals */}
              <div className="lg:col-span-2">
                 <Visualizer data={visData} result={result} op={op} />
              </div>

              {/* AI Assistant */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                
                <h3 className="font-bold flex items-center gap-2 mb-6 relative z-10 text-lg">
                  <BrainCircuit className="w-5 h-5 text-indigo-400" />
                  Real World Scenario
                </h3>

                {!explanation ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-8 relative z-10">
                    <p className="text-indigo-200 text-sm leading-relaxed">
                      Generate a unique real-world scenario and simple explanation for this problem.
                    </p>
                    <button 
                      onClick={handleAIExplain}
                      disabled={aiLoading}
                      className="bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-8 rounded-xl backdrop-blur-sm border border-white/10 transition-all duration-300 flex items-center gap-2"
                    >
                       {aiLoading ? (
                         <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                       ) : <Lightbulb className="w-4 h-4" />}
                       {aiLoading ? 'Thinking...' : 'Generate Scenario'}
                    </button>
                  </div>
                ) : (
                   <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 relative z-10 flex-1 flex flex-col">
                      <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                        <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide mb-2">Why is this the answer?</h4>
                        <p className="text-indigo-50 text-sm leading-relaxed">
                          {explanation.simpleExplanation}
                        </p>
                      </div>
                      
                      <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/5 flex-1">
                         <div className="flex justify-between items-start mb-2">
                            <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide">Real World Scenario</h4>
                            <div className="flex gap-2">
                              <button onClick={() => copyToClipboard(explanation.realWorldScenario)} className="text-indigo-300 hover:text-white transition" title="Copy Text">
                                <Copy className="w-3 h-3" />
                              </button>
                              <button onClick={() => shareScenario(explanation.realWorldScenario)} className="text-indigo-300 hover:text-white transition" title="Share Scenario">
                                <Share2 className="w-3 h-3" />
                              </button>
                            </div>
                         </div>
                        <p className="text-indigo-50 text-sm leading-relaxed italic">
                          "{explanation.realWorldScenario}"
                        </p>
                      </div>

                      <button 
                        onClick={() => setExplanation(null)}
                        className="text-xs text-indigo-400 hover:text-white flex items-center justify-center gap-1 mt-auto pt-2"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset AI
                      </button>
                   </div>
                )}
              </div>

            </div>

          </div>
        )}
      </main>

      {/* Mobile History Drawer Toggle (Optional, simplified to footer for now if needed) */}
      <div className="fixed bottom-0 w-full bg-white border-t border-slate-200 p-4 text-center text-xs text-slate-400 md:hidden">
         Scroll down to view history
      </div>
    </div>
  );
};

export default App;