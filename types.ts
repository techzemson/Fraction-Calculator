export interface FractionData {
  whole: number;
  numerator: number;
  denominator: number;
}

export type OperationType = 'add' | 'subtract' | 'multiply' | 'divide';

export interface CalculationResult {
  fraction: FractionData; // The simplified mixed fraction result
  improper: { numerator: number; denominator: number };
  decimal: number;
  percentage: number;
  steps: string[];
  originalInputs: { f1: FractionData; f2: FractionData; op: OperationType };
}

export interface VisualizationData {
  name: string;
  value: number;
  fill: string;
}

export interface AIExplanation {
  simpleExplanation: string;
  realWorldScenario: string;
}

export interface HistoryItem {
  id: string;
  f1: FractionData;
  f2: FractionData;
  op: OperationType;
  result: string; // Brief result string e.g., "1 1/2"
  timestamp: number;
}