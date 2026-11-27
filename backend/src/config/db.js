const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'taskuser',
  password: process.env.DB_PASSWORD || 'local_task_pass_123',
  database: process.env.DB_NAME || 'taskmanager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Enable SSL/TLS when connecting to AWS RDS in production (DB_SSL=true)
if (process.env.DB_SSL === 'true') {
  dbConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = mysql.createPool(dbConfig);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Connects to MySQL/RDS with exponential backoff retry and auto-creates schema tables.
 */
async function initDatabase(maxRetries = 15, initialDelayMs = 2000) {
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt += 1;
    try {
      const connection = await pool.getConnection();
      console.log(`[DB] Connected to MySQL at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS tasks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          status ENUM('TODO', 'IN_PROGRESS', 'DONE') NOT NULL DEFAULT 'TODO',
          priority ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM',
          due_date DATE NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_status (status),
          INDEX idx_priority (priority)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;

      await connection.query(createTableSQL);

      const [rows] = await connection.query('SELECT COUNT(*) AS count FROM tasks');
      if (rows[0].count === 0) {
        const seedSQL = `
          INSERT INTO tasks (title, description, status, priority, due_date) VALUES
          ('Verify EC2 & RDS Connectivity', 'Confirm backend Docker container can read and write to Amazon RDS MySQL.', 'DONE', 'HIGH', CURDATE()),
          ('Inspect Docker Container Logs', 'Check backend and frontend container health status on EC2.', 'IN_PROGRESS', 'MEDIUM', DATE_ADD(CURDATE(), INTERVAL 1 DAY)),
          ('Test Full CRUD Operations', 'Create, filter, update, and delete tasks via the React frontend.', 'TODO', 'LOW', DATE_ADD(CURDATE(), INTERVAL 3 DAY))
        `;
        await connection.query(seedSQL);
        console.log('[DB] Seeded initial starter tasks.');
      }

      connection.release();
      console.log('[DB] Database schema verified and ready.');
      return;
    } catch (error) {
      console.error(`[DB] Connection attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      if (attempt >= maxRetries) {
        throw new Error(`[DB] Could not connect to MySQL after ${maxRetries} attempts.`);
      }
      const delay = Math.min(initialDelayMs * attempt, 10000);
      console.log(`[DB] Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

module.exports = {
  pool,
  initDatabase
};
