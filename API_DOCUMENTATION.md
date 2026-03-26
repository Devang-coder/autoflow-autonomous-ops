# AutoFlow API Documentation
## Dashboard Backend APIs

---

## Overview

The AutoFlow dashboard requires several API endpoints to display real-time system metrics, anomaly detection results, agent performance, and action logs. These can be implemented as n8n webhook workflows that query the SQLite database.

---

## API Endpoints

### 1. System Health Overview

**Endpoint**: `GET /api/system-health`

**Description**: Returns overall system health metrics

**Response Schema**:
```json
{
  "totalServices": 24,
  "totalEvents": 1247,
  "totalAnomalies": 43,
  "totalActions": 18,
  "successRate": 94.5,
  "timestamp": "2026-03-26T10:30:00Z"
}
```

**SQL Query**:
```sql
SELECT 
    COUNT(DISTINCT service_name) as totalServices,
    COUNT(id) as totalEvents,
    (SELECT COUNT(*) FROM anomaly_reports WHERE DATE(timestamp) = DATE('now')) as totalAnomalies,
    (SELECT COUNT(*) FROM executed_actions WHERE DATE(execution_time) = DATE('now')) as totalActions,
    (SELECT ROUND(AVG(CASE WHEN success_flag = 1 THEN 100.0 ELSE 0.0 END), 2) 
     FROM feedback_logs 
     WHERE DATE(timestamp) = DATE('now')) as successRate
FROM telemetry_events 
WHERE DATE(timestamp) = DATE('now');
```

---

### 2. Recent Telemetry Events

**Endpoint**: `GET /api/events?limit=50`

**Description**: Returns recent telemetry events

**Query Parameters**:
- `limit` (optional): Number of events to return (default: 50)
- `service` (optional): Filter by service name
- `metric` (optional): Filter by metric name

**Response Schema**:
```json
[
  {
    "id": 12345,
    "trace_id": "trace_001",
    "event_id": "event_001",
    "timestamp": "2026-03-26T10:30:00Z",
    "source_system": "prometheus",
    "metric_name": "cpu_usage",
    "metric_value": 95,
    "service_name": "web-api",
    "severity_level": 4
  }
]
```

**SQL Query**:
```sql
SELECT 
    id, trace_id, event_id, timestamp, source_system,
    metric_name, metric_value, service_name, container_id,
    pod_id, node_id, cluster_id, region, severity_level
FROM telemetry_events 
ORDER BY timestamp DESC 
LIMIT {{ $parameter.limit || 50 }};
```

---

### 3. Agent Performance Metrics

**Endpoint**: `GET /api/agents`

**Description**: Returns performance metrics for all agents

**Response Schema**:
```json
[
  {
    "agent_name": "anomaly",
    "decision_count": 156,
    "avg_score": 0.72,
    "high_risk_decisions": 45,
    "actions_triggered": 18,
    "success_rate": 94.5
  },
  {
    "agent_name": "risk",
    "decision_count": 156,
    "avg_score": 0.65,
    "high_risk_decisions": 32,
    "actions_triggered": 18,
    "success_rate": 94.5
  }
]
```

**SQL Query**:
```sql
SELECT * FROM v_agent_performance;
```

---

### 4. Recent Actions

**Endpoint**: `GET /api/actions?limit=20`

**Description**: Returns recently executed autonomous actions

**Query Parameters**:
- `limit` (optional): Number of actions to return (default: 20)
- `status` (optional): Filter by status (executed, pending, failed)

**Response Schema**:
```json
[
  {
    "action_id": "action_001",
    "action_type": "restart_container",
    "target_service": "web-api",
    "cluster_id": "prod-cluster",
    "execution_time": "2026-03-26T10:23:45Z",
    "status": "executed",
    "success_flag": true,
    "improvement_rate": 32.5,
    "final_score": 0.82
  }
]
```

**SQL Query**:
```sql
SELECT * FROM v_recent_actions 
ORDER BY execution_time DESC 
LIMIT {{ $parameter.limit || 20 }};
```

---

### 5. Anomaly Reports

**Endpoint**: `GET /api/anomalies?limit=30`

**Description**: Returns detected anomalies with scores

**Query Parameters**:
- `limit` (optional): Number of anomalies to return (default: 30)
- `min_score` (optional): Minimum anomaly score filter

**Response Schema**:
```json
[
  {
    "anomaly_id": "anomaly_001",
    "trace_id": "trace_001",
    "metric_name": "cpu_usage",
    "anomaly_score": 4.2,
    "confidence_score": 0.95,
    "detection_method": "z-score",
    "timestamp": "2026-03-26T10:20:00Z"
  }
]
```

