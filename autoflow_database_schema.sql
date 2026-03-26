-- AutoFlow Autonomous IT Operations System
-- SQLite Database Schema

-- Drop existing tables if they exist
DROP TABLE IF EXISTS feedback_logs;
DROP TABLE IF EXISTS executed_actions;
DROP TABLE IF EXISTS agent_decisions;
DROP TABLE IF EXISTS anomaly_reports;
DROP TABLE IF EXISTS telemetry_events;
DROP TABLE IF EXISTS agent_weights;
DROP TABLE IF EXISTS system_config;

-- Telemetry Events Table
CREATE TABLE telemetry_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trace_id TEXT NOT NULL,
    event_id TEXT NOT NULL UNIQUE,
    timestamp TEXT NOT NULL,
    source_system TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    service_name TEXT,
    container_id TEXT,
    pod_id TEXT,
    node_id TEXT,
    cluster_id TEXT,
    region TEXT,
    severity_level INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_telemetry_event_id ON telemetry_events(event_id);
CREATE INDEX idx_telemetry_trace_id ON telemetry_events(trace_id);
CREATE INDEX idx_telemetry_timestamp ON telemetry_events(timestamp);
CREATE INDEX idx_telemetry_service ON telemetry_events(service_name);
CREATE INDEX idx_telemetry_metric ON telemetry_events(metric_name);

-- Anomaly Reports Table
CREATE TABLE anomaly_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anomaly_id TEXT NOT NULL UNIQUE,
    trace_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    anomaly_score REAL NOT NULL,
    confidence_score REAL NOT NULL,
    detection_method TEXT,
    timestamp TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trace_id) REFERENCES telemetry_events(trace_id)
);

CREATE INDEX idx_anomaly_trace_id ON anomaly_reports(trace_id);
CREATE INDEX idx_anomaly_score ON anomaly_reports(anomaly_score);

-- Agent Decisions Table
CREATE TABLE agent_decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    decision_id TEXT NOT NULL UNIQUE,
    trace_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    anomaly_score REAL,
    risk_score REAL,
    sla_score REAL,
    context_score REAL,
    final_score REAL NOT NULL,
    recommended_action TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trace_id) REFERENCES telemetry_events(trace_id)
);

CREATE INDEX idx_decision_trace_id ON agent_decisions(trace_id);
CREATE INDEX idx_decision_final_score ON agent_decisions(final_score);
CREATE INDEX idx_decision_action ON agent_decisions(recommended_action);

-- Executed Actions Table
CREATE TABLE executed_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id TEXT NOT NULL UNIQUE,
    action_type TEXT NOT NULL,
    target_service TEXT NOT NULL,
    cluster_id TEXT,
    namespace TEXT,
    execution_time TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    execution_result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_action_type ON executed_actions(action_type);
CREATE INDEX idx_action_service ON executed_actions(target_service);
CREATE INDEX idx_action_status ON executed_actions(status);

-- Feedback Logs Table
CREATE TABLE feedback_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feedback_id TEXT NOT NULL UNIQUE,
    action_id TEXT NOT NULL,
    success_flag BOOLEAN NOT NULL,
    improvement_rate REAL,
    timestamp TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (action_id) REFERENCES executed_actions(action_id)
);

CREATE INDEX idx_feedback_action_id ON feedback_logs(action_id);
CREATE INDEX idx_feedback_success ON feedback_logs(success_flag);

-- Agent Weights Table (for adaptive learning)
CREATE TABLE agent_weights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weight_version INTEGER NOT NULL,
    anomaly_weight REAL NOT NULL DEFAULT 0.35,
    risk_weight REAL NOT NULL DEFAULT 0.25,
    sla_weight REAL NOT NULL DEFAULT 0.25,
    context_weight REAL NOT NULL DEFAULT 0.15,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

-- Insert default weights
INSERT INTO agent_weights (weight_version, anomaly_weight, risk_weight, sla_weight, context_weight, is_active) 
VALUES (1, 0.35, 0.25, 0.25, 0.15, 1);

-- System Configuration Table
CREATE TABLE system_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration
INSERT INTO system_config (config_key, config_value, description) VALUES
('anomaly_threshold', '3.0', 'Z-score threshold for anomaly detection'),
('decision_threshold_ignore', '0.4', 'Score below which events are ignored'),
('decision_threshold_alert', '0.7', 'Score above which automated remediation triggers'),
('learning_rate', '0.05', 'Agent weight update learning rate'),
('system_name', 'AutoFlow AI', 'System identification'),
('version', '6.0', 'System version');

-- Views for analytics

-- System Health Overview
CREATE VIEW v_system_health AS
SELECT 
    COUNT(DISTINCT te.service_name) as total_services,
    COUNT(te.id) as total_events,
    COUNT(ar.id) as total_anomalies,
    COUNT(ea.id) as total_actions,
    ROUND(AVG(CASE WHEN fl.success_flag = 1 THEN 100.0 ELSE 0.0 END), 2) as success_rate,
    DATE(te.created_at) as date
FROM telemetry_events te
LEFT JOIN anomaly_reports ar ON te.trace_id = ar.trace_id
LEFT JOIN executed_actions ea ON DATE(te.created_at) = DATE(ea.created_at)
LEFT JOIN feedback_logs fl ON ea.action_id = fl.action_id
GROUP BY DATE(te.created_at);

-- Service Performance View
CREATE VIEW v_service_performance AS
SELECT 
    service_name,
    metric_name,
    COUNT(*) as event_count,
    AVG(metric_value) as avg_value,
    MAX(metric_value) as max_value,
    MIN(metric_value) as min_value,
    COUNT(CASE WHEN ar.anomaly_id IS NOT NULL THEN 1 END) as anomaly_count
FROM telemetry_events te
LEFT JOIN anomaly_reports ar ON te.trace_id = ar.trace_id
WHERE te.created_at > datetime('now', '-24 hours')
GROUP BY service_name, metric_name;

-- Agent Performance View
CREATE VIEW v_agent_performance AS
SELECT 
    ad.agent_name,
    COUNT(*) as decision_count,
    AVG(ad.final_score) as avg_final_score,
    COUNT(CASE WHEN ad.final_score >= 0.7 THEN 1 END) as high_risk_decisions,
    COUNT(CASE WHEN ea.action_id IS NOT NULL THEN 1 END) as actions_triggered,
    ROUND(AVG(CASE WHEN fl.success_flag = 1 THEN 100.0 ELSE 0.0 END), 2) as success_rate
FROM agent_decisions ad
LEFT JOIN executed_actions ea ON DATE(ad.timestamp) = DATE(ea.execution_time)
LEFT JOIN feedback_logs fl ON ea.action_id = fl.action_id
WHERE ad.created_at > datetime('now', '-7 days')
GROUP BY ad.agent_name;

-- Recent Actions Dashboard
CREATE VIEW v_recent_actions AS
SELECT 
    ea.action_id,
    ea.action_type,
    ea.target_service,
    ea.execution_time,
    ea.status,
    fl.success_flag,
    fl.improvement_rate,
    ad.final_score,
    te.metric_name,
    te.metric_value
FROM executed_actions ea
LEFT JOIN feedback_logs fl ON ea.action_id = fl.action_id
LEFT JOIN agent_decisions ad ON DATE(ea.execution_time) = DATE(ad.timestamp)
LEFT JOIN telemetry_events te ON ad.trace_id = te.trace_id
WHERE ea.created_at > datetime('now', '-24 hours')
ORDER BY ea.created_at DESC;
