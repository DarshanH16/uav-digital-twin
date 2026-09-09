# MALE UAV Aero Piston Engine - Digital Twin Model

### 🇮🇳 Smart India Hackathon (SIH) 2026 | Sponsoring Ministry: DRDO
**Problem Statement ID:** `SIH26054`  
**Track:** Software  
**Theme:** Robotics and Drones  
**Title:** AI-Enabled Real-Time Digital Twin System for Health Monitoring, Fault Prediction and Mission Reliability Enhancement of Aero Piston Engines used in MALE UAVs

---

## 🌟 Overview & System Highlights

This project implements a complete **Digital Twin System** for MALE (Medium-Altitude Long-Endurance) UAV aero piston engines. The software combines:
1. **Interactive 3D Engine Model:** Procedurally constructed 4-Cylinder Horizontally Opposed (Boxer) Aero Piston Engine with reciprocating pistons, rotating crankshaft, carbon fiber propeller, and mounted sensors built with **Three.js**.
2. **Thermal Heatmap Visualization:** Real-time emissive cylinder head shading mapped to live Cylinder Head Temperature (CHT) telemetry.
3. **Live Telemetry Engine (10 Hz):** Simulates engine speed (RPM), CHT, Exhaust Gas Temperature (EGT), Oil Pressure, Fuel Flow, and Vibration RMS.
4. **AI Anomaly Detection & RUL Estimator:** Multivariate anomaly risk scoring (Isolation Forest algorithm), Remaining Useful Life (RUL) prediction, and SHAP feature importance explainability.
5. **In-Flight Mission Advisory Engine:** Real-time decision support for Ground Control Station (GCS) operators (e.g., *Nominal Flight*, *Throttle Reduction Advisory*, *Emergency Return to Base*).
6. **Exploded View & Component Inspection:** Clickable 3D engine components with detailed diagnostic stats and health history modals.

---

## 📸 Key Features & Fault Injection Scenarios

### Preset Flight Regimes
* 🛫 **Cruise (75% Power):** 5,200 RPM nominal operation.
* 🚀 **Max Takeoff (100% Power):** 6,000 RPM high-load regime.
* 🛰️ **High-Altitude Loiter:** 4,400 RPM fuel-efficient patrol.
* 🛑 **Ground Idle:** 1,600 RPM pre-flight checkout.

### Simulated Fault Scenarios
* 🔥 **Cylinder #2 Thermal Overheat Spike:** Simulates CHT rising above 225°C. Triggering 3D thermal glow and GCS warning advisory.
* 🛢️ **Oil Line Pressure Failure:** Simulates oil pressure collapsing to 1.4 bar. Triggers critical alert to initiate immediate Return To Base (RTB).
* ⚡ **Spark Plug Misfire / Vibration:** Simulates cylinder misfire causing high vibration RMS (> 8.0 mm/s) and cold EGT on Cyl #3.

---

## 🛠️ Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Digital Twin Web Application (Browser)               │
├───────────────────────────────────┬────────────────────────────────────┤
│ 3D Engine Renderer (Three.js)    │ Telemetry Gauges & Event Logs      │
│ Real-time Thermal Shading Shader  │ Chart.js Time-Series Telemetry     │
├───────────────────────────────────┴────────────────────────────────────┤
│ AI Diagnostic Engine (Isolation Forest, Multivariate z-score, SHAP)   │
└────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ (WebSocket / HTTP Stream)
┌───────────────────────────────────┴────────────────────────────────────┐
│          Optional Python Telemetry Server (FastAPI / PyTorch)           │
└────────────────────────────────────────────────────────────────────────┘
```

* **Frontend:** HTML5, Tailwind CSS, Lucide Icons, Chart.js
* **3D Canvas & Shader:** Three.js, OrbitControls, WebGL
* **AI Models:** Isolation Forest (Anomaly Risk), Multivariate Regression (RUL), SHAP (Explainability)
* **Backend (Optional):** Python 3 FastAPI, WebSockets, Scikit-Learn

---

## 🚀 Quick Start Guide

### Option 1: Standalone Web Application (No Server Required)
Simply open `index.html` directly in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari):

```bash
# On Mac
open index.html

# Or start a simple local HTTP server
python3 -m http.server 8080
```
Then navigate to `http://localhost:8080` in your web browser.

### Option 2: Run with Python FastAPI Telemetry Backend
```bash
# Install optional dependencies
pip install fastapi uvicorn websockets scikit-learn numpy

# Start Python telemetry backend
python3 telemetry_server.py
```

---

## 🏆 SIH Hackathon Presentation Strategy (DRDO Focus)

1. **Problem Context:** Explain the mission criticality of MALE UAV aero piston engines (e.g. Rustom-1, TAPAS-BH-201) operating over long durations.
2. **Digital Twin Value:** Highlight how real-time 3D telemetry and early AI fault detection prevent catastrophic in-flight engine failures and lost assets.
3. **Physics + AI Hybrid Approach:** Emphasize the combination of physics-based thermal thresholds and machine learning anomaly detection.
4. **Explainable AI (XAI):** Show how SHAP values explain *why* an anomaly risk is high (e.g., Cylinder #2 CHT vs Oil Pressure).
5. **Live Demo:** Trigger the "Cylinder Overheat" and "Oil Loss" fault injection buttons live to demonstrate the immediate 3D visual feedback and GCS mission advisory update.

---

## 📁 Project Structure

```
uav-digital-twin/
├── index.html            # Main Web Dashboard & Layout
├── engine3d.js           # Three.js 3D Aero Piston Engine Model & Animation
├── app.js                # Telemetry Simulator & AI Diagnostic Controller
├── telemetry_server.py   # Optional FastAPI / WebSocket Telemetry Server
└── README.md             # Complete Documentation
```
