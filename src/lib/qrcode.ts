// Dependency-free QR Code encoder (byte mode), verified scannable.
// Supports versions 1-10 and EC levels L/M/Q/H. Returns a module matrix or an SVG string.
// Used to render real, scannable UPI payment QR codes.

type ECLevel = 'L' | 'M' | 'Q' | 'H';

// ---- Galois field GF(256) ----
const EXP: number[] = new Array(512);
const LOG: number[] = new Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
function gmul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function rsGenPoly(deg: number): number[] {
  let poly: number[] = [1];
  for (let i = 0; i < deg; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gmul(poly[j], EXP[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly.reverse(); // leading coefficient first
}

function reedSolomon(data: number[], ecLen: number): number[] {
  const gen = rsGenPoly(ecLen);
  const res = data.concat(new Array(ecLen).fill(0));
  for (let i = 0; i < data.length; i++) {
    const coef = res[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) res[i + j] ^= gmul(gen[j], coef);
    }
  }
  return res.slice(data.length);
}

type BlockSpec = Array<[number, number]>; // [numBlocks, dataCodewordsPerBlock]
type ECEntry = [number, BlockSpec];       // [ecCodewordsPerBlock, blocks]

const EC_TABLE: Record<number, Record<ECLevel, ECEntry>> = {
  1:  { L: [7, [[1, 19]]],          M: [10, [[1, 16]]],          Q: [13, [[1, 13]]],          H: [17, [[1, 9]]] },
  2:  { L: [10, [[1, 34]]],         M: [16, [[1, 28]]],          Q: [22, [[1, 22]]],          H: [28, [[1, 16]]] },
  3:  { L: [15, [[1, 55]]],         M: [26, [[1, 44]]],          Q: [18, [[2, 17]]],          H: [22, [[2, 13]]] },
  4:  { L: [20, [[1, 80]]],         M: [18, [[2, 32]]],          Q: [26, [[2, 24]]],          H: [16, [[4, 9]]] },
  5:  { L: [26, [[1, 108]]],        M: [24, [[2, 43]]],          Q: [18, [[2, 15], [2, 16]]], H: [22, [[2, 11], [2, 12]]] },
  6:  { L: [18, [[2, 68]]],         M: [16, [[4, 27]]],          Q: [24, [[4, 19]]],          H: [28, [[4, 15]]] },
  7:  { L: [20, [[2, 78]]],         M: [18, [[4, 31]]],          Q: [18, [[2, 14], [4, 15]]], H: [26, [[4, 13], [1, 14]]] },
  8:  { L: [24, [[2, 97]]],         M: [22, [[2, 38], [2, 39]]], Q: [22, [[4, 18], [2, 19]]], H: [26, [[4, 14], [2, 15]]] },
  9:  { L: [30, [[2, 116]]],        M: [22, [[3, 36], [2, 37]]], Q: [20, [[4, 16], [4, 17]]], H: [24, [[4, 12], [4, 13]]] },
  10: { L: [18, [[2, 68], [2, 69]]], M: [26, [[4, 43], [1, 44]]], Q: [24, [[6, 19], [2, 20]]], H: [28, [[6, 15], [2, 16]]] },
};

const ALIGN: Record<number, number[]> = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
  7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
};
const REMAINDER: Record<number, number> = { 1: 0, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 0, 8: 0, 9: 0, 10: 0 };
const VERSION_INFO: Record<number, number> = { 7: 0x07c94, 8: 0x085bc, 9: 0x09a99, 10: 0x0a4d3 };
const EC_FORMAT_BITS: Record<ECLevel, number> = { L: 0b01, M: 0b00, Q: 0b11, H: 0b10 };

function totalDataCodewords(version: number, level: ECLevel): number {
  const [, blocks] = EC_TABLE[version][level];
  let n = 0;
  for (const [cnt, cw] of blocks) n += cnt * cw;
  return n;
}

function chooseVersion(byteLen: number, level: ECLevel): number {
  for (let v = 1; v <= 10; v++) {
    const cap = totalDataCodewords(v, level);
    const ccBits = v <= 9 ? 8 : 16;
    const needBits = 4 + ccBits + byteLen * 8;
    if (needBits <= cap * 8) return v;
  }
  throw new Error('QR data too large for supported versions (<=10)');
}

function buildDataCodewords(bytes: number[], version: number, level: ECLevel): number[] {
  const cap = totalDataCodewords(version, level);
  const ccBits = version <= 9 ? 8 : 16;
  const bits: number[] = [];
  const push = (val: number, len: number) => { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  push(0b0100, 4);
  push(bytes.length, ccBits);
  for (const b of bytes) push(b, 8);
  const capBits = cap * 8;
  for (let i = 0; i < 4 && bits.length < capBits; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);
  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    codewords.push(b);
  }
  const pads = [0xec, 0x11];
  let pi = 0;
  while (codewords.length < cap) { codewords.push(pads[pi % 2]); pi++; }
  return codewords;
}

function interleave(dataCodewords: number[], version: number, level: ECLevel): number[] {
  const [ecLen, blockSpec] = EC_TABLE[version][level];
  const blocks: Array<{ data: number[]; ec: number[] }> = [];
  let idx = 0;
  for (const [cnt, cw] of blockSpec) {
    for (let b = 0; b < cnt; b++) {
      const data = dataCodewords.slice(idx, idx + cw);
      idx += cw;
      blocks.push({ data, ec: reedSolomon(data, ecLen) });
    }
  }
  const maxData = Math.max(...blocks.map((b) => b.data.length));
  const result: number[] = [];
  for (let i = 0; i < maxData; i++) for (const blk of blocks) if (i < blk.data.length) result.push(blk.data[i]);
  for (let i = 0; i < ecLen; i++) for (const blk of blocks) result.push(blk.ec[i]);
  return result;
}

type Cell = boolean | null;

function createMatrix(version: number) {
  const size = 17 + version * 4;
  const m: Cell[][] = Array.from({ length: size }, () => new Array(size).fill(null));
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const setF = (r: number, c: number, v: boolean) => { m[r][c] = v; reserved[r][c] = true; };

  function finder(r: number, c: number) {
    for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) {
      const rr = r + i, cc = c + j;
      if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
      const inRing = i >= 0 && i <= 6 && j >= 0 && j <= 6;
      let dark = false;
      if (inRing) {
        const edge = i === 0 || i === 6 || j === 0 || j === 6;
        const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        dark = edge || core;
      }
      setF(rr, cc, dark);
    }
  }
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    const v = i % 2 === 0;
    if (!reserved[6][i]) setF(6, i, v);
    if (!reserved[i][6]) setF(i, 6, v);
  }

  const centers = ALIGN[version];
  for (const r of centers) for (const c of centers) {
    if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6)) continue;
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
      const ring = Math.max(Math.abs(i), Math.abs(j));
      setF(r + i, c + j, ring === 0 || ring === 2);
    }
  }

  setF(size - 8, 8, true);

  for (let i = 0; i <= 8; i++) {
    if (i !== 6) { reserved[8][i] = true; reserved[i][8] = true; }
  }
  for (let i = 0; i < 8; i++) { reserved[8][size - 1 - i] = true; reserved[size - 1 - i][8] = true; }
  reserved[8][8] = true;

  if (version >= 7) {
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
      reserved[i][size - 11 + j] = true;
      reserved[size - 11 + j][i] = true;
    }
  }
  return { m, reserved, size };
}

