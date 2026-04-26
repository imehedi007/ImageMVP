import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

let client: SQSClient | null = null;

function requireQueueEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required queue environment variable: ${name}`);
  }

  return value;
}

function getSqsClient() {
  if (!client) {
    client = new SQSClient({
      region: requireQueueEnv("AWS_REGION"),
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
          : undefined
    });
  }

  return client;
}

export function hasQueueConfig() {
  return Boolean(process.env.AWS_REGION && process.env.AWS_SQS_QUEUE_URL);
}

export async function enqueueGenerationJob(jobId: number) {
  const response = await getSqsClient().send(
    new SendMessageCommand({
      QueueUrl: requireQueueEnv("AWS_SQS_QUEUE_URL"),
      MessageBody: JSON.stringify({ jobId }),
      MessageAttributes: {
        jobId: {
          DataType: "Number",
          StringValue: String(jobId)
        }
      }
    })
  );

  return response.MessageId || null;
}
