import mysql, { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";

let pool: Pool | null = null;
let schemaReady = false;
const recoverableErrorCodes = new Set([
  "PROTOCOL_CONNECTION_LOST",
  "ECONNRESET",
  "ECONNREFUSED",
  "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR"
]);

function requireEnv(name: string, fallback?: string) {
  const value = process.env[name];

  if (value !== undefined) {
    return value;
  }

  if (fallback !== undefined) {
    return fallback;
  }

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getDbPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: requireEnv("DB_HOST", "127.0.0.1"),
      port: Number(process.env.DB_PORT || "3306"),
      user: requireEnv("DB_USER"),
      password: requireEnv("DB_PASSWORD"),
      database: requireEnv("DB_NAME"),
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || "10"),
      queueLimit: 0
    });
  }

  return pool;
}

async function rebuildPool() {
  try {
    await pool?.end();
  } catch {}

  pool = null;
  schemaReady = false;
  return getDbPool();
}

function isRecoverableDbError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String((error as { code?: string }).code || "") : "";
  return recoverableErrorCodes.has(code);
}

async function safeQuery<T extends RowDataPacket[] | ResultSetHeader>(query: string, params: unknown[] = []) {
  try {
    return await getDbPool().query<T>(query, params);
  } catch (error) {
    if (!isRecoverableDbError(error)) {
      throw error;
    }

    const nextPool = await rebuildPool();
    return nextPool.query<T>(query, params);
  }
}

export async function ensureDatabaseSchema() {
  if (schemaReady) {
    return;
  }

  await safeQuery<ResultSetHeader>(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      phone VARCHAR(24) NOT NULL UNIQUE,
      age SMALLINT UNSIGNED NOT NULL,
      otp_verified_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await safeQuery<ResultSetHeader>(`
    CREATE TABLE IF NOT EXISTS otp_requests (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      phone VARCHAR(24) NOT NULL,
      otp_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      attempt_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
      send_status VARCHAR(32) NOT NULL DEFAULT 'sent',
      verified_at DATETIME NULL,
      blocked_until DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_otp_phone_created (phone, created_at)
    )
  `);

  await safeQuery<ResultSetHeader>(`
    CREATE TABLE IF NOT EXISTS generation_logs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      phone VARCHAR(24) NOT NULL,
      bike_type VARCHAR(120) NOT NULL,
      environment VARCHAR(120) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'processing',
      provider VARCHAR(40) NULL,
      error_message TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_generation_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_generation_phone_created (phone, created_at),
      INDEX idx_generation_user_created (user_id, created_at)
    )
  `);

  await safeQuery<ResultSetHeader>(`
    CREATE TABLE IF NOT EXISTS generation_jobs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      phone VARCHAR(24) NOT NULL,
      bike_type VARCHAR(120) NOT NULL,
      environment VARCHAR(120) NOT NULL,
      provider VARCHAR(40) NULL,
      model VARCHAR(120) NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      retry_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
      queue_message_id VARCHAR(190) NULL,
      error_message TEXT NULL,
      payload_json JSON NULL,
      result_summary TEXT NULL,
      result_caption TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_generation_job_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_generation_jobs_status_created (status, created_at),
      INDEX idx_generation_jobs_phone_created (phone, created_at),
      INDEX idx_generation_jobs_user_created (user_id, created_at)
    )
  `);

  await safeQuery<ResultSetHeader>(`
    CREATE TABLE IF NOT EXISTS generation_job_events (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      job_id BIGINT UNSIGNED NOT NULL,
      event_type VARCHAR(60) NOT NULL,
      message TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_generation_job_events_job FOREIGN KEY (job_id) REFERENCES generation_jobs(id) ON DELETE CASCADE,
      INDEX idx_generation_job_events_job_created (job_id, created_at)
    )
  `);

  await safeQuery<ResultSetHeader>(
    `ALTER TABLE otp_requests ADD COLUMN IF NOT EXISTS blocked_until DATETIME NULL`
  );

  schemaReady = true;
}

export interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  phone: string;
  age: number;
  otp_verified_at: string | null;
}

export interface DashboardOverview {
  totalUsers: number;
  totalVerifiedUsers: number;
  totalGenerations: number;
  todayGenerations: number;
}

export interface DashboardSearchRow extends RowDataPacket {
  userId: number;
  name: string;
  phone: string;
  age: number;
  totalGenerations: number;
  lastGeneratedAt: string | null;
  lastBike: string | null;
  lastEnvironment: string | null;
}

export interface PaginatedUserRow extends RowDataPacket {
  userId: number;
  name: string;
  phone: string;
  age: number;
  totalGenerations: number;
  lastGeneratedAt: string | null;
}

export interface OtpRow extends RowDataPacket {
  id: number;
  phone: string;
  otp_hash: string;
  expires_at: string;
  attempt_count: number;
  verified_at: string | null;
  blocked_until: string | null;
  created_at: string;
}

