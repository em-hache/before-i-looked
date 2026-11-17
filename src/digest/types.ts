export type JobStatus = 'ok' | 'retry' | 'fail';

// One row per job in a night's run log.
export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: JobStatus;
  lastError: string | null;
  first: string;
  last: string;
};

export type Night = {
  rows: DigestRow[];
  badLines: number;
};

// runs/<night>.jsonl as a Night, or null when that file is not on disk.
export type ReadNight = (runsDir: string, night: string) => Night | null;
