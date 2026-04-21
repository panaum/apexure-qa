export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  lineHeight?: number;
  fills?: Array<{
    type: string;
    color: { r: number; g: number; b: number; a: number };
  }>;
}

export interface FigmaPayload {
  fileKey: string;
  pageName: string;
  nodes: FigmaNode[];
}

export interface Mismatch {
  nodeId: string;
  nodeName: string;
  property: string;
  figmaValue: string;
  liveValue: string;
  status: 'fail' | 'warn' | 'pass';
}

export interface CompareResult {
  pageName: string;
  url: string;
  checkedAt: string;
  total: number;
  passed: number;
  failed: number;
  warned: number;
  mismatches: Mismatch[];
}
