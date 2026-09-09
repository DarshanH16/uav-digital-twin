/**
 * Digital Twin Application Controller & Telemetry Simulation Engine
 * Sponsoring Challenge: SIH26054 (DRDO) - MALE UAV Aero Piston Engine Health
 */

// State variables
let currentFlightProfile = 'CRUISE';
let currentFaultMode = 'NORMAL';
let targetRPM = 5200;
let simulationInterval = null;
let logCount = 0;

// Sensor State
let telemetryState = {
    rpm: 5200,
    cht: [160, 162, 158, 161], // Cylinder Head Temps °C (Cyl 1,2,3,4)
    egt: [740, 745, 738, 742], // Exhaust Gas Temps °C
    oilPressure: 4.8,          // bar (Normal: 4.0 - 5.5)
    oilTemp: 88,               // °C
    vibrationRMS: 2.1,         // mm/s (Normal: < 4.0)
    fuelFlow: 18.5,            // L/hr
    manifoldPressure: 28.2,    // inHg
    healthIndex: 98.4,         // %
    anomalyRisk: 1.2,          // %
    rulHours: 412.5,           // hours remaining
    advisoryStatus: 'NOMINAL'
};

// Chart instances
let chartChtInstance = null;
let chartOilVibInstance = null;

// Telemetry History Arrays for Charts
const MAX_DATA_POINTS = 30;
let timeLabels = [];
let chtHistory = [];
let oilHistory = [];
let vibHistory = [];

window.addEventListener('DOMContentLoaded', () => {
    initCharts();
    startTelemetryStream();
    logEvent('Digital Twin engine telemetry initialized at 10 Hz', 'info');
});

/**
 * Initialize Chart.js Time-Series Telemetry Charts
 */
