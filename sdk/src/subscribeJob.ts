export type JobStreamEvent = Record<string, unknown>;
export type JobEventSource = {
  addEventListener(
    type: string,
    listener: (event: { data: string }) => void,
  ): void;
  close(): void;
};

export type SubscribeJobOptions = {
  baseUrl?: string;
  eventSourceFactory?: (url: string) => JobEventSource;
};

/**
 * Subscribe to indexed lifecycle events for a single job through the dashboard SSE endpoint.
 * The returned function closes the stream.
 */
export function subscribeJob(
  jobId: bigint | number | string,
  callback: (event: JobStreamEvent) => void,
  options: SubscribeJobOptions = {},
): () => void {
  const id = String(jobId);
  if (!/^\d+$/.test(id)) {
    throw new TypeError("jobId must be a non-negative integer");
  }

  const factory =
    options.eventSourceFactory ??
    ((url: string): JobEventSource => {
      if (typeof EventSource === "undefined") {
        throw new Error("EventSource is not available in this environment");
      }
      return new EventSource(url);
    });
  const baseUrl = options.baseUrl?.replace(/\/+$/, "") ?? "";
  const source = factory(`${baseUrl}/api/jobs/${encodeURIComponent(id)}/events`);
  const onEvent = (message: { data: string }) => {
    let event: JobStreamEvent;
    try {
      event = JSON.parse(message.data) as JobStreamEvent;
    } catch {
      return;
    }
    callback(event);
  };
  for (const eventType of ["JobSubmitted", "JobCompleted", "JobCancelled", "JobDisputed"]) {
    source.addEventListener(eventType, onEvent);
  }
  return () => source.close();
}