function placeData(m: Cell[][], reserved: boolean[][], size: number, bits: number[]) {
  let bitIdx = 0;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let n = 0; n < size; n++) {
      const row = upward ? size - 1 - n : n;
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (reserved[row][cc]) continue;
        let bit = 0;
        if (bitIdx < bits.length) { bit = bits[bitIdx]; bitIdx++; }
        m[row][cc] = bit === 1;
      }
    }
    upward = !upward;
  }
}

function maskFn(id: number, r: number, c: number): boolean {
  switch (id) {
    case 0: return (r + c) % 2 === 0;
    case 1: return r % 2 === 0;
    case 2: return c % 3 === 0;
    case 3: return (r + c) % 3 === 0;
    case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    default: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
  }
}

function applyMask(m: Cell[][], reserved: boolean[][], size: number, id: number): Cell[][] {
  const out = m.map((row) => row.slice());
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (!reserved[r][c] && maskFn(id, r, c)) out[r][c] = !out[r][c];
  }
  return out;
}

function penalty(m: Cell[][], size: number): number {
  let score = 0;
  for (let r = 0; r < size; r++) {
    let run = 1;
    for (let c = 1; c < size; c++) {
      if (m[r][c] === m[r][c - 1]) { run++; if (run === 5) score += 3; else if (run > 5) score++; } else run = 1;
    }
  }
  for (let c = 0; c < size; c++) {
    let run = 1;
    for (let r = 1; r < size; r++) {
      if (m[r][c] === m[r - 1][c]) { run++; if (run === 5) score += 3; else if (run > 5) score++; } else run = 1;
    }
  }
  for (let r = 0; r < size - 1; r++) for (let c = 0; c < size - 1; c++) {
    const v = m[r][c];
    if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3;
  }
  const pat1 = [true, false, true, true, true, false, true, false, false, false, false];
  const pat2 = [false, false, false, false, true, false, true, true, true, false, true];
  const check = (arr: Cell[]) => {
    for (let i = 0; i + 11 <= arr.length; i++) {
      let m1 = true, m2 = true;
      for (let k = 0; k < 11; k++) { if (arr[i + k] !== pat1[k]) m1 = false; if (arr[i + k] !== pat2[k]) m2 = false; }
      if (m1 || m2) score += 40;
    }
  };
  for (let r = 0; r < size; r++) check(m[r]);
  for (let c = 0; c < size; c++) { const col: Cell[] = []; for (let r = 0; r < size; r++) col.push(m[r][c]); check(col); }
  let dark = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (m[r][c]) dark++;
  const pct = (dark * 100) / (size * size);
  const prev = Math.floor(pct / 5) * 5;
  score += (Math.min(Math.abs(prev - 50), Math.abs(prev + 5 - 50)) / 5) * 10;
  return score;
}

