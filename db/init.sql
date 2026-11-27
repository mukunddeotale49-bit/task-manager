-- Database initialization script for Task Manager
CREATE DATABASE IF NOT EXISTS taskmanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE taskmanager;

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

INSERT INTO tasks (title, description, status, priority, due_date)
SELECT * FROM (
    SELECT 'Launch AWS EC2 & RDS MySQL' AS title,
           'Provision EC2 instance and private RDS MySQL database in the same VPC.' AS description,
           'DONE' AS status,
           'HIGH' AS priority,
           CURDATE() AS due_date
    UNION ALL
    SELECT 'Connect Backend Container to RDS',
           'Configure DB_HOST endpoint in .env and start containers with Docker Compose.',
           'IN_PROGRESS' AS status,
           'HIGH' AS priority,
           DATE_ADD(CURDATE(), INTERVAL 1 DAY)
    UNION ALL
    SELECT 'Verify Full CRUD Operations',
           'Create, edit, filter, and delete tasks from the React frontend.',
           'TODO' AS status,
           'MEDIUM' AS priority,
           DATE_ADD(CURDATE(), INTERVAL 3 DAY)
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM tasks LIMIT 1);
