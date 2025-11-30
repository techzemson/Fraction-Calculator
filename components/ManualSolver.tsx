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
  
  // Inline component for rendering a visual fraction
  const FractionDisplay = ({ n, d, w }: { n: number|string, d: number|string, w?: number }) => (
    <div className="inline-flex items-center gap-2">
      {w && Number(w) !== 0 && <span className="text-xl font-bold">{w}</span>}
      <div className="flex flex-col items-center mx-1">
        <span className="border-b-2 border-gray-700 px-1 pb-0.5 mb-0.5 text-center min-w-[20px]">{n}</span>
        <span className="text-center min-w-[20px]">{d}</span>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 md:p-8 shadow-inner overflow-x-auto">
      <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-2">
        <span className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-sm">π</span>
        How to Solve Manually
      </h3>

      <div className="flex flex-col gap-8 font-mono text-lg text-slate-700">
        
        {/* Step 1: Problem Statement */}
        <div className="flex items-center flex-wrap gap-4">
          <span className="text-sm font-sans text-slate-500 uppercase w-full block">1. The Problem</span>
          <FractionDisplay w={f1.whole} n={f1.numerator} d={f1.denominator} />
          <span className="text-2xl font-bold text-blue-500 mx-2">{opSymbol}</span>
          <FractionDisplay w={f2.whole} n={f2.numerator} d={f2.denominator} />
        </div>

        {/* Step 2: Improper Conversion (if mixed) */}
        {(f1.whole !== 0 || f2.whole !== 0) && (
          <div className="flex items-center flex-wrap gap-4 animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
             <span className="text-sm font-sans text-slate-500 uppercase w-full block">2. Convert to Improper Fractions</span>
             <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-100">
                <span className="text-gray-400 text-sm italic font-sans mr-2">Formula: (Whole × Denom + Num) / Denom</span>
                <FractionDisplay n={imp1.n} d={imp1.d} />
                <span className="text-2xl font-bold text-blue-500 mx-2">{opSymbol}</span>
                <FractionDisplay n={imp2.n} d={imp2.d} />
             </div>
          </div>
        )}

        {/* Step 3: Operation Specific Formula */}
        <div className="flex items-center flex-wrap gap-4 animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
          <span className="text-sm font-sans text-slate-500 uppercase w-full block">3. Apply Formula</span>
          
          {(op === 'add' || op === 'subtract') && (
            <div className="flex flex-col gap-2">
               <div className="flex items-center gap-2">
                 <span className="font-bold">LCM({imp1.d}, {imp2.d})</span>
                 <span>=</span>
                 <span className="text-blue-600 font-bold">{(imp1.d * imp2.d) / gcd(imp1.d, imp2.d)}</span> (Common Denominator)
               </div>
               <div className="flex items-center gap-2 mt-2">
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
                <div className="flex flex-col items-center">
                   <span className="border-b-2 border-black px-2">{imp1.n} × {imp2.n}</span>
                   <span>{imp1.d} × {imp2.d}</span>
                </div>
             </div>
          )}

          {op === 'divide' && (
             <div className="flex items-center gap-2">
                <span className="text-sm font-sans text-gray-500 mr-2">(Flip second fraction & multiply)</span>
                <FractionDisplay n={imp1.n} d={imp1.d} />
                <span className="text-xl font-bold text-blue-500 mx-1">×</span>
                <FractionDisplay n={imp2.d} d={imp2.n} />
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