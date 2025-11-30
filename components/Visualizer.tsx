import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { CalculationResult, VisualizationData, FractionData } from '../types';

interface VisualizerProps {
  data: VisualizationData[];
  result: CalculationResult;
  op: string;
}

// Helper to convert to improper for visualization
const getImproper = (f: FractionData) => (f.whole * f.denominator) + f.numerator;

export const Visualizer: React.FC<VisualizerProps> = ({ data, result, op }) => {
  // Pie chart data for the Result breakdown (Whole vs Remainder)
  const pieData = [
    { name: 'Whole Part', value: Math.abs(result.fraction.whole), fill: '#3b82f6' },
    { name: 'Fractional Part', value: Math.abs(result.decimal - Math.trunc(result.decimal)), fill: '#93c5fd' },
  ].filter(d => d.value > 0);
  
  if (pieData.length === 0 && result.decimal === 0) {
      pieData.push({ name: 'Zero', value: 1, fill: '#e5e7eb' });
  }

  const renderAreaModel = () => {
    // Only for multiplication
    if (op !== 'multiply') return null;

    const f1 = result.originalInputs.f1;
    const f2 = result.originalInputs.f2;
    // Simplify vis by using improper numerator only if whole is 0, otherwise it gets too complex visually
    // We visualize the FRACTIONAL parts multiplication if mixed numbers exist, or just the fractions.
    // For simplicity in this tool, let's visualize the unit fraction multiplication part (ignoring whole numbers for the grid to keep it readable, or handling simple proper fractions).
    
    // Let's visualize the multiplication of the proper fraction parts for clarity
    const n1 = f1.numerator;
    const d1 = f1.denominator;
    const n2 = f2.numerator;
    const d2 = f2.denominator;

    if (d1 > 20 || d2 > 20) return <div className="flex items-center justify-center h-full text-gray-400">Grid too dense to visualize</div>;
    if (d1 === 0 || d2 === 0) return null;

    return (
      <div className="flex flex-col items-center h-full w-full">
         <div className="relative border-2 border-gray-800 bg-white" style={{ 
            width: '200px', 
            height: '200px',
            display: 'grid',
            gridTemplateRows: `repeat(${d1}, 1fr)`,
            gridTemplateColumns: `repeat(${d2}, 1fr)`
         }}>
            {Array.from({ length: d1 * d2 }).map((_, i) => {
               const row = Math.floor(i / d2);
               const col = i % d2;
               // Input 1 (Rows)
               const activeRow = row < n1;
               // Input 2 (Cols)
               const activeCol = col < n2;
               
               let bgColor = 'white';
               if (activeRow && activeCol) bgColor = '#10b981'; // Overlap (Result)
               else if (activeRow) bgColor = '#60a5fa'; // Blue (Input 1)
               else if (activeCol) bgColor = '#a78bfa'; // Purple (Input 2)

               return (
                 <div key={i} style={{ backgroundColor: bgColor }} className="border-[0.5px] border-gray-100" />
               );
            })}
         </div>
         <div className="mt-4 flex gap-4 text-xs">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-400"></div> Input 1</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-400"></div> Input 2</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500"></div> Overlap (Result)</div>
         </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* Dynamic Visualization (Bar or Area Model) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col">
        <h3 className="text-gray-700 font-semibold mb-4 text-sm uppercase tracking-wide">
          {op === 'multiply' ? 'Area Model (Fraction Parts)' : 'Value Comparison'}
        </h3>
        <div className="flex-1 w-full overflow-hidden">
          {op === 'multiply' ? renderAreaModel() : (
             <ResponsiveContainer width="100%" height="100%">
             <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
               <XAxis type="number" stroke="#9ca3af" fontSize={12} />
               <YAxis dataKey="name" type="category" stroke="#4b5563" fontSize={12} width={80} />
               <Tooltip 
                 cursor={{fill: '#f3f4f6'}}
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
               />
               <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                 {data.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.fill} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Pie Chart Composition */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col">
        <h3 className="text-gray-700 font-semibold mb-4 text-sm uppercase tracking-wide">Result Composition</h3>
         <div className="flex-1 relative">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                >
                {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
            </ResponsiveContainer>
            {/* Center Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
               <span className="text-2xl font-bold text-gray-700">{result.decimal}</span>
            </div>
         </div>
      </div>
    </div>
  );
};