function initCharts() {
    const ctxCht = document.getElementById('chartCht');
    const ctxOilVib = document.getElementById('chartOilVib');

    if (!ctxCht || !ctxOilVib) return;

    // Fill initial time labels
    for (let i = MAX_DATA_POINTS - 1; i >= 0; i--) {
        timeLabels.push(`-${i}s`);
        chtHistory.push(161);
        oilHistory.push(4.8);
        vibHistory.push(2.1);
    }

    // CHT Chart
    chartChtInstance = new Chart(ctxCht, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'Avg CHT (°C)',
                data: chtHistory,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: { display: false },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8', font: { size: 9 } }
                }
            },
            plugins: { legend: { display: false } }
        }
    });

    // Oil Pressure & Vibration Chart
    chartOilVibInstance = new Chart(ctxOilVib, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [
                {
                    label: 'Oil Press (bar)',
                    data: oilHistory,
                    borderColor: '#38bdf8',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.3,
                    pointRadius: 0
                },
                {
                    label: 'Vib RMS (mm/s)',
                    data: vibHistory,
                    borderColor: '#a855f7',
                    borderWidth: 2,
                    borderDash: [3, 3],
                    fill: false,
                    tension: 0.3,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: { display: false },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8', font: { size: 9 } }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

/**
 * 10 Hz Telemetry Streaming Loop
 */
function startTelemetryStream() {
    if (simulationInterval) clearInterval(simulationInterval);

    simulationInterval = setInterval(() => {
        updateTelemetryPhysics();
        runAIEngineDiagnostics();
        updateUIElements();
    }, 100); // 100ms = 10 Hz
}

/**
 * Simulate Realistic Sensor Physics & Anomaly Behaviors
 */
function updateTelemetryPhysics() {
    // Smoothly interpolate RPM towards targetRPM
    telemetryState.rpm += (targetRPM - telemetryState.rpm) * 0.1;
    const noise = () => (Math.random() - 0.5);

    // Update Engine RPM in 3D scene
    if (typeof updateEngineRPM === 'function') {
        updateEngineRPM(telemetryState.rpm);
    }

    const loadFactor = telemetryState.rpm / 6000;

    // Normal Physics calculation
    let baseCht = 140 + (loadFactor * 30) + noise();
    let baseEgt = 680 + (loadFactor * 90) + (noise() * 3);
    let baseOil = 5.2 - (loadFactor * 0.6) + (noise() * 0.05);
    let baseVib = 1.5 + (loadFactor * 1.2) + (noise() * 0.1);

    telemetryState.cht = [
        baseCht + noise(),
        baseCht + noise(),
        baseCht + noise(),
        baseCht + noise()
    ];
    telemetryState.egt = [
        baseEgt + noise(),
        baseEgt + noise(),
        baseEgt + noise(),
        baseEgt + noise()
    ];
    telemetryState.oilPressure = baseOil;
    telemetryState.vibrationRMS = baseVib;

    // Apply Fault Injection Anomalies
    if (currentFaultMode === 'CYLINDER_OVERHEAT') {
        // Severe thermal spike in Cylinder #2
        telemetryState.cht[1] += 65.0; // Spikes to ~225°C
        telemetryState.egt[1] += 80.0;
        telemetryState.vibrationRMS += 1.8;
    } else if (currentFaultMode === 'OIL_PRESSURE_DROP') {
        // Oil leak / pump pressure collapse
        telemetryState.oilPressure = Math.max(1.4, telemetryState.oilPressure - 0.12); // Drops to 1.4 bar
        telemetryState.vibrationRMS += 2.6; // High friction vibration
        telemetryState.cht = telemetryState.cht.map(t => t + 18.0);
    } else if (currentFaultMode === 'VIBRATION_MISFIRE') {
        // Spark plug misfire / unbalance
        telemetryState.vibrationRMS = 8.4 + (noise() * 0.8); // Severe vibration spike > 8.0 mm/s
        telemetryState.egt[2] -= 120.0; // Cyl #3 cold exhaust due to unburned fuel
        telemetryState.rpm += noise() * 150; // Unstable RPM hunting
    }

    // Send updated cylinder temps to 3D renderer
    if (typeof updateCylinderTemps === 'function') {
        updateCylinderTemps(telemetryState.cht);
    }
}

/**
 * AI Predictive Anomaly Detection, RUL Estimation, & SHAP Explainer
 */
function runAIEngineDiagnostics() {
    const avgCht = telemetryState.cht.reduce((a, b) => a + b, 0) / 4;
    const maxCht = Math.max(...telemetryState.cht);
    const oil = telemetryState.oilPressure;
    const vib = telemetryState.vibrationRMS;

    let anomalyRisk = 1.2;
    let healthIndex = 98.4;
    let rulHours = 412.5;

    // Feature Contribution Weights for Explainability
    let shapCht = 10;
    let shapOil = 8;
    let shapVib = 5;

    // Anomaly Rule Evaluation
    if (maxCht > 210) {
        // Thermal Overheat Anomaly
        const tempExceed = maxCht - 180;
        anomalyRisk = Math.min(99.8, 45.0 + tempExceed * 1.5);
        healthIndex = Math.max(15.0, 98.4 - tempExceed * 1.4);
        rulHours = Math.max(4.2, 412.5 - tempExceed * 6.5);

        shapCht = 78;
        shapOil = 12;
        shapVib = 10;

        updateMissionAdvisory(
            'THERMAL WARNING: CYLINDER #2 OVERHEAT - REDUCE PWR TO 60%',
            'WARNING',
            'alert-triangle',
            'border-amber-500/50 bg-amber-950/40 text-amber-400'
        );
    } else if (oil < 2.5) {
        // Low Oil Pressure Emergency
        const oilDrop = 4.8 - oil;
        anomalyRisk = Math.min(99.9, 70.0 + oilDrop * 15.0);
        healthIndex = Math.max(8.0, 98.4 - oilDrop * 25.0);
        rulHours = Math.max(1.5, 412.5 - oilDrop * 110.0);

        shapCht = 15;
        shapOil = 75;
        shapVib = 10;

        updateMissionAdvisory(
            'CRITICAL: OIL PRESSURE LOSS - INITIATE IMMEDIATE RTB / EMERGENCY LAND',
            'CRITICAL',
            'alert-octagon',
            'border-rose-500/60 bg-rose-950/60 text-rose-400 animate-pulse'
        );
    } else if (vib > 6.0) {
        // High Vibration Anomaly
        const vibSpike = vib - 3.5;
        anomalyRisk = Math.min(95.0, 35.0 + vibSpike * 12.0);
        healthIndex = Math.max(35.0, 98.4 - vibSpike * 10.0);
        rulHours = Math.max(24.0, 412.5 - vibSpike * 45.0);

        shapCht = 10;
        shapOil = 15;
        shapVib = 75;

        updateMissionAdvisory(
            'VIBRATION ANOMALY: SPARK PLUG / CYL 3 MISFIRE DETECTED - INSPECT ENGINE',
            'WARNING',
            'activity',
            'border-purple-500/50 bg-purple-950/40 text-purple-400'
        );
    } else {
        // Nominal
        updateMissionAdvisory(
            'NOMINAL FLIGHT PROFILE - OK TO CONTINUE MISSION',
            'NOMINAL',
            'shield-check',
            'border-emerald-500/40 bg-emerald-950/30 text-emerald-400'
        );
    }

    telemetryState.anomalyRisk = anomalyRisk;
    telemetryState.healthIndex = healthIndex;
    telemetryState.rulHours = rulHours;

    // Update SHAP Bars in UI
    document.getElementById('shap-cht2-val').innerText = `${shapCht}%`;
    document.getElementById('shap-cht2-bar').style.width = `${shapCht}%`;

    document.getElementById('shap-oil-val').innerText = `${shapOil}%`;
    document.getElementById('shap-oil-bar').style.width = `${shapOil}%`;

    document.getElementById('shap-vib-val').innerText = `${shapVib}%`;
    document.getElementById('shap-vib-bar').style.width = `${shapVib}%`;
}

/**
 * Update UI Telemetry Cards, Gauges, & Time-series Charts
 */
function updateUIElements() {
    const avgCht = (telemetryState.cht.reduce((a, b) => a + b, 0) / 4).toFixed(0);
    const avgEgt = (telemetryState.egt.reduce((a, b) => a + b, 0) / 4).toFixed(0);

    // Gauges
    document.getElementById('gauge-cht').innerText = `${avgCht} °C`;
    document.getElementById('gauge-egt').innerText = `${avgEgt} °C`;
    document.getElementById('gauge-oil').innerText = `${telemetryState.oilPressure.toFixed(1)} bar`;
    document.getElementById('gauge-vib').innerText = `${telemetryState.vibrationRMS.toFixed(1)} mm/s`;

    // Health Scores
    document.getElementById('health-index-score').innerText = `${telemetryState.healthIndex.toFixed(1)}%`;
    document.getElementById('anomaly-score').innerText = `${telemetryState.anomalyRisk.toFixed(1)}%`;
    document.getElementById('rul-hours').innerText = `${telemetryState.rulHours.toFixed(1)} hrs`;

    // Health Index Circle SVG offset
    const circle = document.getElementById('health-circle');
    if (circle) {
        const offset = 138 - (138 * (telemetryState.healthIndex / 100));
        circle.style.strokeDashoffset = offset;
    }

    // Cyl #2 Status indicator in 3D footer
    const cyl2Ind = document.getElementById('cyl2-indicator');
    if (cyl2Ind) {
        if (telemetryState.cht[1] > 200) {
            cyl2Ind.className = 'w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping';
        } else {
            cyl2Ind.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500';
        }
    }

    // Update Charts
    chtHistory.shift();
    chtHistory.push(avgCht);

    oilHistory.shift();
    oilHistory.push(telemetryState.oilPressure.toFixed(1));

    vibHistory.shift();
    vibHistory.push(telemetryState.vibrationRMS.toFixed(1));

    if (chartChtInstance) chartChtInstance.update('none');
    if (chartOilVibInstance) chartOilVibInstance.update('none');

    document.getElementById('chart-cht-val').innerText = `${avgCht}°C`;
    document.getElementById('chart-oil-val').innerText = `${telemetryState.oilPressure.toFixed(1)} bar`;
}

/**
 * Update Mission Advisory Badge
 */
function updateMissionAdvisory(text, level, iconName, cssClasses) {
    const badge = document.getElementById('mission-advisory-badge');
    const textElem = document.getElementById('advisory-text');
    const iconElem = document.getElementById('advisory-icon');

    if (!badge || !textElem) return;

    textElem.innerText = text;
    badge.className = `glass-panel px-4 py-2 rounded-xl border flex items-center gap-3 transition-all duration-300 ${cssClasses}`;

    if (iconElem) {
        iconElem.setAttribute('data-lucide', iconName);
        if (window.lucide) lucide.createIcons();
    }
}

/**
 * Control Handler: Set Preset Flight Profile
 */
function setFlightProfile(profile) {
    currentFlightProfile = profile;

    // Reset button styles
    ['btn-cruise', 'btn-takeoff', 'btn-loiter', 'btn-idle'].forEach(id => {
        const b = document.getElementById(id);
        if (b) {
            b.className = 'py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition';
        }
    });

    if (profile === 'CRUISE') {
        targetRPM = 5200;
        document.getElementById('btn-cruise').className = 'py-2 px-3 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500 transition';
    } else if (profile === 'TAKEOFF') {
        targetRPM = 6000;
        document.getElementById('btn-takeoff').className = 'py-2 px-3 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500 transition';
    } else if (profile === 'LOITER') {
        targetRPM = 4400;
        document.getElementById('btn-loiter').className = 'py-2 px-3 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500 transition';
    } else if (profile === 'IDLE') {
        targetRPM = 1600;
        document.getElementById('btn-idle').className = 'py-2 px-3 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500 transition';
    }

    document.getElementById('slider-rpm').value = targetRPM;
    document.getElementById('slider-rpm-val').innerText = `${targetRPM} RPM`;

    logEvent(`Flight Profile changed to ${profile} (${targetRPM} RPM)`, 'info');
}

/**
 * Control Handler: Manual RPM Slider
 */
function updateManualRPM(val) {
    targetRPM = parseInt(val);
    document.getElementById('slider-rpm-val').innerText = `${targetRPM} RPM`;
}

/**
 * Control Handler: Inject Fault Scenario
 */
function injectFault(faultType) {
    currentFaultMode = faultType;

    if (faultType === 'NORMAL') {
        logEvent('Fault Injection cleared. Restoring Normal Operation.', 'success');
    } else if (faultType === 'CYLINDER_OVERHEAT') {
        logEvent('FAULT INJECTED: Cylinder #2 Thermal Overheat Spike triggered', 'warning');
    } else if (faultType === 'OIL_PRESSURE_DROP') {
        logEvent('FAULT INJECTED: Oil Line Pressure Loss / Pump Failure triggered', 'error');
    } else if (faultType === 'VIBRATION_MISFIRE') {
        logEvent('FAULT INJECTED: Spark Plug Misfire & Mechanical Vibration triggered', 'error');
    }
}

/**
 * Log System Diagnostic Events
 */
function logEvent(msg, type = 'info') {
    const container = document.getElementById('event-log-container');
    if (!container) return;

    logCount++;
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0').substring(0, 2);

    let colorClass = 'text-slate-300';
    if (type === 'success') colorClass = 'text-emerald-400 font-semibold';
    if (type === 'warning') colorClass = 'text-amber-400 font-semibold';
    if (type === 'error') colorClass = 'text-rose-400 font-bold';
    if (type === 'info') colorClass = 'text-sky-400';

    const logDiv = document.createElement('div');
    logDiv.className = colorClass;
    logDiv.innerText = `[${timestamp}] ${msg}`;

    container.appendChild(logDiv);
    container.scrollTop = container.scrollHeight;
}

function clearLogs() {
    const container = document.getElementById('event-log-container');
    if (container) container.innerHTML = '';
}
