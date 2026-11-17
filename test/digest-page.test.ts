import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const base = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60 };

describe('digest page', () => {
  it('renders the jobs of 2026-10-28', async () => {
    const res = await createApp({ ...base, runsDir: 'runs' }).request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    for (const job of ['digest/render', 'fixtures/refresh', 'lane/sync', 'notes/backup', 'rig/rotate-logs']) {
      expect(html).toContain(job);
    }
    expect(html).toContain('+01:00');
  });

  it('404s for a night with no file', async () => {
    const res = await createApp({ ...base, runsDir: 'runs' }).request('/digest/2020-01-01');
    expect(res.status).toBe(404);
  });

  it('says nothing ran for an empty night', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-'));
    writeFileSync(join(dir, '2026-11-01.jsonl'), '');
    const res = await createApp({ ...base, runsDir: dir }).request('/digest/2026-11-01');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });
});
