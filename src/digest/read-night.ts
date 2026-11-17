import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, JobStatus, Night } from './types.js';

const NIGHT = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES: string[] = ['ok', 'retry', 'fail'];

type Line = { at: string; job: string; status: JobStatus; owner: string | null; error: string | null };

// Parse input at the edge: anything that does not match the log format is a bad line.
function parseLine(raw: string): Line | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;
  const { at, job, status, owner = null, error = null } = value as Record<string, unknown>;
  if (typeof at !== 'string' || typeof job !== 'string') return null;
  if (typeof status !== 'string' || !STATUSES.includes(status)) return null;
  if (owner !== null && typeof owner !== 'string') return null;
  if (error !== null && typeof error !== 'string') return null;
  return { at, job, status: status as JobStatus, owner, error };
}

function summarize(job: string, lines: Line[]): DigestRow {
  const last = lines[lines.length - 1];
  return {
    job,
    owner: last.owner,
    runs: lines.length,
    retries: lines.filter((l) => l.status === 'retry').length,
    lastStatus: last.status,
    lastError: lines.findLast((l) => l.error !== null)?.error ?? null,
    first: lines[0].at,
    last: last.at,
  };
}

export function readNight(runsDir: string, night: string): Night | null {
  if (!NIGHT.test(night)) return null;

  let text: string;
  try {
    text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch {
    return null;
  }

  const byJob = new Map<string, Line[]>();
  let badLines = 0;
  for (const raw of text.split('\n')) {
    if (raw.trim() === '') continue;
    const line = parseLine(raw);
    if (line === null) {
      badLines++;
      continue;
    }
    byJob.set(line.job, [...(byJob.get(line.job) ?? []), line]);
  }

  const rows = [...byJob]
    .map(([job, lines]) => summarize(job, lines))
    .sort((a, b) => a.job.localeCompare(b.job));
  return { rows, badLines };
}
