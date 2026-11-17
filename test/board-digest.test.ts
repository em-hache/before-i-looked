import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: 'runs' };

describe('board links to digests', () => {
  it('links each night with its job counts by last status', async () => {
    const html = await (await createApp(config).request('/')).text();
    expect(html).toContain('href="/digest/2026-10-28"');
    expect(html).toContain('href="/digest/2026-10-27"');
    // 2026-10-28: lane/sync, rig/rotate-logs, digest/render, fixtures/refresh end ok; notes/backup fails.
    expect(html).toMatch(/2026-10-28<\/a> · ok 4 · retry 0 · fail 1/);
  });
});
