declare module 'node-cron' {
  export interface ScheduleOptions {
    timezone?: string;
    scheduled?: boolean;
    recoverMissedExecutions?: boolean;
  }
  export interface ScheduledTask {
    start: () => void;
    stop: () => void;
    destroy: () => void;
    getStatus?: () => 'scheduled' | 'running' | 'stopped';
  }
  export function schedule(
    expression: string,
    callback: () => void | Promise<void>,
    options?: ScheduleOptions
  ): ScheduledTask;
  export function validate(expression: string): boolean;
  const _default: { schedule: typeof schedule; validate: typeof validate };
  export default _default;
}