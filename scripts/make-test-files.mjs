// Generates fixtures for exercising the case scanner end to end:
//   <tmp>/vidhi-fixtures/test-page.png - a page-like image (no OCR text, as with a real photo)
//   <tmp>/vidhi-fixtures/test-case.pdf - a one-page text PDF with a valid xref table
// Run: node scripts/make-test-files.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const outDir = join(tmpdir(), "vidhi-fixtures");
mkdirSync(outDir, { recursive: true });
const pngPath = join(outDir, "test-page.png");
const pdfPath = join(outDir, "test-case.pdf");

const W = 600;
const H = 800;
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y += 1) {
  const row = y * (W * 3 + 1);
  raw[row] = 0;
  for (let x = 0; x < W; x += 1) {
    const p = row + 1 + x * 3;
    const edge = x < 24 || x > W - 25 || y < 24 || y > H - 25;
    const bar = y > 80 && y < 96 && x > 60 && x < W - 60;
    const line = y > 160 && y < 172 && x > 60 && x < W - 120;
    const v = edge || bar || line ? 30 : 248;
    raw[p] = v;
    raw[p + 1] = edge ? 40 : v;
    raw[p + 2] = edge ? 40 : 245;
  }
}

const crcTable = [];
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  let crc = 0xffffffff;
  for (const b of body) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  crc = (crc ^ 0xffffffff) >>> 0;
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc);
  return Buffer.concat([len, body, crcBuf]);
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;
ihdr[9] = 2;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw)),
  chunk("IEND", Buffer.alloc(0)),
]);
writeFileSync(pngPath, png);

const lines = [
  "IN THE SUPREME COURT OF INDIA",
  "CIVIL APPELLATE JURISDICTION",
  "WRIT PETITION (CIVIL) NO. 135 OF 1970",
  "",
  "Kesavananda Bharati Sripadagalvaru v. State of Kerala",
  "",
  "Decided on: 24 April 1973",
  "Citation: (1973) 4 SCC 225",
  "",
  "The petitioner, the head of the Edneer Mutt, challenged the Kerala",
  "Land Reforms Act, 1963. A 13-judge Constitution Bench held by 7:6",
  "that Parliament cannot amend the Constitution so as to damage its",
  "basic structure. Golaknath was overruled in part.",
  "",
  "Relevant provisions: Article 368, Article 31, Article 19(1)(f).",
];

const esc = (s) => s.split("\\").join("\\\\").split("(").join("\\(").split(")").join("\\)");
const stream = `BT /F1 11 Tf 72 740 Td 16 TL\n${lines.map((l) => `(${esc(l)}) Tj T*`).join("\n")}\nET`;
const objs = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
];

let pdf = "%PDF-1.4\n";
const offsets = [0];
objs.forEach((body, i) => {
  offsets.push(Buffer.byteLength(pdf));
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
});
const xrefStart = Buffer.byteLength(pdf);
pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
for (let i = 1; i <= objs.length; i += 1) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
writeFileSync(pdfPath, pdf);

console.log(pngPath, png.length, "bytes");
console.log(pdfPath, Buffer.byteLength(pdf), "bytes");
