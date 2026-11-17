import type { DigestRow, Night } from '../digest/types.js';

const dash = '—';

function flags(row: DigestRow): string[] {
  const out: string[] = [];
  if (row.lastStatus === 'fail') out.push('FAIL');
  if (row.retries >= 3) out.push(`RETRIES ${row.retries}`);
  return out;
}

function Row({ row }: { row: DigestRow }) {
  const marked = flags(row);
  return (
    <tr class={marked.length > 0 ? 'warn' : undefined}>
      <td>{row.job || dash}</td>
      <td>{row.owner ?? dash}</td>
      <td>{row.runs}</td>
      <td>{row.retries}</td>
      <td>{row.lastStatus}</td>
      <td>{row.lastError ?? dash}</td>
      <td>{row.first || dash}</td>
      <td>{row.last || dash}</td>
      <td>{marked.length > 0 ? `[${marked.join(' · ')}]` : dash}</td>
    </tr>
  );
}

export function DigestPage({ night, data }: { night: string; data: Night }) {
  return (
    <>
      <h1>digest · {night}</h1>
      {data.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first</th>
              <th>last</th>
              <th>flag</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <Row row={row} />
            ))}
          </tbody>
        </table>
      )}
      {data.badLines > 0 ? <p class="mute">{data.badLines} unreadable line(s) skipped</p> : null}
    </>
  );
}
