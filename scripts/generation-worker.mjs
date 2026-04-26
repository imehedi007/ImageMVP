import { DeleteMessageCommand, ReceiveMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import fs from "fs";
import path from "path";

for (const fileName of [".env.local", ".env"]) {
  const envPath = path.resolve(process.cwd(), fileName);

  if (!fs.existsSync(envPath)) {
    continue;
  }

  const raw = fs.readFileSync(envPath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) {
      continue;
    }

    const [key, ...rest] = line.split("=");
    const value = rest.join("=");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const region = process.env.AWS_REGION;
const queueUrl = process.env.AWS_SQS_QUEUE_URL;
const baseUrl = process.env.APP_BASE_URL || "http://127.0.0.1:3000";
const queueToken = process.env.QUEUE_INTERNAL_TOKEN || process.env.OTP_SECRET;
const maxAttempts = Number(process.env.QUEUE_MAX_ATTEMPTS || "3");
const waitTimeSeconds = Number(process.env.QUEUE_WAIT_TIME_SECONDS || "3");

if (!region || !queueUrl || !queueToken) {
  console.error("Missing worker env. Required: AWS_REGION, AWS_SQS_QUEUE_URL, QUEUE_INTERNAL_TOKEN or OTP_SECRET.");
  process.exit(1);
}

const client = new SQSClient({
  region,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      : undefined
});

let stopping = false;

process.on("SIGINT", () => {
  stopping = true;
});

process.on("SIGTERM", () => {
  stopping = true;
});

async function processMessage(message) {
  const body = JSON.parse(message.Body || "{}");
  const jobId = Number(body.jobId || 0);
  const receiveCount = Number(message.Attributes?.ApproximateReceiveCount || "1");
  const retryCount = Math.max(0, receiveCount - 1);
  const finalAttempt = receiveCount >= maxAttempts;

  if (!jobId) {
    console.error("Skipping invalid queue message", message.Body);
    return true;
  }

  try {
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
      console.log(`Job ${jobId} processed successfully.`);
      return true;
    }

    if (payload?.final || finalAttempt) {
      console.error(`Job ${jobId} failed finally: ${payload?.message || "unknown error"}`);
      return true;
    }

    console.warn(`Job ${jobId} failed attempt ${retryCount + 1}, message left in queue.`);
    return false;
  } catch (error) {
    if (finalAttempt) {
      console.error(`Job ${jobId} reached max attempts and will be dropped.`, error);
      return true;
    }

    console.warn(`Job ${jobId} could not reach app on attempt ${retryCount + 1}, message kept in queue.`);
    return false;
  }
}

async function main() {
  console.log("Generation worker started.");

  while (!stopping) {
    const response = await client.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: waitTimeSeconds,
        VisibilityTimeout: 180,
        AttributeNames: ["ApproximateReceiveCount"]
      })
    );

    const messages = response.Messages || [];

    if (!messages.length) {
      continue;
    }

    for (const message of messages) {
      try {
        const shouldDelete = await processMessage(message);

        if (shouldDelete && message.ReceiptHandle) {
          await client.send(
            new DeleteMessageCommand({
              QueueUrl: queueUrl,
              ReceiptHandle: message.ReceiptHandle
            })
          );
        }
      } catch (error) {
        console.error("Worker loop error", error);
      }
    }
  }

  console.log("Generation worker stopped.");
}

main().catch((error) => {
  console.error("Worker crashed", error);
  process.exit(1);
});
