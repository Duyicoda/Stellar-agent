import assert from "node:assert/strict";
import test from "node:test";
import { subscribeJob, type JobEventSource } from "./subscribeJob.js";

test("subscribeJob dispatches parsed events and closes its EventSource", () => {
  const listeners = new Map<string, (event: { data: string }) => void>();
  let closed = false;
  let requestedUrl = "";
  const source: JobEventSource = {
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    close() {
      closed = true;
    },
  };
  const events: Record<string, unknown>[] = [];

  const unsubscribe = subscribeJob(42n, (event) => events.push(event), {
    baseUrl: "https://dashboard.example/",
    eventSourceFactory(url) {
      requestedUrl = url;
      return source;
    },
  });
  listeners.get("JobCompleted")?.({ data: '{"event_type":"JobCompleted"}' });
  unsubscribe();

  assert.equal(requestedUrl, "https://dashboard.example/api/jobs/42/events");
  assert.deepEqual(events, [{ event_type: "JobCompleted" }]);
  assert.equal(closed, true);
});
