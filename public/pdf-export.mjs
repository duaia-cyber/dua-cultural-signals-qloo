import { createOutline, describeExploration } from './workflow.mjs';

const COLOURS = { ink: [19, 20, 25], paper: [247, 246, 242], blue: [38, 75, 193], muted: [93, 98, 111], first: [126, 143, 174], second: [202, 209, 221], white: [255, 255, 255] };

export function chartRows(brief, mode) {
  if (mode !== 'bridge') return [
    { label: 'Artists', values: [brief.artists.length] },
    { label: 'Films', values: [brief.films.length] },
  ];
  return ['artists', 'films'].map(key => ({
    label: key === 'artists' ? 'Artists' : 'Films',
    values: [brief[key].common.length, brief[key].onlyA.length, brief[key].onlyB.length],
  }));
}

function bytesToBase64(bytes) {
  let value = '';
  for (let i = 0; i < bytes.length; i += 8192) value += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(value);
}

// The renderer is shared by the browser export and isolated PDF tests.
export function createPdfDocument({ jsPDF, regularFont, boldFont, brief, mode, selected = [], note = '' }) {
  if (!brief) throw new Error('Build a research brief first.');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  doc.addFileToVFS('NotoSans-Regular.ttf', bytesToBase64(regularFont));
  doc.addFileToVFS('NotoSans-Bold.ttf', bytesToBase64(boldFont));
  doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
  doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
  doc.setProperties({ title: 'DUA Cultural Signals — Research Brief', subject: 'Cultural research based on Qloo samples', creator: 'DUA Cultural Signals' });

  const width = 210, height = 297, margin = 18, contentWidth = width - 2 * margin;
  const ref = mode === 'bridge' ? brief.references.join(' × ') : brief.reference;
  const goal = { showcase: 'Live showcase', campaign: 'Cultural campaign', collaboration: 'Creative collaboration' }[brief.goal] || 'Creative project';
  let y = 0;
  function font(style, size, color) { doc.setFont('NotoSans', style); doc.setFontSize(size); doc.setTextColor(...color); }
  function page(first = false) {
    if (!first) doc.addPage();
    doc.setFillColor(...COLOURS.paper); doc.rect(0, 0, width, height, 'F');
    doc.setFillColor(...COLOURS.ink);
    if (first) {
      font('bold', 12, COLOURS.white);
      const refs = doc.splitTextToSize(ref, contentWidth);
      const headerHeight = Math.max(51, 39 + refs.length * 6);
      doc.rect(0, 0, width, headerHeight, 'F');
      doc.setFillColor(...COLOURS.blue); doc.rect(margin, 13, 2, 6, 'F');
      font('bold', 8, [186, 196, 225]); doc.text('DUA  /  CULTURAL SIGNALS', margin + 6, 18);
      font('bold', 21, COLOURS.white); doc.text('Cultural Research Brief', margin, 30);
      font('normal', 11, [222, 225, 234]); doc.text(refs, margin, 39, { lineHeightFactor: 1.35 });
      y = headerHeight + 13;
    } else {
      doc.rect(0, 0, width, 17, 'F');
      font('bold', 8, [211, 218, 235]); doc.text('DUA  /  CULTURAL SIGNALS', margin, 11);
      font('normal', 8, [211, 218, 235]); doc.text('RESEARCH BRIEF', width - margin, 11, { align: 'right' });
      y = 27;
    }
  }
  function ensure(amount) { if (y + amount > height - 22) page(); }
  function heading(label) {
    ensure(18);
    font('bold', 8, COLOURS.blue); doc.text(label.toUpperCase(), margin, y);
    doc.setDrawColor(214, 216, 220); doc.line(margin, y + 3, width - margin, y + 3);
    y += 10;
  }
  function paragraph(text, { bold = false, color = COLOURS.ink, size = 10, indent = 0, gap = 3 } = {}) {
    font(bold ? 'bold' : 'normal', size, color);
    const lines = doc.splitTextToSize(String(text), contentWidth - indent);
    const lineHeight = size * 0.44;
    for (const line of lines) {
      ensure(lineHeight + 1); font(bold ? 'bold' : 'normal', size, color);
      doc.text(line, margin + indent, y); y += lineHeight;
    }
    y += gap;
  }
  page(true);
  font('bold', 9, COLOURS.blue); doc.text('PROJECT FOCUS', margin, y);
  font('normal', 10, COLOURS.ink); doc.text(goal, margin + 37, y); y += 14;

  const rows = chartRows(brief, mode);
  const maximum = Math.max(1, ...rows.map(row => row.values.reduce((sum, n) => sum + n, 0)));
  font('normal', 8, COLOURS.muted);
  const identities = mode === 'bridge' ? doc.splitTextToSize(`First: ${brief.references[0]}   ·   Second: ${brief.references[1]}`, contentWidth - 12) : [];
  const identitiesHeight = identities.length * 4;
  const cardHeight = 69 + identitiesHeight;
  ensure(cardHeight + 8);
  doc.setFillColor(...COLOURS.white); doc.roundedRect(margin, y, contentWidth, cardHeight, 3, 3, 'F');
  font('bold', 8, COLOURS.blue); doc.text('QLOO  /  RETURNED SAMPLE', margin + 6, y + 8);
  font('normal', 8, COLOURS.muted); doc.text('Counts of references, not audiences or demand.', margin + 6, y + 14);
  if (identities.length) doc.text(identities, margin + 6, y + 19, { lineHeightFactor: 1.35 });
  rows.forEach((row, index) => {
    const top = y + 22 + identitiesHeight + index * 23;
    font('bold', 9, COLOURS.ink); doc.text(row.label.toUpperCase(), margin + 6, top);
    const barX = margin + 41, barY = top - 3.7, barWidth = 119;
    doc.setFillColor(237, 239, 243); doc.roundedRect(barX, barY, barWidth, 4.5, 1.3, 1.3, 'F');
    let offset = 0;
    row.values.forEach((count, part) => {
      const segment = barWidth * count / maximum;
      if (segment > 0) { doc.setFillColor(...[COLOURS.blue, COLOURS.first, COLOURS.second][part]); doc.rect(barX + offset, barY, segment, 4.5, 'F'); }
      offset += segment;
    });
    font('normal', 8, COLOURS.muted);
    const label = mode === 'bridge' ? `Shared ${row.values[0]}  /  First only ${row.values[1]}  /  Second only ${row.values[2]}` : `Returned ${row.values[0]}`;
    doc.text(label, barX, top + 8);
  });
  y += cardHeight + 14;

  if (note.trim()) { heading('Project note'); paragraph(note.trim()); }
  heading('Curated references');
  if (!selected.length) paragraph('No references selected yet.');
  selected.forEach((item, index) => {
    paragraph(String(index + 1).padStart(2, '0') + '  ' + item.name, { bold: true, gap: 1 });
    paragraph(item.category + '  ·  ' + item.provenance, { size: 8, color: COLOURS.muted, indent: 6, gap: 5 });
  });
  heading('Working outline');
  createOutline(brief, mode, selected).forEach((line, index) => paragraph((index + 1) + '.  ' + line));
  // Keep the evidence heading and its first paragraphs together when the page is nearly full.
  ensure(48);
  heading('Evidence and method');
  if (mode === 'bridge') {
    const direct = brief.artists.direct.length ? brief.artists.direct.map(link => `Qloo’s artist sample for ${link.from} includes ${link.to}.`).join(' ') : 'Neither reference appeared in the other artist’s returned sample.';
    paragraph(direct);
    paragraph(describeExploration(brief), { size: 9, color: COLOURS.muted });
    paragraph(brief.method, { size: 9, color: COLOURS.muted });
  } else paragraph(brief.source, { size: 9, color: COLOURS.muted });
  heading('Human review');
  brief.actions.forEach((line, index) => paragraph((index + 1) + '.  ' + line, { size: 9 }));
  paragraph('Research references do not establish rights, artist availability, relationships or audience demand.', { size: 9, color: COLOURS.muted });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setDrawColor(214, 216, 220); doc.line(margin, height - 16, width - margin, height - 16);
    font('normal', 7, COLOURS.muted); doc.text('DUA  /  CULTURAL SIGNALS   ·   QLOO RESEARCH', margin, height - 10);
    doc.text(`${i} / ${pages}`, width - margin, height - 10, { align: 'right' });
  }
  return doc;
}

let libraryPromise;
function loadLibrary() {
  if (globalThis.jspdf?.jsPDF) return Promise.resolve(globalThis.jspdf.jsPDF);
  if (!libraryPromise) libraryPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = '/vendor/jspdf.umd.min.js';
    script.onload = () => globalThis.jspdf?.jsPDF ? resolve(globalThis.jspdf.jsPDF) : reject(new Error('PDF library unavailable.'));
    script.onerror = () => { libraryPromise = null; reject(new Error('PDF library could not be loaded.')); };
    document.head.append(script);
  });
  return libraryPromise;
}

export async function downloadBriefPdf(options) {
  const [jsPDF, regular, bold] = await Promise.all([
    loadLibrary(),
    fetch('/vendor/fonts/NotoSans-Regular.ttf').then(response => { if (!response.ok) throw new Error('PDF font unavailable.'); return response.arrayBuffer(); }),
    fetch('/vendor/fonts/NotoSans-Bold.ttf').then(response => { if (!response.ok) throw new Error('PDF font unavailable.'); return response.arrayBuffer(); }),
  ]);
  createPdfDocument({ ...options, jsPDF, regularFont: new Uint8Array(regular), boldFont: new Uint8Array(bold) }).save('DUA-Cultural-Brief.pdf');
}
