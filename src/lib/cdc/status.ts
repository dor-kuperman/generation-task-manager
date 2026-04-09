import type { PipelineMetrics } from '../types';

export class PipelineStatus {
  private processedCount = 0;
  private errorCount = 0;
  private lastEventAt: string | null = null;
  private startedAt: string | null = null;
  private _status: PipelineMetrics['status'] = 'stopped';

  start(): void {
    this.startedAt = new Date().toISOString();
    this._status = 'running';
  }

  stop(): void {
    this._status = 'stopped';
  }

  recordEvent(): void {
    this.processedCount++;
    this.lastEventAt = new Date().toISOString();
  }

  recordError(): void {
    this.errorCount++;
    if (this.errorCount > 10) {
      this._status = 'error';
    }
  }

  resetErrors(): void {
    this.errorCount = 0;
    this._status = 'running';
  }

  getMetrics(): PipelineMetrics {
    const lag = this.lastEventAt
      ? Date.now() - new Date(this.lastEventAt).getTime()
      : 0;

    return {
      processed_count: this.processedCount,
      error_count: this.errorCount,
      last_event_at: this.lastEventAt,
      lag,
      status: this._status,
    };
  }
}
