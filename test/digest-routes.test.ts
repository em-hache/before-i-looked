import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const base = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60 };

// A temp runs dir, so these routes never read or write the real runs/ fixtures.
function runsWith(night: string, text: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'rig-routes-'));
  writeFileSync(join(dir, `${night}.jsonl`), text);
  return dir;
}

describe('digest routes with a bad line', () => {
  const line = '{"at":"2026-11-02T01:00:00+01:00","job":"lane/sync","status":"ok","owner":"rook"}';
  const runsDir = runsWith('2026-11-02', `${line}\n{"at":"2026-11-02T02:00:00+01:0\n`);

  it('page renders the good row and notes the skipped line', async () => {
    const res = await createApp({ ...base, runsDir }).request('/digest/2026-11-02');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('lane/sync');
    expect(html).toContain('1 unreadable line');
  });

  it('json returns the good row and counts the bad line', async () => {
    const res = await createApp({ ...base, runsDir }).request('/api/digest/2026-11-02');
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.badLines).toBe(1);
    expect(body.rows.map((r: { job: string }) => r.job)).toEqual(['lane/sync']);
  });
});

describe('digest routes with an empty night', () => {
  const runsDir = runsWith('2026-11-03', '');

  it('page says nothing ran', async () => {
    const res = await createApp({ ...base, runsDir }).request('/digest/2026-11-03');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('json returns no rows and no bad lines', async () => {
    const res = await createApp({ ...base, runsDir }).request('/api/digest/2026-11-03');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ rows: [], badLines: 0 });
  });
});

describe('digest routes agree', () => {
  it('page and json list the same jobs in the same order for 2026-10-28', async () => {
    const app = createApp({ ...base, runsDir: 'runs' });
    const page = await (await app.request('/digest/2026-10-28')).text();
    const json = await (await app.request('/api/digest/2026-10-28')).json();
    const jobs = json.rows.map((r: { job: string }) => r.job);
    const positions = jobs.map((job: string) => page.indexOf(job));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(positions.every((p: number) => p >= 0)).toBe(true);
  });
});
