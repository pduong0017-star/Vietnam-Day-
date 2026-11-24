import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  OPENING_SCROLL_NARRATION_TEXT,
  OPENING_SCROLL_STANZAS,
  formatClosingPersonalDedication,
  getActiveScrollStanzaIndex,
} from './scrollContent.ts';

describe('scrollContent', () => {
  it('provides four ceremonial stanzas with ascending normalized weights ending at 1', () => {
    assert.equal(OPENING_SCROLL_STANZAS.length, 4);
    assert.equal(OPENING_SCROLL_STANZAS[OPENING_SCROLL_STANZAS.length - 1].weight, 1);
    for (let i = 1; i < OPENING_SCROLL_STANZAS.length; i++) {
      assert.ok(OPENING_SCROLL_STANZAS[i].weight > OPENING_SCROLL_STANZAS[i - 1].weight);
    }
    assert.ok(OPENING_SCROLL_NARRATION_TEXT.includes('Văn hóa soi đường cho quốc dân đi'));
  });

  it('maps audio progress cleanly onto the active scroll stanza', () => {
    assert.equal(getActiveScrollStanzaIndex(-0.2), 0);
    assert.equal(getActiveScrollStanzaIndex(0.1), 0);
    assert.equal(getActiveScrollStanzaIndex(0.42), 1);
    assert.equal(getActiveScrollStanzaIndex(0.7), 2);
    assert.equal(getActiveScrollStanzaIndex(0.95), 3);
    assert.equal(getActiveScrollStanzaIndex(1.5), 3);
  });

  it('formats optional personalized closing dedications cleanly', () => {
    assert.equal(formatClosingPersonalDedication('', '', ''), null);
    const ded = formatClosingPersonalDedication('Lan Anh', 'Minh Khôi', 'Chúc ngày 24/11 rực rỡ!');
    assert.ok(ded);
    assert.equal(ded.heading, 'Thân gửi Lan Anh · Từ Minh Khôi');
    assert.equal(ded.body, 'Chúc ngày 24/11 rực rỡ!');
  });
});
