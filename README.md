# Ride Story AI

A production-ready micro web app built with Next.js, TypeScript, Tailwind CSS, and a provider-agnostic AI layer. Users answer a short personality flow, upload or capture a photo, and receive a shareable AI-generated bike lifestyle story.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env.local
```

3. Set at least:

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
AI_TEXT_MODEL=gemini-2.5-flash
AI_IMAGE_MODEL=gemini-3.1-flash-image-preview
AI_RESPONSES_MODEL=gemini-2.5-flash
AI_API_URL=
AI_OPENAI_USE_RESPONSES_IDENTITY=false
AI_MAX_REFERENCE_IMAGES=3
AI_IMAGE_SIZE=1K
AI_IMAGE_ASPECT_RATIO=4:5
AI_IMAGE_QUALITY=high
AI_INPUT_FIDELITY=high
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ride_story
DB_CONNECTION_LIMIT=10
OTP_SECRET=change_me
BULKSMSBD_API_KEY=your_bulksmsbd_api_key
BULKSMSBD_SENDER_ID=your_sender_id
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_me
ADMIN_SESSION_SECRET=change_me_to_a_long_random_secret
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SQS_QUEUE_URL=
APP_BASE_URL=http://127.0.0.1:3000
QUEUE_INTERNAL_TOKEN=change_me_queue_secret
QUEUE_MAX_ATTEMPTS=3
```

4. Start the app:

```bash
npm run dev
```

Start the queue worker in a second terminal:

```bash
npm run worker:generation
```

5. Create the local MySQL database:

```sql
CREATE DATABASE ride_story;
```

Then run the schema from [database/schema.sql](/Users/esmailkhalifa/Documents/GitHub/Image-MVP/database/schema.sql).

## Notes

- If no `GEMINI_API_KEY` is configured, the app returns a polished mock image so the full UX can still be tested locally.
- Providers live under `lib/ai/providers` and can be swapped via `AI_PROVIDER` without changing UI or route logic.
- The API route lives at `app/api/generate/route.ts`.
- Queue status route: `app/api/generate/status/route.ts`.
- Worker processing route: `app/api/generate/process/route.ts`.
- OTP now uses `/api/otp/send` and `/api/otp/verify`.
- Users are stored in MySQL and each generation stores phone, bike choice, and environment in `generation_logs`.
- Queue jobs are stored in `generation_jobs` and processed asynchronously through AWS SQS.
- Company content can be managed from `/admin` with the admin credentials from `.env.local`.
- The default setup now targets the official Gemini API with `gemini-3.1-flash-image-preview` for image generation.
