import { readNight } from '../digest/read-night.js';
import type { Status } from '../status.js';

// Jobs counted once each, by last status; '—' when the night cannot be read.
function counts(runsDir: string, night: string): string {
  const n = readNight(runsDir, night);
  if (n === null) return '—';
  const c = (s: string) => n.rows.filter((r) => r.lastStatus === s).length;
  return `ok ${c('ok')} · retry ${c('retry')} · fail ${c('fail')}`;
}

export function StatusBoard({ status, runsDir }: { status: Status; runsDir: string }) {
  return (
    <>
      <h1>status</h1>
      <table>
        <tbody>
          <tr><th>adapter</th><td>{status.adapter}</td></tr>
          <tr><th>installed</th><td>{status.installed}</td></tr>
          <tr>
            <th>last beat</th>
            <td>{status.lastBeat ? `${status.lastBeat.at} · pid ${status.lastBeat.pid}` : <span class="warn">none</span>}</td>
          </tr>
        </tbody>
      </table>
      <h2>nights on disk</h2>
      {status.nights.length === 0 ? (
        <p class="mute">nothing in runs/</p>
      ) : (
        <ul>
          {status.nights.map((n) => (
            <li>
              <a href={`/digest/${n}`}>{n}</a> · {counts(runsDir, n)}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
