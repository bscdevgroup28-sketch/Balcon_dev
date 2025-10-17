declare module 'autocannon' {
  interface ResultSummary {
    duration: number;
    connections: number;
    latency: { p50: number; p95: number; [k: string]: any };
    requests: { average: number; p95: number; [k: string]: any };
  }
  interface Options {
    url: string;
    connections?: number;
    duration?: number;
    method?: string;
    headers?: Record<string,string>;
    body?: string;
  }
  function autocannon(opts: Options): Promise<ResultSummary> & { on: Function };
  export default autocannon;
}
