import { planPantryUpdate } from '@/shared/shopping/pantryUpdate';
import { findPublicationBlockers, parseDocument, parseInline, renderBlocksHtml, safeHref } from '@/shared/legal/markdownLite';

describe('Finish Shopping → Pantry Update (additive, reviewable)', () => {
  const pantry = [
    { id: 'p-milk', name: 'Milk', quantity: 1, unit: 'l' },
    { id: 'p-eggs', name: 'Eggs', quantity: 2, unit: 'unit' },
    { id: 'p-flour1', name: 'Plain flour', quantity: 1, unit: 'kg' },
    { id: 'p-flour2', name: 'Plain flour', quantity: 500, unit: 'g' },
    { id: 'p-beans', name: 'Beans', quantity: 2, unit: 'tin' },
  ];

  it('auto-updates only unambiguous, comparable matches; never decreases or deletes', () => {
    const plan = planPantryUpdate(
      [
        { listItemId: 'l1', name: 'Milk', outcome: 'collected', quantity: 2, unit: 'pints' },
        { listItemId: 'l2', name: 'milk', outcome: 'collected', quantity: 500, unit: 'ml' },
        { listItemId: 'l3', name: 'Eggs', outcome: 'collected', quantity: 1, unit: 'dozen' },
        { listItemId: 'l4', name: 'Bananas', outcome: 'collected', quantity: 6, unit: 'unit' },
        { listItemId: 'l5', name: 'Plain flour', outcome: 'collected', quantity: 1, unit: 'kg' },
        { listItemId: 'l6', name: 'Bread', outcome: 'unavailable', quantity: 1, unit: 'unit' },
        { listItemId: 'l7', name: 'Beans', outcome: 'collected', quantity: 1, unit: 'jar' },
        { listItemId: 'l8', name: 'Butter', outcome: 'substituted', substituteName: 'Spread', quantity: 1, unit: 'unit' },
      ],
      pantry
    );
    expect(plan.automatic).toEqual([
      expect.objectContaining({ kind: 'increase', pantryItemId: 'p-milk', to: { amount: 1.5, unit: 'l' }, sourceLineId: 'l2' }),
      expect.objectContaining({ kind: 'increase', pantryItemId: 'p-eggs', from: { amount: 2, unit: 'unit' }, to: { amount: 14, unit: 'unit' } }),
      expect.objectContaining({ kind: 'add', name: 'Bananas', quantity: { amount: 6, unit: 'unit' } }),
    ]);
    const reviewIds = plan.review.map((p) => p.sourceLineId);
    expect(reviewIds).toEqual(['l1', 'l5', 'l7', 'l8']); // unknown unit, duplicate pantry match, tin vs jar, substitution
    expect(plan.ignored).toEqual([{ lineId: 'l6', reason: 'Not available in store' }]);
    for (const p of [...plan.automatic, ...plan.review]) expect(['increase', 'add']).toContain(p.kind);
  });
});

describe('legal markdown (website + in-app share one parser)', () => {
  const doc = `---
title: Test Policy
version: 0.1.0-draft
effective: "[OWNER TO CONFIRM: date]"
---

# Heading

Intro with **bold**, *italic*, \`code\` and a [link](https://example.org).

| A | B |
|---|---|
| 1 | x \\| y |

1. First
   - nested a
   - nested b

   More text.
2. Second

> **Draft** note [PENDING IMPLEMENTATION: L2-06]

<script>alert(1)</script>
`;

  it('parses front matter, headings, tables, nested lists and blockquotes', () => {
    const parsed = parseDocument(doc);
    expect(parsed.frontMatter).toEqual({ title: 'Test Policy', version: '0.1.0-draft', effective: '[OWNER TO CONFIRM: date]' });
    expect(parsed.blocks.map((b) => b.type)).toEqual(['heading', 'paragraph', 'table', 'list', 'blockquote', 'paragraph']);
    const list = parsed.blocks[3];
    if (list.type !== 'list') throw new Error();
    expect(list.ordered).toBe(true);
    expect(list.items).toHaveLength(2);
    expect(list.items[0].children.map((b) => b.type)).toEqual(['list', 'paragraph']);
    const table = parsed.blocks[2];
    if (table.type !== 'table') throw new Error();
    expect(table.rows[0][1]).toEqual([{ type: 'text', text: 'x | y' }]);
  });

  it('escapes HTML and only renders safe links', () => {
    const html = renderBlocksHtml(parseDocument(doc).blocks);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('<a href="https://example.org">link</a>');
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(parseInline('[x](javascript:alert(1))')).toEqual([{ type: 'link', href: 'javascript:alert(1', children: [{ type: 'text', text: 'x' }] }, { type: 'text', text: ')' }]);
    expect(renderBlocksHtml(parseDocument('[x](javascript:alert(1))').blocks)).not.toContain('href');
  });

  it('finds publication-blocking markers with line numbers', () => {
    const found = findPublicationBlockers(doc);
    expect(found.map((f) => f.marker)).toEqual(['[OWNER TO CONFIRM', '[PENDING IMPLEMENTATION']);
    expect(found[1].line).toBe(22);
  });
});