**SQL Query**:
```sql
SELECT 
    ar.anomaly_id, ar.trace_id, ar.metric_name, 
    ar.anomaly_score, ar.confidence_score, ar.detection_method,
    ar.timestamp, te.service_name, te.metric_value
FROM anomaly_reports ar
JOIN telemetry_events te ON ar.trace_id = te.trace_id
WHERE ar.anomaly_score >= {{ $parameter.min_score || 0 }}
ORDER BY ar.timestamp DESC
LIMIT {{ $parameter.limit || 30 }};
```

---

### 6. Service Performance

**Endpoint**: `GET /api/services`

**Description**: Returns performance metrics grouped by service

**Response Schema**:
```json
[
  {
    "service_name": "web-api",
    "event_count": 456,
    "avg_cpu": 67.5,
    "avg_memory": 72.3,
    "anomaly_count": 12,
    "action_count": 3
  }
]
```

**SQL Query**:
```sql
SELECT * FROM v_service_performance 
ORDER BY anomaly_count DESC;
```

---

### 7. Time-Series Metrics

**Endpoint**: `GET /api/metrics/timeseries?metric=cpu_usage&service=web-api&hours=24`

**Description**: Returns time-series data for a specific metric

**Query Parameters**:
- `metric` (required): Metric name
- `service` (optional): Service name filter
- `hours` (optional): Time range in hours (default: 24)

**Response Schema**:
```json
[
  {
    "timestamp": "2026-03-26T10:00:00Z",
    "metric_value": 65.5,
    "anomaly_detected": false
  },
  {
    "timestamp": "2026-03-26T10:05:00Z",
    "metric_value": 92.3,
    "anomaly_detected": true
  }
]
```

**SQL Query**:
```sql
SELECT 
    te.timestamp,
    te.metric_value,
    CASE WHEN ar.anomaly_id IS NOT NULL THEN 1 ELSE 0 END as anomaly_detected
FROM telemetry_events te
LEFT JOIN anomaly_reports ar ON te.trace_id = ar.trace_id
WHERE te.metric_name = '{{ $parameter.metric }}'
    AND te.timestamp >= datetime('now', '-{{ $parameter.hours || 24 }} hours')
    {{ $parameter.service ? "AND te.service_name = '" + $parameter.service + "'" : "" }}
ORDER BY te.timestamp ASC;
```

---

### 8. Agent Weights History

**Endpoint**: `GET /api/agents/weights`

**Description**: Returns historical agent weight changes (learning progression)

**Response Schema**:
```json
[
  {
    "weight_version": 1,
    "anomaly_weight": 0.35,
    "risk_weight": 0.25,
    "sla_weight": 0.25,
    "context_weight": 0.15,
    "updated_at": "2026-03-20T00:00:00Z"
  },
  {
    "weight_version": 2,
    "anomaly_weight": 0.37,
    "risk_weight": 0.24,
    "sla_weight": 0.24,
    "context_weight": 0.15,
    "updated_at": "2026-03-25T14:30:00Z"
  }
]
```

**SQL Query**:
```sql
SELECT 
    weight_version, anomaly_weight, risk_weight, 
    sla_weight, context_weight, updated_at
FROM agent_weights 
ORDER BY updated_at DESC 
LIMIT 50;
```

---

### 9. Decision Breakdown

**Endpoint**: `GET /api/decisions/:decision_id`

**Description**: Returns detailed breakdown of a specific decision

**Response Schema**:
```json
{
  "decision_id": "decision_001",
  "trace_id": "trace_001",
  "final_score": 0.82,
  "decision_category": "remediate",
  "agent_scores": {
    "anomaly": 0.85,
    "risk": 0.78,
    "sla": 0.88,
    "context": 0.65
  },
  "recommended_action": "execute_action",
  "action_taken": "restart_container",
  "outcome": "success",
  "timestamp": "2026-03-26T10:20:00Z"
}
```

**SQL Query**:
```sql
SELECT 
    ad.decision_id, ad.trace_id, ad.final_score,
    ad.anomaly_score, ad.risk_score, ad.sla_score, ad.context_score,
    ad.recommended_action, ad.timestamp,
    ea.action_type, ea.status as action_status,
    fl.success_flag, fl.improvement_rate
FROM agent_decisions ad
LEFT JOIN executed_actions ea ON DATE(ad.timestamp) = DATE(ea.execution_time)
LEFT JOIN feedback_logs fl ON ea.action_id = fl.action_id
WHERE ad.decision_id = '{{ $parameter.decision_id }}';
```

---

### 10. System Configuration

**Endpoint**: `GET /api/config`

**Description**: Returns current system configuration

