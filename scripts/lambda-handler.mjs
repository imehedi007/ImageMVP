/**
 * AWS Lambda Handler (Trigger Pattern)
 * This handler is triggered by SQS and calls the internal API to process the job.
 * 
 * Set these environment variables in your Lambda function:
 * - APP_BASE_URL: e.g., https://your-app.com
 * - QUEUE_INTERNAL_TOKEN: Must match the one in your app
 * - QUEUE_MAX_ATTEMPTS: e.g., 3
 */
export const handler = async (event) => {
  const baseUrl = process.env.APP_BASE_URL;
  const queueToken = process.env.QUEUE_INTERNAL_TOKEN || process.env.OTP_SECRET;
  const maxAttempts = Number(process.env.QUEUE_MAX_ATTEMPTS || "3");

  if (!baseUrl || !queueToken) {
    throw new Error("Missing Lambda environment variables: APP_BASE_URL, QUEUE_INTERNAL_TOKEN");
  }

  console.log(`Processing ${event.Records.length} SQS records...`);

  const results = await Promise.allSettled(
    event.Records.map(async (record) => {
      const body = JSON.parse(record.body || "{}");
      const jobId = Number(body.jobId || record.messageAttributes?.jobId?.stringValue || 0);
      const receiveCount = Number(record.attributes?.ApproximateReceiveCount || "1");
      const retryCount = Math.max(0, receiveCount - 1);
      const finalAttempt = receiveCount >= maxAttempts;

      if (!jobId) {
        console.warn("Skipping invalid SQS message", record.body);
        return;
      }

      console.log(`Triggering processing for Job ${jobId} (Attempt ${receiveCount})`);

      const response = await fetch(`${baseUrl}/api/generate/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-queue-token": queueToken
        },
        body: JSON.stringify({
          jobId,
          retryCount,
          finalAttempt
        })
      });

      const payload = await response.json().catch(() => ({}));

      if (response.ok) {
        console.log(`Job ${jobId} triggered successfully.`);
      } else {
        const errorMsg = payload?.message || "Unknown error";
        console.error(`Job ${jobId} trigger failed: ${errorMsg}`);
        
        if (payload?.final || finalAttempt) {
          console.log(`Job ${jobId} reached final failure state, message will be removed from queue.`);
          return;
        }

        // Throw error to trigger SQS retry
        throw new Error(`API returned ${response.status}: ${errorMsg}`);
      }
    })
  );

  const failures = results.filter(r => r.status === "rejected");
  if (failures.length > 0) {
    // In SQS-Lambda integration, throwing an error will prevent the 
    // batch from being deleted from the queue, causing a retry.
    throw new Error(`${failures.length} jobs failed processing.`);
  }

  return { statusCode: 200, body: "Batch processed" };
};