export async function findVerifiedUserByPhone(phone: string) {
  await ensureDatabaseSchema();
  const [rows] = await safeQuery<UserRow[]>(
    `SELECT id, name, phone, age, otp_verified_at
     FROM users
     WHERE phone = ? AND otp_verified_at IS NOT NULL
     LIMIT 1`,
    [phone]
  );

  return rows[0] || null;
}

export async function upsertVerifiedUser(params: { name: string; phone: string; age: number }) {
  await ensureDatabaseSchema();
  await safeQuery<ResultSetHeader>(
    `INSERT INTO users (name, phone, age, otp_verified_at)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       age = VALUES(age),
       otp_verified_at = NOW()`,
    [params.name, params.phone, params.age]
  );

  return findVerifiedUserByPhone(params.phone);
}

export async function createOtpRequest(params: { phone: string; otpHash: string; expiresAt: Date }) {
  await ensureDatabaseSchema();
  const [result] = await safeQuery<ResultSetHeader>(
    `INSERT INTO otp_requests (phone, otp_hash, expires_at, send_status)
     VALUES (?, ?, ?, 'pending')`,
    [params.phone, params.otpHash, params.expiresAt]
  );

  return result.insertId;
}

export async function findLatestOtpRequest(phone: string) {
  await ensureDatabaseSchema();
  const [rows] = await safeQuery<OtpRow[]>(
    `SELECT id, phone, otp_hash, expires_at, attempt_count, verified_at, blocked_until, created_at
     FROM otp_requests
     WHERE phone = ?
     ORDER BY id DESC
     LIMIT 1`,
    [phone]
  );

  return rows[0] || null;
}

export async function incrementOtpAttempt(id: number) {
  await ensureDatabaseSchema();
  await safeQuery<ResultSetHeader>(`UPDATE otp_requests SET attempt_count = attempt_count + 1 WHERE id = ?`, [id]);
}

export async function markOtpVerified(id: number) {
  await ensureDatabaseSchema();
  await safeQuery<ResultSetHeader>(`UPDATE otp_requests SET verified_at = NOW() WHERE id = ?`, [id]);
}

export async function createGenerationLog(params: {
  userId: number;
  phone: string;
  bikeType: string;
  environment: string;
  provider: string;
}) {
  await ensureDatabaseSchema();
  const [result] = await safeQuery<ResultSetHeader>(
    `INSERT INTO generation_logs (user_id, phone, bike_type, environment, status, provider)
     VALUES (?, ?, ?, ?, 'processing', ?)`,
    [params.userId, params.phone, params.bikeType, params.environment, params.provider]
  );

  return result.insertId;
}

export async function completeGenerationLog(id: number) {
  await ensureDatabaseSchema();
  await safeQuery<ResultSetHeader>(`UPDATE generation_logs SET status = 'completed', error_message = NULL WHERE id = ?`, [id]);
}

export async function failGenerationLog(id: number, message: string) {
  await ensureDatabaseSchema();
  await safeQuery<ResultSetHeader>(`UPDATE generation_logs SET status = 'failed', error_message = ? WHERE id = ?`, [message, id]);
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  await ensureDatabaseSchema();
  const [[usersRow]] = await safeQuery<RowDataPacket[]>(
    `SELECT
      COUNT(*) AS totalUsers,
      SUM(CASE WHEN otp_verified_at IS NOT NULL THEN 1 ELSE 0 END) AS totalVerifiedUsers
     FROM users`
  );

  const [[generationRow]] = await safeQuery<RowDataPacket[]>(
    `SELECT
      COUNT(*) AS totalGenerations,
      SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 ELSE 0 END) AS todayGenerations
     FROM generation_logs`
  );

  return {
    totalUsers: Number(usersRow?.totalUsers || 0),
    totalVerifiedUsers: Number(usersRow?.totalVerifiedUsers || 0),
    totalGenerations: Number(generationRow?.totalGenerations || 0),
    todayGenerations: Number(generationRow?.todayGenerations || 0)
  };
}

export async function searchUsersByPhone(phoneQuery: string) {
  await ensureDatabaseSchema();
  const likeValue = `%${phoneQuery.replace(/\D/g, "")}%`;

  const [rows] = await safeQuery<DashboardSearchRow[]>(
    `SELECT
      u.id AS userId,
      u.name,
      u.phone,
      u.age,
      COUNT(g.id) AS totalGenerations,
      MAX(g.created_at) AS lastGeneratedAt,
      SUBSTRING_INDEX(GROUP_CONCAT(g.bike_type ORDER BY g.created_at DESC SEPARATOR '||'), '||', 1) AS lastBike,
      SUBSTRING_INDEX(GROUP_CONCAT(g.environment ORDER BY g.created_at DESC SEPARATOR '||'), '||', 1) AS lastEnvironment
     FROM users u
     LEFT JOIN generation_logs g ON g.user_id = u.id
     WHERE REPLACE(REPLACE(u.phone, '+', ''), ' ', '') LIKE ?
     GROUP BY u.id, u.name, u.phone, u.age
     ORDER BY MAX(g.created_at) DESC, u.id DESC
     LIMIT 50`,
    [likeValue]
  );

  return rows.map((row) => ({
    ...row,
    totalGenerations: Number(row.totalGenerations || 0)
  }));
}

