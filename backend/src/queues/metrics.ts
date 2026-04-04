import { messageIngestQueue } from "./messageIngest.queue";
import { riskEvaluationQueue } from "./risk.queue";
import { leakQueue } from "./leak.queue";
import { reportQueue } from "./report.queue";
import { deadLetterQueue } from "./deadLetter.queue";
import { leadFollowupQueue } from "./leadFollowup.queue";

export async function getQueueMetricsSnapshot(): Promise<{
  ingest: Record<string, number>;
  risk: Record<string, number>;
  leak: Record<string, number>;
  report: Record<string, number>;
  deadLetter: Record<string, number>;
  leadFollowup: Record<string, number>;
}> {
  const [ingest, risk, leak, report, deadLetter, leadFollowup] = await Promise.all([
    messageIngestQueue.getJobCounts(),
    riskEvaluationQueue.getJobCounts(),
    leakQueue.getJobCounts(),
    reportQueue.getJobCounts(),
    deadLetterQueue.getJobCounts(),
    leadFollowupQueue.getJobCounts(),
  ]);
  return { ingest, risk, leak, report, deadLetter, leadFollowup };
}
