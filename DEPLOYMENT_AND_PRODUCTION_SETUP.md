#  `DEPLOYMENT_AND_PRODUCTION_SETUP.md`
## Production Deployment Overview

The AutoFlow system is deployed in a cloud-based, production-like environment to ensure real-time availability, scalability, and reliability.

### Core Infrastructure

* **Workflow Engine:** n8n deployed on **Render**
* **Database Layer:** **Neon Postgres (Serverless)**
* **Monitoring & Uptime:** **UptimeRobot**
* **Public Access:** Secure webhook endpoints exposed via Render

---

##  Deployment Architecture

```
[Telemetry Source / External Systems]
                ↓
        (HTTP Webhook)
                ↓
     n8n (Render Deployment)
                ↓
   Decision Engine + Agents
                ↓
     Neon Postgres Database
                ↓
      Dashboard / APIs / Logs
```

---

## Webhook Endpoint (Live System)

Telemetry data is ingested via publicly exposed webhook:

```
POST https://n8n-latest-1ikm.onrender.com/webhook/telemetry
```

### Example Test Payload

```bash
curl -X POST "https://n8n-latest-1ikm.onrender.com/webhook/telemetry" \
-H "Content-Type: application/json" \
-d "{\"trace_id\":\"test_003\",\"metric_name\":\"cpu_usage\",\"metric_value\":\"85\"}"
```

---

## Database (Neon Postgres)

The system uses **Neon Postgres** instead of local SQLite in deployment.

### Why Neon?

* Serverless scaling
* High availability
* Low-latency connections
* Suitable for real-time telemetry workloads

### Stored Data Includes:

* Telemetry events
* Anomaly reports
* Agent decisions
* Executed actions
* Feedback loops
* Agent weight evolution

---

##  Monitoring & Reliability

**UptimeRobot** is used to ensure continuous availability of the system.

### Monitoring Capabilities:

* Endpoint health checks (webhook availability)
* Downtime alerts
* Continuous pinging of deployed n8n instance

### Reliability Design:

* System remains externally accessible at all times
* Failures can be detected and responded to quickly
* Designed for long-running autonomous workflows

---

##  Scalability Considerations

The system is designed with scalability in mind:

* **Render Deployment**

  * Handles hosting and service uptime
  * Supports scaling of workflow execution

* **Neon Postgres**

  * Automatically scales with workload
  * Handles concurrent telemetry ingestion

* **Stateless Webhook Design**

  * Enables horizontal scaling of ingestion layer

---

##  Real-Time Autonomous Loop

The deployed system supports a continuous autonomous cycle:

1. Telemetry received via webhook
2. Data normalized and stored
3. Anomaly detection triggered
4. Multi-agent decision engine activated
5. Action executed (e.g., alerting/remediation)
6. Feedback logged for learning

---

## Production Readiness Notes

* The system is no longer limited to local execution
* Supports real-time external integrations
* Built with modular architecture for extensibility
* Monitoring ensures operational visibility

---
## Live Execution Proof

The deployed system successfully processes real-time telemetry events.

### Example Response from Live System

```json
{
  "status": "ok",
  "processed": true,
  "trace_id": "test_003",
  "timestamp": "2026-03-26T08:02:58.889-04:00"
}
'''

##  Summary

This deployment setup transforms AutoFlow from a prototype into a production-aware autonomous system, with:

* Cloud-hosted workflow execution
* Serverless scalable database
* Continuous uptime monitoring
* Real-time external accessibility