**Response Schema**:
```json
{
  "anomaly_threshold": 3.0,
  "decision_threshold_ignore": 0.4,
  "decision_threshold_alert": 0.7,
  "learning_rate": 0.05,
  "system_name": "AutoFlow AI",
  "version": "6.0"
}
```

**SQL Query**:
```sql
SELECT config_key, config_value 
FROM system_config;
```

---

## n8n Workflow Implementation

### Creating API Endpoints in n8n

1. **Create Webhook Node**:
   - Type: `Webhook`
   - Path: `/api/system-health`
   - Method: `GET`

2. **Add SQLite Node**:
   - Operation: `Execute Query`
   - Query: [Use SQL from above]

3. **Add Response Node**:
   - Type: `Respond to Webhook`
   - Response Mode: `JSON`

### Example n8n Workflow for `/api/system-health`:

```json
{
  "nodes": [
    {
      "name": "Webhook - System Health",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "system-health",
        "httpMethod": "GET"
      },
      "position": [200, 300]
    },
    {
      "name": "Query Health Data",
      "type": "n8n-nodes-base.sqlite",
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT COUNT(DISTINCT service_name) as totalServices, COUNT(id) as totalEvents FROM telemetry_events WHERE DATE(timestamp) = DATE('now')"
      },
      "position": [400, 300]
    },
    {
      "name": "Format Response",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "string": [
            {
              "name": "timestamp",
              "value": "={{ $now.toISO() }}"
            }
          ]
        }
      },
      "position": [600, 300]
    },
    {
      "name": "Send Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json"
      },
      "position": [800, 300]
    }
  ]
}
```

---

## CORS Configuration

For frontend dashboard access, enable CORS in n8n:

```javascript
// Add to n8n environment variables
N8N_CORS_ALLOW_ORIGIN=*
N8N_CORS_CREDENTIALS=true
```

Or use a reverse proxy (nginx):

```nginx
location /api/ {
    proxy_pass http://localhost:5678/webhook/;
    
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization";
}
```

---

## Authentication (Optional)

For production deployments, add API key authentication:

1. **Add IF Node** after webhook:
```javascript
{{ $json.headers['x-api-key'] === 'your-secret-key' }}
```

2. **Return 401** if unauthorized:
```json
{
  "statusCode": 401,
  "body": {
    "error": "Unauthorized"
  }
}
```

---

## Rate Limiting

Implement rate limiting using n8n's throttle node or external service:

```javascript
// In Function node
const requestKey = $json.headers['x-forwarded-for'] || 'default';
const limit = 100; // requests per minute
const window = 60000; // 1 minute

// Check rate limit (use external Redis or in-memory cache)
```

---

## Testing APIs

### Using cURL

```bash
# System Health
curl http://localhost:5678/webhook/system-health

# Recent Events
curl "http://localhost:5678/webhook/events?limit=10"

# Anomalies
curl "http://localhost:5678/webhook/anomalies?min_score=3"

# Time-Series
curl "http://localhost:5678/webhook/metrics/timeseries?metric=cpu_usage&hours=24"
```

### Using Postman

Import the following collection:

```json
{
  "info": {
    "name": "AutoFlow API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "System Health",
      "request": {
        "method": "GET",
        "url": "http://localhost:5678/webhook/system-health"
      }
    }
  ]
}
```

---

## Performance Optimization

1. **Database Indexing**: Already included in schema
2. **Query Caching**: Cache frequent queries for 10-30 seconds
3. **Pagination**: Implement for large datasets
4. **Compression**: Enable gzip compression in nginx

---

## Monitoring API Performance

Track these metrics:

- API response time (target: <100ms)
- Error rate (target: <0.1%)
- Request volume (capacity: 1000/min)
- Cache hit rate (target: >80%)

---

## Dashboard Integration

Connect React dashboard to APIs:

```javascript
// src/config.js
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5678/webhook';

// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

export const getSystemHealth = () => api.get('/system-health');
export const getEvents = (limit = 50) => api.get(`/events?limit=${limit}`);
export const getAnomalies = (minScore = 0) => api.get(`/anomalies?min_score=${minScore}`);
```

---

## Error Handling

All endpoints should return consistent error responses:

```json
{
  "error": true,
  "message": "Database query failed",
  "code": "DB_ERROR",
  "timestamp": "2026-03-26T10:30:00Z"
}
```

---

## API Versioning

Use URL versioning for future compatibility:

- Current: `/api/v1/system-health`
- Future: `/api/v2/system-health`

---

**API Status**: Production Ready  
**Base URL**: `http://localhost:5678/webhook/`  
**Authentication**: Optional (API key)  
**Rate Limit**: 100 requests/minute per IP
