import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { jsPDF } from 'jspdf';
import { chartRows, createPdfDocument } from '../public/pdf-export.mjs';

const regularFont = await readFile(new URL('../public/vendor/fonts/NotoSans-Regular.ttf', import.meta.url));
const boldFont = await readFile(new URL('../public/vendor/fonts/NotoSans-Bold.ttf', import.meta.url));
const bridge = {
  references: ['Cesária Évora', 'Ibrahim Ferrer'], goal: 'showcase', method: 'Limited Qloo samples.', actions: ['Check rights.', 'Discuss context.'],
  artists: { direct: [{ from: 'Cesária Évora', to: 'Ibrahim Ferrer' }], common: [{ name: 'Compay Segundo' }, { name: 'Omara Portuondo' }], onlyA: [{ name: 'First' }], onlyB: [{ name: 'Second' }, { name: 'Third' }] },
  films: { common: [], onlyA: [{ name: 'Film A' }], onlyB: [{ name: 'Film B' }] },
  exploration: { status: 'not_needed', attempts: [] },
};

test('PDF charts use only the returned common and source-specific counts', () => {
  assert.deepEqual(chartRows(bridge, 'bridge'), [
    { label: 'Artists', values: [2, 1, 2] },
    { label: 'Films', values: [0, 1, 1] },
  ]);
  assert.deepEqual(chartRows({ artists: [{}, {}], films: [] }, 'single'), [
    { label: 'Artists', values: [2] }, { label: 'Films', values: [0] },
  ]);
});

test('PDF generation supports accented names, user notes and true multipage output', () => {
  const selected = Array.from({ length: 22 }, (_, i) => ({ name: `Referência ${i + 1}`, category: 'artists', provenance: 'Returned for both', scope: 'common' }));
  const doc = createPdfDocument({ jsPDF, regularFont, boldFont, brief: bridge, mode: 'bridge', selected, note: 'Encontro de música e criação em Lisboa.' });
  const bytes = new Uint8Array(doc.output('arraybuffer'));
  assert.equal(Buffer.from(bytes.subarray(0, 5)).toString(), '%PDF-');
  assert.ok(bytes.length > 10000);
  assert.ok(doc.getNumberOfPages() >= 2);
});

test('PDF can be generated for a single reference and an empty selection', () => {
  const brief = { reference: 'Artista', goal: 'campaign', source: 'Qloo sample.', actions: ['Review rights.'], artists: [], films: [] };
  const doc = createPdfDocument({ jsPDF, regularFont, boldFont, brief, mode: 'single', selected: [], note: '' });
  assert.ok(doc.getNumberOfPages() >= 1);
  assert.throws(() => createPdfDocument({ jsPDF, regularFont, boldFont, brief: null, mode: 'single', selected: [], note: '' }), /Build a research brief first/);
});
