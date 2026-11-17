import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read-night.js';

describe('readNight', () => {
  it('reads one row per job from the real night and counts the bad line', () => {
    const night = readNight('runs', '2026-10-28');
    expect(night?.badLines).toBe(1);
    expect(night?.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
  });

  it('summarises retries, the last error and the first and last time', () => {
    const row = readNight('runs', '2026-10-28')?.rows.find((r) => r.job === 'fixtures/refresh');
    expect(row).toEqual({
      job: 'fixtures/refresh',
      owner: 'rook',
      runs: 4,
      retries: 3,
      lastStatus: 'ok',
      lastError: 'upstream 503',
      first: '2026-10-29T01:30:00+01:00',
      last: '2026-10-29T01:37:00+01:00',
    });
  });

  it('keeps a row with a null owner and shows no error when there is none', () => {
    const rows = readNight('runs', '2026-10-28')?.rows ?? [];
    expect(rows.find((r) => r.job === 'digest/render')?.owner).toBeNull();
    expect(rows.find((r) => r.job === 'rig/rotate-logs')?.lastError).toBeNull();
  });

  it('reports a failed job with its last status and error', () => {
    const row = readNight('runs', '2026-10-28')?.rows.find((r) => r.job === 'notes/backup');
    expect(row?.lastStatus).toBe('fail');
    expect(row?.lastError).toBe('quota exceeded');
    expect(row?.owner).toBe('lane-07');
  });

  it('returns null when the night has no file', () => {
    expect(readNight('runs', '2026-01-01')).toBeNull();
  });

  it('returns null for a night name that is not a date', () => {
    expect(readNight('runs', '../runs/2026-10-28')).toBeNull();
  });

  it('renders an empty file as no rows and no bad lines', () => {
    const dir = mkdtempSync(join(tmpdir(), 'digest-'));
    writeFileSync(join(dir, '2026-10-30.jsonl'), '');
    expect(readNight(dir, '2026-10-30')).toEqual({ rows: [], badLines: 0 });
  });
});
