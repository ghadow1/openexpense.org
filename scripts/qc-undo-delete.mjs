/**
 * Quality check: delete-undo snapshot is a deep clone (memory only).
 * Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { captureUndoSlice, hasDeleteUndo } from '../src/features/undo-delete.js';

test('undo snapshot clones events so later edits cannot rewrite it', () => {
    const state = {
        events: {
            '2026-08-17': [{ title: 'Coffee', price: 5, paid: true }]
        },
        ledgerName: 'QC household',
        selectedKey: '2026-08-17',
        editingIndex: 0
    };
    const snap = captureUndoSlice(state);
    state.events['2026-08-17'][0].title = 'Changed';
    state.events['2026-08-18'] = [{ title: 'New', price: 1 }];
    state.ledgerName = 'Other';
    state.selectedKey = null;
    assert.equal(snap.events['2026-08-17'][0].title, 'Coffee');
    assert.equal(snap.events['2026-08-18'], undefined);
    assert.equal(snap.ledgerName, 'QC household');
    assert.equal(snap.selectedKey, '2026-08-17');
    assert.equal(snap.editingIndex, 0);
});

test('undo snapshot is not offered until a delete runs', () => {
    assert.equal(hasDeleteUndo(), false);
});
