import { messageIngestQueue } from "./messageIngest.queue";
import { riskEvaluationQueue } from "./risk.queue";
import { leakQueue } from "./leak.queue";
import { reportQueue } from "./report.queue";
import { deadLetterQueue } from "./deadLetter.queue";

export async function getQueueMetricsSnapshot(): Promise<{
  ingest: Record<string, number>;
  risk: Record<string, number>;
  leak: Record<string, number>;
  report: Record<string, number>;
  deadLetter: Record<string, number>;
}> {
  const [ingest, risk, leak, report, deadLetter] = await Promise.all([
    messageIngestQueue.getJobCounts(),
    riskEvaluationQueue.getJobCounts(),
    leakQueue.getJobCounts(),
    reportQueue.getJobCounts(),
    deadLetterQueue.getJobCounts(),
  ]);
  return { ingest, risk, leak, report, deadLetter };
}