export async function getRecentGenerationRows(limit = 100) {
  await ensureDatabaseSchema();
  const [rows] = await safeQuery<RowDataPacket[]>(
    `SELECT
      u.name,
      u.phone,
      u.age,
      g.bike_type AS bikeType,
      g.environment,
      g.status,
      g.provider,
      g.error_message AS errorMessage,
      g.created_at AS createdAt
     FROM generation_logs g
     INNER JOIN users u ON u.id = g.user_id
     ORDER BY g.created_at DESC
     LIMIT ?`,
    [limit]
  );

  return rows;
}

export async function getExportRows() {
  await ensureDatabaseSchema();
  const [rows] = await safeQuery<RowDataPacket[]>(
    `SELECT
      u.id AS userId,
      u.name,
      u.phone,
      u.age,
      u.otp_verified_at AS otpVerifiedAt,
      g.bike_type AS bikeType,
      g.environment,
      g.status,
      g.provider,
      g.error_message AS errorMessage,
      g.created_at AS generatedAt
     FROM users u
     LEFT JOIN generation_logs g ON g.user_id = u.id
     ORDER BY u.id DESC, g.created_at DESC`
  );

  return rows;
}

export async function markOtpSendStatus(id: number, status: "sent" | "failed") {
  await ensureDatabaseSchema();
  await safeQuery<ResultSetHeader>(`UPDATE otp_requests SET send_status = ? WHERE id = ?`, [status, id]);
}

export async function setOtpBlockedUntil(id: number, blockedUntil: Date) {
  await ensureDatabaseSchema();
  await safeQuery<ResultSetHeader>(`UPDATE otp_requests SET blocked_until = ? WHERE id = ?`, [blockedUntil, id]);
}

export async function countSuccessfulOtpRequestsSince(phone: string, since: Date) {
  await ensureDatabaseSchema();
  const [[row]] = await safeQuery<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM otp_requests
     WHERE phone = ? AND send_status = 'sent' AND created_at >= ?`,
    [phone, since]
  );

  return Number(row?.total || 0);
}

export async function getExportRowCount() {
  await ensureDatabaseSchema();
  const [[row]] = await safeQuery<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM users u
     LEFT JOIN generation_logs g ON g.user_id = u.id`
  );

  return Number(row?.total || 0);
}

export async function getExportRowsPage(page: number, limit: number) {
  await ensureDatabaseSchema();
  const offset = (page - 1) * limit;
  const [rows] = await safeQuery<RowDataPacket[]>(
    `SELECT
      u.id AS userId,
      u.name,
      u.phone,
      u.age,
      u.otp_verified_at AS otpVerifiedAt,
      g.bike_type AS bikeType,
      g.environment,
      g.status,
      g.provider,
      g.error_message AS errorMessage,
      g.created_at AS generatedAt
     FROM users u
     LEFT JOIN generation_logs g ON g.user_id = u.id
     ORDER BY u.id DESC, g.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return rows;
}

export async function getPaginatedUsers(page: number, limit: number) {
  await ensureDatabaseSchema();
  const offset = (page - 1) * limit;
  const [rows] = await safeQuery<PaginatedUserRow[]>(
    `SELECT
      u.id AS userId,
      u.name,
      u.phone,
      u.age,
      COUNT(g.id) AS totalGenerations,
      MAX(g.created_at) AS lastGeneratedAt
     FROM users u
     LEFT JOIN generation_logs g ON g.user_id = u.id
     GROUP BY u.id, u.name, u.phone, u.age
     ORDER BY u.id DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return rows.map((row) => ({
    ...row,
    totalGenerations: Number(row.totalGenerations || 0)
  }));
}

export async function getUsersCount() {
  await ensureDatabaseSchema();
  const [[row]] = await safeQuery<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM users`);
  return Number(row?.total || 0);
}

export async function getUserDetail(userId: number) {
  await ensureDatabaseSchema();
  const [[user]] = await safeQuery<RowDataPacket[]>(
    `SELECT id, name, phone, age, otp_verified_at AS otpVerifiedAt, created_at AS createdAt
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );

  if (!user) {
    return null;
  }

  const [logs] = await safeQuery<RowDataPacket[]>(
    `SELECT id, bike_type AS bikeType, environment, status, provider, error_message AS errorMessage, created_at AS createdAt
     FROM generation_logs
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );

  return {
    user,
    logs
  };
}