function formatBits(level: ECLevel, maskId: number): number[] {
  const data = (EC_FORMAT_BITS[level] << 3) | maskId;
  let rem = data << 10;
  const g = 0x537;
  for (let i = 14; i >= 10; i--) if ((rem >> i) & 1) rem ^= g << (i - 10);
  const bits = ((data << 10) | rem) ^ 0x5412;
  const arr: number[] = [];
  for (let i = 0; i <= 14; i++) arr.push((bits >> i) & 1);
  return arr;
}

function placeFormat(m: Cell[][], size: number, level: ECLevel, maskId: number) {
  const bits = formatBits(level, maskId);
  const bit = (k: number) => bits[k] === 1;
  for (let i = 0; i <= 5; i++) m[i][8] = bit(i);
  m[7][8] = bit(6);
  m[8][8] = bit(7);
  m[8][7] = bit(8);
  for (let i = 9; i <= 14; i++) m[8][14 - i] = bit(i);
  for (let i = 0; i <= 7; i++) m[8][size - 1 - i] = bit(i);
  for (let i = 8; i <= 14; i++) m[size - 15 + i][8] = bit(i);
  m[size - 8][8] = true;
}

function placeVersion(m: Cell[][], size: number, version: number) {
  if (version < 7) return;
  const info = VERSION_INFO[version];
  for (let i = 0; i < 18; i++) {
    const b = ((info >> i) & 1) === 1;
    const a = size - 11 + (i % 3);
    const d = Math.floor(i / 3);
    m[d][a] = b;
    m[a][d] = b;
  }
}

function utf8Bytes(text: string): number[] {
  if (typeof TextEncoder !== 'undefined') return Array.from(new TextEncoder().encode(text));
  // Fallback
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) {
    let code = text.charCodeAt(i);
    if (code < 0x80) out.push(code);
    else if (code < 0x800) { out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f)); }
    else { out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f)); }
  }
  return out;
}

export function generateMatrix(text: string, level: ECLevel = 'M') {
  const bytes = utf8Bytes(text);
  const version = chooseVersion(bytes.length, level);
  const dataCw = buildDataCodewords(bytes, version, level);
  const finalCw = interleave(dataCw, version, level);
  const bits: number[] = [];
  for (const b of finalCw) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  for (let i = 0; i < REMAINDER[version]; i++) bits.push(0);

  const { m, reserved, size } = createMatrix(version);
  placeData(m, reserved, size, bits);

  let best: Cell[][] | null = null;
  let bestScore = Infinity;
  let bestMask = 0;
  for (let id = 0; id < 8; id++) {
    const masked = applyMask(m, reserved, size, id);
    const test = masked.map((r) => r.slice());
    placeFormat(test, size, level, id);
    const s = penalty(test, size);
    if (s < bestScore) { bestScore = s; best = masked; bestMask = id; }
  }
  const finalMatrix = best as Cell[][];
  placeFormat(finalMatrix, size, level, bestMask);
  placeVersion(finalMatrix, size, version);
  const matrix: boolean[][] = finalMatrix.map((row) => row.map((v) => v === true));
  return { matrix, size, version, mask: bestMask };
}

export interface QrSvgOptions {
  level?: ECLevel;
  size?: number;
  margin?: number;
  dark?: string;
  light?: string;
}

export function toSVG(text: string, opts: QrSvgOptions = {}): string {
  const { level = 'M', size = 256, margin = 4, dark = '#000000', light = '#ffffff' } = opts;
  const { matrix, size: n } = generateMatrix(text, level);
  const total = n + margin * 2;
  const cell = size / total;
  let rects = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (matrix[r][c]) {
      const x = (c + margin) * cell;
      const y = (r + margin) * cell;
      rects += `<rect x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${cell.toFixed(3)}" height="${cell.toFixed(3)}" fill="${dark}"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${light}"/>${rects}</svg>`;
}

export interface UpiParams {
  pa: string;   // payee VPA / UPI id
  pn?: string;  // payee name
  am?: string | number; // amount
  cu?: string;  // currency (default INR)
  tn?: string;  // transaction note
}

// Builds a standard UPI deep-link that any UPI app (GPay, PhonePe, Paytm, BHIM) can scan.
export function upiUri({ pa, pn, am, cu = 'INR', tn }: UpiParams): string {
  const params: string[] = [`pa=${encodeURIComponent(pa)}`];
  if (pn) params.push(`pn=${encodeURIComponent(pn)}`);
  if (am !== undefined && am !== null && `${am}` !== '') params.push(`am=${encodeURIComponent(String(am))}`);
  if (cu) params.push(`cu=${encodeURIComponent(cu)}`);
  if (tn) params.push(`tn=${encodeURIComponent(tn)}`);
  return `upi://pay?${params.join('&')}`;
}
