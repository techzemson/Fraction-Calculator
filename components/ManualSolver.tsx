import React from 'react';
import { FractionData, OperationType } from '../types';
import { toImproper } from '../utils/math';

interface ManualSolverProps {
  f1: FractionData;
  f2: FractionData;
  op: OperationType;
}

export const ManualSolver: React.FC<ManualSolverProps> = ({ f1, f2, op }) => {
  const imp1 = toImproper(f1);
  const imp2 = toImproper(f2);
  
  const opSymbol = op === 'add' ? '+' : op === 'subtract' ? '-' : op === 'multiply' ? '×' : '÷';
  const opName = op === 'add' ? 'Addition' : op === 'subtract' ? 'Subtraction' : op === 'multiply' ? 'Multiplication' : 'Division';
  
  // Inline component for rendering a visual fraction
  const FractionDisplay = ({ n, d, w }: { n: number|string, d: number|string, w?: number }) => (
    <div className="inline-flex items-center gap-2 font-mono">
      {w && Number(w) !== 0 && <span className="text-xl font-bold">{w}</span>}
      <div className="flex flex-col items-center mx-1">
        <span className="border-b-2 border-gray-700 px-1 pb-0.5 mb-0.5 text-center min-w-[20px]">{n}</span>
        <span className="text-center min-w-[20px]">{d}</span>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 md:p-8 shadow-inner overflow-x-auto h-full flex flex-col">
      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-2">
        <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">?</span>
        How to Solve Manually
      </h3>

      <div className="flex flex-col gap-8 font-mono text-lg text-slate-700 flex-1">
        
        {/* Step 1: Problem Statement */}
        <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
          <span className="text-xs font-sans font-bold text-slate-400 uppercase w-full block mb-2">1. The Equation</span>
          <div className="flex items-center flex-wrap gap-4">
            <FractionDisplay w={f1.whole} n={f1.numerator} d={f1.denominator} />
            <span className="text-2xl font-bold text-blue-500 mx-2">{opSymbol}</span>
            <FractionDisplay w={f2.whole} n={f2.numerator} d={f2.denominator} />
          </div>
        </div>

        {/* Step 2: Improper Conversion (if mixed) */}
        {(f1.whole !== 0 || f2.whole !== 0) && (
          <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
             <span className="text-xs font-sans font-bold text-slate-400 uppercase w-full block mb-2">2. Convert Mixed to Improper</span>
             <p className="text-sm font-sans text-slate-500 mb-3">
               To make {opName} easier, convert mixed numbers to improper fractions using: 
               <br/>
               <code className="bg-slate-100 px-1 rounded text-slate-700">Whole × Denominator + Numerator</code>
             </p>
             <div className="flex items-center gap-4">
                <FractionDisplay n={imp1.n} d={imp1.d} />
                <span className="text-2xl font-bold text-blue-500 mx-2">{opSymbol}</span>
                <FractionDisplay n={imp2.n} d={imp2.d} />
             </div>
          </div>
        )}

        {/* Step 3: Operation Specific Formula */}
        <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
          <span className="text-xs font-sans font-bold text-slate-400 uppercase w-full block mb-2">3. Apply {opName} Rule</span>
          
          {(op === 'add' || op === 'subtract') && (
            <div className="flex flex-col gap-3">
               <p className="text-sm font-sans text-slate-500">
                 Find a common denominator so the bottom numbers match.
               </p>
               <div className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded">
                 <span className="font-bold">LCM({imp1.d}, {imp2.d})</span>
                 <span>=</span>
                 <span className="text-blue-600 font-bold">{(imp1.d * imp2.d) / gcd(imp1.d, imp2.d)}</span> 
               </div>
               <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                  <span className="text-2xl text-gray-400">(</span>
                  <FractionDisplay n={`${imp1.n} × ${(imp1.d * imp2.d) / gcd(imp1.d, imp2.d) / imp1.d}`} d={(imp1.d * imp2.d) / gcd(imp1.d, imp2.d)} />
                  <span className="text-xl font-bold text-blue-500 mx-1">{opSymbol}</span>
                  <FractionDisplay n={`${imp2.n} × ${(imp1.d * imp2.d) / gcd(imp1.d, imp2.d) / imp2.d}`} d={(imp1.d * imp2.d) / gcd(imp1.d, imp2.d)} />
                  <span className="text-2xl text-gray-400">)</span>
               </div>
            </div>
          )}

          {op === 'multiply' && (
             <div className="flex items-center gap-2">
                <p className="text-sm font-sans text-slate-500 w-full mb-2">
                  Multiply the top numbers together and the bottom numbers together.
                </p>
                <div className="flex flex-col items-center">
                   <span className="border-b-2 border-black px-2">{imp1.n} × {imp2.n}</span>
                   <span>{imp1.d} × {imp2.d}</span>
                </div>
             </div>
          )}

          {op === 'divide' && (
             <div className="flex flex-col gap-2">
                <p className="text-sm font-sans text-slate-500 w-full mb-2">
                   "Keep, Change, Flip": Keep the first fraction, change division to multiplication, and flip the second fraction.
                </p>
                <div className="flex items-center gap-2">
                  <FractionDisplay n={imp1.n} d={imp1.d} />
                  <span className="text-xl font-bold text-blue-500 mx-1">×</span>
                  <FractionDisplay n={imp2.d} d={imp2.n} />
                </div>
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

// Helper for Manual Solver only
const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};