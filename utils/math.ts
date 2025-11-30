import { FractionData, CalculationResult, OperationType } from '../types';

// Greatest Common Divisor
export const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};

// Least Common Multiple
export const lcm = (a: number, b: number): number => {
  if (a === 0 || b === 0) return 0;
  return Math.abs((a * b) / gcd(a, b));
};

// Convert Mixed to Improper
export const toImproper = (f: FractionData): { n: number; d: number } => {
  const n = (f.whole * f.denominator) + f.numerator;
  return { n, d: f.denominator };
};

// Convert Improper to Mixed
export const toMixed = (n: number, d: number): FractionData => {
  if (d === 0) return { whole: 0, numerator: 0, denominator: 0 }; // Avoid division by zero issues
  
  const whole = Math.floor(n / d);
  const remainder = n % d;
  
  // Simplify the remainder part
  const common = gcd(Math.abs(remainder), Math.abs(d));
  
  return {
    whole,
    numerator: remainder / common,
    denominator: d / common
  };
};

export const calculateFraction = (
  f1: FractionData, 
  f2: FractionData, 
  op: OperationType
): CalculationResult => {
  const imp1 = toImproper(f1);
  const imp2 = toImproper(f2);
  
  let resNum = 0;
  let resDen = 0;
  const steps: string[] = [];

  // Step 1: Conversion
  steps.push(`Convert mixed numbers to improper fractions.`);
  steps.push(`${f1.whole > 0 ? `${f1.whole} ` : ''}${f1.numerator}/${f1.denominator} becomes ${imp1.n}/${imp1.d}`);
  steps.push(`${f2.whole > 0 ? `${f2.whole} ` : ''}${f2.numerator}/${f2.denominator} becomes ${imp2.n}/${imp2.d}`);

  switch (op) {
    case 'add':
    case 'subtract':
      resDen = lcm(imp1.d, imp2.d);
      const m1 = resDen / imp1.d;
      const m2 = resDen / imp2.d;
      const adjN1 = imp1.n * m1;
      const adjN2 = imp2.n * m2;
      
      steps.push(`The Least Common Denominator (LCD) for ${imp1.d} and ${imp2.d} is ${resDen}.`);
      steps.push(`Adjust fractions to have the common denominator:`);
      steps.push(`${imp1.n}/${imp1.d} × ${m1}/${m1} = ${adjN1}/${resDen}`);
      steps.push(`${imp2.n}/${imp2.d} × ${m2}/${m2} = ${adjN2}/${resDen}`);
      
      if (op === 'add') {
        resNum = adjN1 + adjN2;
        steps.push(`Add the numerators: ${adjN1} + ${adjN2} = ${resNum}`);
        steps.push(`Result: ${resNum}/${resDen}`);
      } else {
        resNum = adjN1 - adjN2;
        steps.push(`Subtract the numerators: ${adjN1} - ${adjN2} = ${resNum}`);
        steps.push(`Result: ${resNum}/${resDen}`);
      }
      break;
      
    case 'multiply':
      resNum = imp1.n * imp2.n;
      resDen = imp1.d * imp2.d;
      steps.push(`Multiply the numerators together: ${imp1.n} × ${imp2.n} = ${resNum}`);
      steps.push(`Multiply the denominators together: ${imp1.d} × ${imp2.d} = ${resDen}`);
      steps.push(`Result: ${resNum}/${resDen}`);
      break;
      
    case 'divide':
      resNum = imp1.n * imp2.d;
      resDen = imp1.d * imp2.n;
      steps.push(`Invert the second fraction (find the reciprocal): ${imp2.n}/${imp2.d} becomes ${imp2.d}/${imp2.n}`);
      steps.push(`Multiply the first fraction by the reciprocal: ${imp1.n}/${imp1.d} × ${imp2.d}/${imp2.n}`);
      steps.push(`Numerator: ${imp1.n} × ${imp2.d} = ${resNum}`);
      steps.push(`Denominator: ${imp1.d} × ${imp2.n} = ${resDen}`);
      steps.push(`Result: ${resNum}/${resDen}`);
      break;
  }

  // Final simplify
  const common = gcd(Math.abs(resNum), Math.abs(resDen));
  const simpNum = resNum / common;
  const simpDen = resDen / common;
  
  if (common > 1) {
    steps.push(`Simplify the fraction by dividing top and bottom by the GCD (${common}).`);
    steps.push(`${resNum} ÷ ${common} = ${simpNum}`);
    steps.push(`${resDen} ÷ ${common} = ${simpDen}`);
    steps.push(`Simplified Improper Fraction: ${simpNum}/${simpDen}`);
  } else {
    steps.push(`The fraction ${resNum}/${resDen} is already in simplest form.`);
  }

  const finalMixed = toMixed(simpNum, simpDen);
  if (finalMixed.whole !== 0) {
      steps.push(`Convert improper fraction ${simpNum}/${simpDen} back to mixed number: ${finalMixed.whole} ${finalMixed.numerator}/${finalMixed.denominator}`);
  }

  const decimalVal = resDen === 0 ? 0 : resNum / resDen;

  return {
    fraction: finalMixed,
    improper: { numerator: simpNum, denominator: simpDen },
    decimal: parseFloat(decimalVal.toFixed(4)),
    percentage: parseFloat((decimalVal * 100).toFixed(2)),
    steps,
    originalInputs: { f1: { ...f1 }, f2: { ...f2 }, op }
  };
};