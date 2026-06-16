// CyberRakshak Kids - Platform Application Logic

// Global Application State
let state = {
  profiles: [],
  incidents: [],
  evidence: [],
  learningCenter: [],
  scanTemplates: []
};

// Currently selected profile for dashboards
let currentChildId = "child_1";

// ----------------------------------------------------
// DATABASE MANAGEMENT (Local Storage Sync)
// ----------------------------------------------------
function initDatabase() {
  const localData = localStorage.getItem("cyberrakshak_db");
  if (localData) {
    try {
      state = JSON.parse(localData);
    } catch (e) {
      console.error("Failed to parse local storage database. Reverting to defaults.", e);
      state = { ...DEFAULT_DATA };
      saveState();
    }
  } else {
    // Populate default mock data from mockData.js
    state = { ...DEFAULT_DATA };
    saveState();
  }
}

function saveState() {
  localStorage.setItem("cyberrakshak_db", JSON.stringify(state));
}

// ----------------------------------------------------
// AI AGENT 1: CHILD CYBER SAFETY AGENT (Threat Scanner)
// ----------------------------------------------------
function runChildCyberSafetyAgent(textContent) {
  const text = textContent.trim();
  if (!text) {
    return {
      threatCategory: "None",
      riskScore: 0,
      severity: "Safe",
      reasoning: "No content submitted for evaluation.",
      evidenceSnippets: "N/A",
      recommendedAction: "N/A"
    };
  }

  // Define keyword-based heuristics
  const groomingPatterns = [
    { pattern: /(don't|do not) tell (your )?(parent|mom|dad|mother|father)/i, desc: "Secrets from parents requested" },
    { pattern: /keep (our )?secret/i, desc: "Secret relationship pressure" },
    { pattern: /send (me )?(a )?(photo|pic|picture|selfie)/i, desc: "Request for personal media" },
    { pattern: /meet (up)?/i, desc: "Offline meeting request" },
    { pattern: /meet (at|in|near) the/i, desc: "Specific location proposal" },
    { pattern: /mature for your age/i, desc: "Flattery and age-inappropriate validation" },
    { pattern: /best friends/i, desc: "Rapid intimacy development" }
  ];

  const bullyingPatterns = [
    { pattern: /(loser|ugly|stupid|idiot|trash)/i, desc: "Derogatory personal insults" },
    { pattern: /(hang|kill|die|uninstall) (your|yourself)/i, desc: "Pressure to self-harm or suicide" },
    { pattern: /everyone hates you/i, desc: "Social exclusion pressure" },
    { pattern: /(leak|dox|doxxing) your/i, desc: "Threat of personal data exposure" },
    { pattern: /find your IP/i, desc: "Intimidation / IP address leak threat" }
  ];

  const scamPatterns = [
    { pattern: /free (robux|v-bucks|vbucks|gems|coins|diamonds|currency)/i, desc: "Deceptive gaming currency offer" },
    { pattern: /claim (now|instant|gift|giftcard)/i, desc: "Urgent claim incentive" },
    { pattern: /verify (password|credentials|login)/i, desc: "Credential harvesting attempt" },
    { pattern: /http[s]?:\/\/[^\s]+(login|phish|verify|claim|support|security)/i, desc: "Suspicious login link detected" },
    { pattern: /account (locked|suspended|banned)/i, desc: "Fear-inducing social engineering" }
  ];

  let matches = [];
  let score = 0;
  let category = "Safe";
  let severity = "Safe";
  let reasoning = "Content contains standard conversations. No patterns of grooming, cyberbullying, or online scams were detected.";
  let recommendations = "No threat actions required. Continue practicing safe online habits.";
  let snippets = [];

  // 1. Check Grooming
  let groomingMatches = 0;
  groomingPatterns.forEach(item => {
    if (item.pattern.test(text)) {
      groomingMatches++;
      const matchedText = text.match(item.pattern)[0];
      snippets.push(`"${matchedText}" (${item.desc})`);
    }
  });

  if (groomingMatches > 0) {
    category = "Online Grooming";
    score = Math.min(100, 35 + groomingMatches * 20);
    if (groomingMatches >= 3) {
      severity = "Critical";
      reasoning = "High concentration of predatory grooming signals. Strangers attempting to enforce secrets, request physical meetings, and extract photographs.";
      recommendations = "IMMEDIATE ACTION REQUIRED: Block this contact, preserve screenshots, restrict physical mobility, and file a formal report with Ahmedabad Cyber Crime Branch.";
    } else if (groomingMatches >= 1) {
      severity = "High";
      reasoning = "Identified suspicious conversation patterns typical of grooming. Stranger is building rapid intimacy and asking to keep secrets.";
      recommendations = "Alert parents immediately. Do not share any photos or meet this individual offline. Block caller.";
    }
  }

  // 2. Check Cyberbullying (if not already set to high grooming)
  if (severity !== "Critical") {
    let bullyingMatches = 0;
    bullyingPatterns.forEach(item => {
      if (item.pattern.test(text)) {
        bullyingMatches++;
        const matchedText = text.match(item.pattern)[0];
        snippets.push(`"${matchedText}" (${item.desc})`);
      }
    });

    if (bullyingMatches > 0 && score < (20 + bullyingMatches * 20)) {
      category = "Cyberbullying";
      score = Math.min(100, 30 + bullyingMatches * 20);
      if (bullyingMatches >= 3 || /kill yourself|hang yourself/i.test(text)) {
        severity = "High";
        reasoning = "Severe harassment detected containing pressure to self-harm and direct safety threats.";
        recommendations = "Notify parents or school counselor. Enable application block tools on this user. Do not respond to insults.";
      } else {
        severity = "Medium";
        reasoning = "Hostile peer behavior detected containing insults or exclusion statements.";
        recommendations = "Mute or block user. Check in with the child regarding game session hostility.";
      }
    }
  }

  // 3. Check Scams
  if (severity !== "Critical" && severity !== "High") {
    let scamMatches = 0;
    scamPatterns.forEach(item => {
      if (item.pattern.test(text)) {
        scamMatches++;
        const matchedText = text.match(item.pattern)[0];
        snippets.push(`"${matchedText}" (${item.desc})`);
      }
    });

    if (scamMatches > 0 && score < (25 + scamMatches * 20)) {
      category = "Scam & Phishing";
      score = Math.min(100, 25 + scamMatches * 20);
      if (scamMatches >= 2 || /http[s]?:\/\//.test(text)) {
        severity = "High";
        reasoning = "Phishing attack detected. Content redirects user to unverified external domains requesting account credentials.";
        recommendations = "Do NOT click the links. Delete message. Change gaming platform passwords if credentials were typed.";
      } else {
        severity = "Medium";
        reasoning = "Scam offer targeting account details using bait tactics (free game coins).";
        recommendations = "Ignore free offers. Report the accounts distributing scam messages.";
      }
    }
  }

  // Fallback for simple positive/low match
  if (score === 0 && text.length > 5) {
    // Check for some milder keywords to trigger a low score for safety tests
    if (/(hate|stupid|dummy|noob)/i.test(text)) {
      category = "Harassment";
      score = 25;
      severity = "Low";
      reasoning = "Milder negative speech patterns detected.";
      recommendations = "Monitor chat behaviors and encourage positive speech in game lobbies.";
      snippets.push(`"${text.match(/(hate|stupid|dummy|noob)/i)[0]}"`);
    }
  }

  return {
    threatCategory: category,
    riskScore: score,
    severity: severity,
    reasoning: reasoning,
    evidenceSnippets: snippets.length > 0 ? snippets.join(", ") : "N/A",
    recommendedAction: recommendations
  };
}

// ----------------------------------------------------
// AI AGENT 2: RISK ASSESSMENT AGENT
// ----------------------------------------------------
function runRiskAssessmentAgent(childProfile, threatAnalysis) {
  const currentScore = childProfile.safetyScore;
  const threatScore = threatAnalysis.riskScore;
  
  // Calculate new Safety Score based on threat impact
  // Critical threats cause a larger drop, while safe requests do not drop the score
  let scoreImpact = 0;
  if (threatAnalysis.severity === "Critical") {
    scoreImpact = 25;
  } else if (threatAnalysis.severity === "High") {
    scoreImpact = 15;
  } else if (threatAnalysis.severity === "Medium") {
    scoreImpact = 8;
  } else if (threatAnalysis.severity === "Low") {
    scoreImpact = 3;
  }

  const newScore = Math.max(15, currentScore - scoreImpact);
  
  // Determine new overall Risk Level
  let riskLevel = "Safe";
  let priority = "Low";
  let explanation = "";

  if (newScore >= 90) {
    riskLevel = "Safe";
    priority = "Low";
    explanation = `${childProfile.name} demonstrates excellent digital behavior. Minimal risk flags recorded.`;
  } else if (newScore >= 75) {
    riskLevel = "Low";
    priority = "Low";
    explanation = `${childProfile.name} exhibits generally safe usage. Minor alert logs handled.`;
  } else if (newScore >= 50) {
    riskLevel = "Medium";
    priority = "Medium";
    explanation = `Aggressive behaviors or gaming scam links detected. Requires passive parenting monitoring.`;
  } else if (newScore >= 30) {
    riskLevel = "High";
    priority = "High";
    explanation = `Repeated threats or high-severity triggers logged. Active parenting mitigation recommended.`;
  } else {
    riskLevel = "Critical";
    priority = "Urgent";
    explanation = `Severe threats (grooming or physical meeting solicitation) detected. Immediate police involvement recommended.`;
  }

  return {
    safetyScore: newScore,
    riskLevel: riskLevel,
    priority: priority,
    explanation: explanation
  };
}

// ----------------------------------------------------
// AI AGENT 3: INCIDENT REPORT GENERATOR
// ----------------------------------------------------
function generateIncidentReport(incident, child, evidenceText) {
  const formattedDate = new Date(incident.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + " IST";
  
  return `
    <div class="police-report-doc">
      <div class="police-report-header">
        <div class="police-report-logo">🛡️</div>
        <h2>AHMEDABAD CYBER CRIME BRANCH</h2>
        <h3>GOVERNMENT OF GUJARAT</h3>
        <p>Cyber Security & Protection Cell | Command Control Centre</p>
      </div>

      <div class="report-meta-grid">
        <div class="report-meta-item"><strong>CASE INCIDENT ID:</strong> ${incident.incidentId}</div>
        <div class="report-meta-item"><strong>DATE OF REPORT:</strong> ${formattedDate}</div>
        <div class="report-meta-item"><strong>INVESTIGATING OFFICE:</strong> Cyber Crime Cell, Ahmedabad</div>
        <div class="report-meta-item"><strong>STATUS OF CASE:</strong> ${incident.status}</div>
        <div class="report-meta-item"><strong>VICTIM NAME:</strong> ${child.name}</div>
        <div class="report-meta-item"><strong>VICTIM AGE:</strong> ${child.age} Years</div>
        <div class="report-meta-item"><strong>CURRENT RISK THRESHOLD:</strong> ${child.riskLevel} (${child.safetyScore}/100)</div>
        <div class="report-meta-item"><strong>SEVERITY CLASSIFICATION:</strong> ${incident.severity}</div>
      </div>

      <div class="report-section-title">I. Incident Summary</div>
      <p>
        On ${formattedDate}, the automated CyberRakshak Kids Protection platform flagged a 
        <strong>${incident.threatType}</strong> incident of <strong>${incident.severity}</strong> severity 
        associated with child user ${child.name}. The system detected a risk scoring profile of 
        ${incident.riskScore}/100.
      </p>

      <div class="report-section-title">II. AI Threat Assessment Details</div>
      <p><strong>Threat Category:</strong> ${incident.threatType}</p>
      <p><strong>System Classification Score:</strong> ${incident.riskScore}% Threat Intensity</p>
      <p><strong>Trigger Reasoning:</strong> ${incident.reasoning}</p>

      <div class="report-section-title">III. Transcribed Cyber Evidence</div>
      <p>The following digital transcripts and telemetry packets were captured and registered in the local evidence repository:</p>
      <div class="report-evidence-box">
        ${evidenceText.replace(/\n/g, '<br>')}
      </div>

      <div class="report-section-title">IV. Legal & Parenting Action Guidelines</div>
      <p><strong>Recommended Mitigations:</strong> ${incident.recommendedAction}</p>
      <p>
        Pursuant to the Information Technology Act, 2000 (Amendment 2008), the Ahmedabad Cyber Crime Branch advises 
        parental intervention to secure terminal accounts. If predatory grooming patterns continue, details will be escalated 
        to local jurisdictional authorities for digital tracking of offender IP address profiles.
      </p>

      <div class="report-stamp-area">
        <div class="report-sign-line">
          <hr>
          <p>Investigating Officer Signature</p>
          <p>Ahmedabad Cyber Crime Unit</p>
        </div>
        <div class="police-stamp">
          AHMEDABAD<br>CYBER CELL<br>★ APPROVED ★
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// WORKFLOWS & ROUTINES
// ----------------------------------------------------

// WORKFLOW 1 & 2: Threat Detection & High-Risk Alert Workflow
function processScannedContent(textContent) {
  const activeChild = state.profiles.find(p => p.id === currentChildId);
  if (!activeChild) return;

  // 1. Agent 1 - Analysis
  const analysisResult = runChildCyberSafetyAgent(textContent);

  // If Safe, just show result but do not log as police case
  if (analysisResult.severity === "Safe") {
    displayScanResult(analysisResult);
    showToast("Analysis Complete", "Scanning completed. The chat content is classified as Safe.", "info");
    return;
  }

  // 2. Agent 2 - Risk Assessment & score updates
  const assessment = runRiskAssessmentAgent(activeChild, analysisResult);
  
  // Update child profile
  activeChild.safetyScore = assessment.safetyScore;
  activeChild.riskLevel = assessment.riskLevel;

  // Create Incident record
  const incidentId = "INC-2026-" + Math.floor(1000 + Math.random() * 9000);
  const incident = {
    incidentId: incidentId,
    childId: currentChildId,
    threatType: analysisResult.threatCategory,
    severity: analysisResult.severity,
    date: new Date().toISOString(),
    status: "Under Investigation",
    riskScore: analysisResult.riskScore,
    reasoning: analysisResult.reasoning,
    recommendedAction: analysisResult.recommendedAction
  };

  // Create Evidence record
  const evidenceId = "EVID-" + Math.floor(5000 + Math.random() * 5000);
  const evidence = {
    evidenceId: evidenceId,
    incidentId: incidentId,
    evidenceContent: `Chat Submission Log: ${textContent}`,
    timestamp: new Date().toISOString()
  };

  // Store in State
  state.incidents.unshift(incident);
  state.evidence.unshift(evidence);
  saveState();

  // Display results in Scanner Output Box
  displayScanResult(analysisResult);

  // Trigger WORKFLOW 2 (High Risk Workflow if score exceeds 80)
  if (analysisResult.riskScore >= 80) {
    triggerHighRiskWorkflow(activeChild, incident);
  } else {
    // Normal level threat alert
    showToast(
      "Risk Alert Registered",
      `Moderate risk (${analysisResult.threatCategory}) detected for ${activeChild.name}. Parental panel updated.`,
      "warning"
    );
  }

  // Refresh dashboards UI
  refreshAllDashboards();
}

function triggerHighRiskWorkflow(child, incident) {
  // 1. Generate toast alarm
  showToast(
    `🚨 CRITICAL THREAT DETECTED`,
    `Agent 1 flagged a Critical ${incident.threatType} on ${child.name}'s profile. Safety score is now ${child.safetyScore}. Escalating to Cyber Crime Branch.`,
    "critical"
  );
  
  // 2. Add an alert visual highlight in dashboards
  console.log("High Risk Workflow Executed: Alert routed to Police Station Dashboard.");
}

// WORKFLOW 3: SOS Emergency Workflow
function triggerSOSWorkflow() {
  const activeChild = state.profiles.find(p => p.id === currentChildId);
  if (!activeChild) return;

  // 1. Drop Safety score immediately (Agent 2 simulation)
  activeChild.safetyScore = Math.max(10, activeChild.safetyScore - 30);
  activeChild.riskLevel = "Critical";

  // 2. Create SOS Incident
  const incidentId = "SOS-2026-" + Math.floor(1000 + Math.random() * 9000);
  const incident = {
    incidentId: incidentId,
    childId: currentChildId,
    threatType: "Emergency SOS Triggered",
    severity: "Critical",
    date: new Date().toISOString(),
    status: "Under Investigation",
    riskScore: 100,
    reasoning: "Child manually triggered the Emergency SOS Button from their terminal device.",
    recommendedAction: "Dispatch local Ahmedabad patrols immediately. Verify child GPS coordinates and notify registered emergency contacts."
  };

  // 3. Create SOS Evidence Log
  const evidenceId = "EVID-" + Math.floor(9000 + Math.random() * 999);
  const evidence = {
    evidenceId: evidenceId,
    incidentId: incidentId,
    evidenceContent: `TELEMETRY BEACON: Emergency SOS broadcast initiated by ${activeChild.name} at ${new Date().toLocaleString()}. Network cell tower: Ahmedabad West Zone. Ping latency: 12ms. Device Battery: 85%.`,
    timestamp: new Date().toISOString()
  };

  // Store in State
  state.incidents.unshift(incident);
  state.evidence.unshift(evidence);
  saveState();

  // 4. Trigger Toast Alarms
  showToast(
    "🚨 EMERGENCY ALARM TRIGGERED",
    `SOS beacon received from ${activeChild.name}! Dispatching Cyber Crime branch patrol units and contacting parents.`,
    "sos"
  );

  // Refresh view
  refreshAllDashboards();
}

// ----------------------------------------------------
// UI RENDERING CONTROLLERS
// ----------------------------------------------------

function switchRole(role) {
  // Update Selector UI buttons
  document.querySelectorAll(".role-btn").forEach(btn => {
    btn.classList.remove("active");
    if (btn.getAttribute("data-role") === role) {
      btn.classList.add("active");
    }
  });

  // Toggle View Panels
  document.querySelectorAll(".dashboard-view").forEach(view => {
    view.classList.remove("active");
  });
  document.getElementById(`${role}-dashboard`).classList.add("active");

  // Load correct states
  refreshAllDashboards();
}

function selectProfile(profileId) {
  currentChildId = profileId;
  document.querySelectorAll(".profile-pill").forEach(pill => {
    pill.classList.remove("active");
    if (pill.getAttribute("data-id") === profileId) {
      pill.classList.add("active");
    }
  });
  refreshAllDashboards();
}

function refreshAllDashboards() {
  const activeChild = state.profiles.find(p => p.id === currentChildId);
  if (!activeChild) return;

  // CHILD PORTAL REFRESH
  updateSafetyScoreGauge(activeChild.safetyScore, "child-radial-bar", "child-score-number", "child-score-text");
  renderChildRecentAlerts();

  // PARENT PORTAL REFRESH
  updateSafetyScoreGauge(activeChild.safetyScore, "parent-radial-bar", "parent-score-number", "parent-score-text");
  renderParentRiskAlerts(activeChild.id);
  renderParentIncidentHistory(activeChild.id);
  renderParentRecommendedActions(activeChild.id);
  renderParentStats(activeChild.id);

  // POLICE PORTAL REFRESH
  renderPoliceDashboardStats();
  renderPoliceActiveCasesTable();
  renderPoliceEvidenceRepository();
  renderPoliceHeatmap();
  renderThreatDistributionChart();
  renderMonthlyIncidentsChart();
}

// Update Radial Progress Rings
function updateSafetyScoreGauge(score, pathId, textId, descId) {
  const path = document.getElementById(pathId);
  const textVal = document.getElementById(textId);
  const descText = document.getElementById(descId);
  if (!path || !textVal) return;

  // SVG Circumference = 2 * PI * r (r=70) ≈ 440
  const maxStroke = 440;
  const offset = maxStroke - (score / 100) * maxStroke;
  path.style.strokeDashoffset = offset;
  textVal.textContent = score;

  // Color stroke based on rating
  let color = "var(--accent-green)";
  let text = "SAFE";
  if (score < 50) {
    color = "var(--accent-red)";
    text = "CRITICAL RISK";
  } else if (score < 75) {
    color = "var(--accent-orange)";
    text = "MEDIUM RISK";
  } else if (score < 90) {
    color = "var(--accent-blue)";
    text = "SECURE";
  }

  path.style.stroke = color;
  if (descText) {
    descText.textContent = text;
    descText.style.color = color;
  }
}

// Render Child Dash Alerts list
function renderChildRecentAlerts() {
  const container = document.getElementById("child-alerts-container");
  if (!container) return;

  const childIncidents = state.incidents.filter(inc => inc.childId === currentChildId);
  if (childIncidents.length === 0) {
    container.innerHTML = `<div class="text-center" style="color: var(--text-dark); padding: 1.5rem 0; font-size: 0.85rem;">No recent safety alerts triggered.</div>`;
    return;
  }

  container.innerHTML = childIncidents.slice(0, 3).map(inc => {
    let severityClass = "badge-safe";
    if (inc.severity === "Critical") severityClass = "badge-critical";
    else if (inc.severity === "High") severityClass = "badge-high";
    else if (inc.severity === "Medium") severityClass = "badge-medium";
    else if (inc.severity === "Low") severityClass = "badge-low";

    return `
      <div style="background: var(--bg-dark-card); padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.03); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 700; font-size: 0.85rem;">${inc.threatType}</div>
          <div style="font-size: 0.7rem; color: var(--text-dark); margin-top: 0.15rem;">${new Date(inc.date).toLocaleDateString()}</div>
        </div>
        <span class="badge ${severityClass}">${inc.severity}</span>
      </div>
    `;
  }).join("");
}

// Render Parent Dash Alerts list
function renderParentRiskAlerts(childId) {
  const container = document.getElementById("parent-notif-container");
  if (!container) return;

  // Filter high/critical incidents for notifications
  const childIncidents = state.incidents.filter(inc => inc.childId === childId);
  if (childIncidents.length === 0) {
    container.innerHTML = `<div class="text-center" style="color: var(--text-dark); padding: 2.5rem 0; font-size: 0.85rem;">No active notifications or threat events.</div>`;
    return;
  }

  container.innerHTML = childIncidents.map(inc => {
    let typeClass = "";
    if (inc.severity === "Critical") typeClass = "critical";
    else if (inc.severity === "High" || inc.severity === "Medium") typeClass = "warning";

    return `
      <div class="notif-card ${typeClass}">
        <div class="notif-details">
          <div class="notif-header">
            <span class="notif-title">${inc.threatType}</span>
            <span class="notif-time">${new Date(inc.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="notif-body">${inc.reasoning}</div>
        </div>
      </div>
    `;
  }).join("");
}

// Render Parent Dashboard history logs
function renderParentIncidentHistory(childId) {
  const container = document.getElementById("parent-history-body");
  if (!container) return;

  const childIncidents = state.incidents.filter(inc => inc.childId === childId);
  if (childIncidents.length === 0) {
    container.innerHTML = `<tr><td colspan="5" class="text-center" style="color: var(--text-dark); padding: 1.5rem 0;">No incident history recorded.</td></tr>`;
    return;
  }

  container.innerHTML = childIncidents.map(inc => {
    let severityClass = "badge-safe";
    if (inc.severity === "Critical") severityClass = "badge-critical";
    else if (inc.severity === "High") severityClass = "badge-high";
    else if (inc.severity === "Medium") severityClass = "badge-medium";
    else if (inc.severity === "Low") severityClass = "badge-low";

    let statusClass = "status-investigating";
    if (inc.status === "Action Taken") statusClass = "status-action-taken";
    else if (inc.status === "Resolved") statusClass = "status-resolved";

    return `
      <tr>
        <td style="font-weight: 700; font-family: monospace; color: var(--accent-blue);">${inc.incidentId}</td>
        <td>${inc.threatType}</td>
        <td><span class="badge ${severityClass}">${inc.severity}</span></td>
        <td>${new Date(inc.date).toLocaleDateString()}</td>
        <td><span class="status-pill ${statusClass}">${inc.status}</span></td>
      </tr>
    `;
  }).join("");
}

// Render recommended actions parent panel
function renderParentRecommendedActions(childId) {
  const container = document.getElementById("parent-recommendations");
  if (!container) return;

  const childIncidents = state.incidents.filter(inc => inc.childId === childId && inc.severity !== "Safe");
  if (childIncidents.length === 0) {
    container.innerHTML = `
      <div class="rec-item">
        <strong>Digital safety parameters are nominal.</strong> Keep maintaining open conversations with your child about password sharing and talking to strangers.
      </div>
    `;
    return;
  }

  container.innerHTML = childIncidents.slice(0, 3).map(inc => {
    const isCritical = inc.severity === "Critical" || inc.severity === "High";
    return `
      <div class="rec-item ${isCritical ? 'high-rec' : ''}">
        <strong>For ${inc.threatType} (${inc.severity}):</strong> ${inc.recommendedAction}
      </div>
    `;
  }).join("");
}

// Render Parent Statistics Grid values
function renderParentStats(childId) {
  const totalVal = document.getElementById("p-stat-total");
  const criticalVal = document.getElementById("p-stat-critical");
  if (!totalVal || !criticalVal) return;

  const childIncidents = state.incidents.filter(inc => inc.childId === childId);
  const criticalCount = childIncidents.filter(inc => inc.severity === "Critical" || inc.severity === "High").length;

  totalVal.textContent = childIncidents.length;
  criticalVal.textContent = criticalCount;
}

// ----------------------------------------------------
// POLICE DASHBOARD RENDERING CONTROLLERS
// ----------------------------------------------------

function renderPoliceDashboardStats() {
  const activeCasesVal = document.getElementById("police-stat-cases");
  const reportsVal = document.getElementById("police-stat-reports");
  const criticalVal = document.getElementById("police-stat-critical");

  if (!activeCasesVal || !reportsVal || !criticalVal) return;

  const activeCount = state.incidents.filter(inc => inc.status !== "Resolved").length;
  const criticalCount = state.incidents.filter(inc => inc.severity === "Critical" || inc.severity === "High").length;

  activeCasesVal.textContent = activeCount;
  reportsVal.textContent = state.incidents.length;
  criticalVal.textContent = criticalCount;
}

function renderPoliceActiveCasesTable() {
  const container = document.getElementById("police-cases-body");
  if (!container) return;

  if (state.incidents.length === 0) {
    container.innerHTML = `<tr><td colspan="6" class="text-center" style="color: var(--text-dark); padding: 2.5rem 0;">No active safety logs registered in Cyber Cell.</td></tr>`;
    return;
  }

  container.innerHTML = state.incidents.map(inc => {
    const child = state.profiles.find(p => p.id === inc.childId) || { name: "Unknown", safetyScore: 50 };
    
    let severityClass = "badge-safe";
    if (inc.severity === "Critical") severityClass = "badge-critical";
    else if (inc.severity === "High") severityClass = "badge-high";
    else if (inc.severity === "Medium") severityClass = "badge-medium";
    else if (inc.severity === "Low") severityClass = "badge-low";

    return `
      <tr>
        <td style="font-weight: 700; font-family: monospace; color: var(--accent-blue);">${inc.incidentId}</td>
        <td>${child.name}</td>
        <td>${inc.threatType}</td>
        <td><span class="badge ${severityClass}">${inc.severity}</span></td>
        <td>
          <select class="status-select" onchange="updateCaseStatus('${inc.incidentId}', this.value)">
            <option value="Under Investigation" ${inc.status === "Under Investigation" ? "selected" : ""}>Investigating</option>
            <option value="Action Taken" ${inc.status === "Action Taken" ? "selected" : ""}>Action Taken</option>
            <option value="Resolved" ${inc.status === "Resolved" ? "selected" : ""}>Resolved</option>
          </select>
        </td>
        <td>
          <button class="action-btn-link" onclick="openPoliceReportModal('${inc.incidentId}')">View Report</button>
        </td>
      </tr>
    `;
  }).join("");
}

function updateCaseStatus(incidentId, newStatus) {
  const incident = state.incidents.find(inc => inc.incidentId === incidentId);
  if (incident) {
    incident.status = newStatus;
    saveState();
    refreshAllDashboards();
    showToast("Case Status Updated", `Incident ${incidentId} is now marked as ${newStatus}.`, "success");
  }
}

function renderPoliceEvidenceRepository() {
  const container = document.getElementById("police-evidence-list");
  if (!container) return;

  if (state.evidence.length === 0) {
    container.innerHTML = `<div style="color: var(--text-dark); font-size: 0.8rem; text-align: center; padding: 1.5rem 0;">Evidence vault empty.</div>`;
    return;
  }

  container.innerHTML = state.evidence.slice(0, 6).map(ev => {
    const inc = state.incidents.find(i => i.incidentId === ev.incidentId) || { threatType: "General Log" };
    return `
      <div style="background: var(--bg-dark-card); border: 1px solid rgba(255, 255, 255, 0.03); padding: 0.75rem; border-radius: 6px; font-size: 0.8rem; margin-bottom: 0.5rem;">
        <div class="flex-between" style="margin-bottom: 0.25rem;">
          <span style="font-weight: 700; color: var(--accent-blue); font-family: monospace;">${ev.evidenceId}</span>
          <span style="font-size: 0.7rem; color: var(--text-dark);">${new Date(ev.timestamp).toLocaleDateString()}</span>
        </div>
        <div style="color: #fff; font-weight: 600; font-size: 0.75rem; margin-bottom: 0.35rem;">Case Reference: ${ev.incidentId} (${inc.threatType})</div>
        <div style="font-size: 0.75rem; font-style: italic; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;">
          ${ev.evidenceContent}
        </div>
      </div>
    `;
  }).join("");
}

function renderPoliceHeatmap() {
  const container = document.getElementById("police-heatmap-container");
  if (!container) return;

  // Let's create a simulated local geographical sector incident heatmap count
  // Using active incidents count distributed across major sectors in Ahmedabad
  const sectors = [
    { name: "Ahmedabad West", count: 0, max: 12 },
    { name: "Ahmedabad North", count: 0, max: 12 },
    { name: "Ahmedabad East", count: 0, max: 12 },
    { name: "Ahmedabad South", count: 0, max: 12 },
    { name: "Satellite Unit", count: 0, max: 12 }
  ];

  // Distribute incident count systematically
  state.incidents.forEach((inc, index) => {
    const sectorIndex = index % sectors.length;
    sectors[sectorIndex].count++;
  });

  // Calculate percentage bar width
  container.innerHTML = sectors.map(sec => {
    const pct = Math.max(10, Math.min(100, (sec.count / sec.max) * 100));
    return `
      <div class="heatmap-row">
        <span class="location-name">${sec.name}</span>
        <div class="heatmap-bar-container">
          <div class="heatmap-bar" style="width: ${pct}%;"></div>
        </div>
        <span class="heatmap-count">${sec.count} Case${sec.count !== 1 ? 's' : ''}</span>
      </div>
    `;
  }).join("");
}

// ----------------------------------------------------
// DYNAMIC SVG CHART GENERATORS
// ----------------------------------------------------

function renderThreatDistributionChart() {
  const container = document.getElementById("threat-chart-bars");
  if (!container) return;

  // Count incidents per category
  const categories = {
    "Online Grooming": 0,
    "Cyberbullying": 0,
    "Scam & Phishing": 0,
    "Emergency SOS": 0
  };

  state.incidents.forEach(inc => {
    if (inc.threatType.includes("Grooming")) categories["Online Grooming"]++;
    else if (inc.threatType.includes("bullying") || inc.threatType.includes("Harassment")) categories["Cyberbullying"]++;
    else if (inc.threatType.includes("Scam") || inc.threatType.includes("Phishing")) categories["Scam & Phishing"]++;
    else if (inc.threatType.includes("SOS")) categories["Emergency SOS"]++;
  });

  const keys = Object.keys(categories);
  const values = Object.values(categories);
  const maxVal = Math.max(1, ...values);

  container.innerHTML = keys.map((key, i) => {
    const val = values[i];
    // Scale height relative to 140px container height
    const height = Math.round((val / maxVal) * 120) + 10;
    const isRed = key === "Emergency SOS" || key === "Online Grooming";

    return `
      <div class="chart-bar-col">
        <div class="chart-bar-rect ${isRed ? 'red-chart' : ''}" style="height: ${height}px;" data-value="${val}"></div>
        <div class="chart-bar-label" title="${key}">${key.split(" ")[0]}</div>
      </div>
    `;
  }).join("");
}

function renderMonthlyIncidentsChart() {
  const container = document.getElementById("monthly-chart-bars");
  if (!container) return;

  // Group incidents by simulated months (April, May, June)
  const months = { "Apr 26": 2, "May 26": 4, "Jun 26": 0 };
  
  // Count incidents that happened in June 2026 based on timestamp
  state.incidents.forEach(inc => {
    const d = new Date(inc.date);
    if (d.getMonth() === 5 && d.getFullYear() === 2026) {
      months["Jun 26"]++;
    }
  });

  const keys = Object.keys(months);
  const values = Object.values(months);
  const maxVal = Math.max(1, ...values);

  container.innerHTML = keys.map((key, i) => {
    const val = values[i];
    const height = Math.round((val / maxVal) * 120) + 10;
    return `
      <div class="chart-bar-col">
        <div class="chart-bar-rect" style="height: ${height}px;" data-value="${val}"></div>
        <div class="chart-bar-label">${key}</div>
      </div>
    `;
  }).join("");
}

// ----------------------------------------------------
// THREAT SCANNER CONTROLS
// ----------------------------------------------------
function populateScannerTemplate(index) {
  const templates = state.scanTemplates;
  if (templates && templates[index]) {
    const textarea = document.getElementById("scanner-textarea");
    if (textarea) {
      textarea.value = templates[index].content;
    }
  }
}

function executeScan() {
  const textarea = document.getElementById("scanner-textarea");
  if (!textarea) return;
  
  const content = textarea.value.trim();
  if (!content) {
    showToast("Input Empty", "Please write or paste chat logs to start evaluation.", "warning");
    return;
  }

  processScannedContent(content);
}

function displayScanResult(result) {
  const resultPanel = document.getElementById("scan-result-wrapper");
  const catText = document.getElementById("result-category");
  const scoreText = document.getElementById("result-score");
  const severityBadge = document.getElementById("result-severity-badge");
  const snippetBox = document.getElementById("result-snippets-box");
  const reasoningText = document.getElementById("result-reasoning");
  const actionText = document.getElementById("result-actions");

  if (!resultPanel) return;

  // Update text values
  catText.textContent = result.threatCategory;
  scoreText.textContent = `${result.riskScore}%`;
  
  // Set severity badge styling
  severityBadge.textContent = result.severity;
  severityBadge.className = "badge"; // Reset classes
  
  let badgeClass = "badge-safe";
  if (result.severity === "Critical") badgeClass = "badge-critical";
  else if (result.severity === "High") badgeClass = "badge-high";
  else if (result.severity === "Medium") badgeClass = "badge-medium";
  else if (result.severity === "Low") badgeClass = "badge-low";
  
  severityBadge.classList.add(badgeClass);

  // Set evidence snippets
  if (result.evidenceSnippets !== "N/A" && result.evidenceSnippets !== "") {
    snippetBox.style.display = "block";
    snippetBox.innerHTML = `<strong>Flagged Evidence Snips:</strong><div class="evidence-quote">${result.evidenceSnippets}</div>`;
  } else {
    snippetBox.style.display = "none";
  }

  reasoningText.textContent = result.reasoning;
  actionText.textContent = result.recommendedAction;

  // Reveal panel
  resultPanel.style.display = "block";
}

// ----------------------------------------------------
// MODAL CONTROLLERS
// ----------------------------------------------------
function openLearningModal(index) {
  const module = state.learningCenter[index];
  if (!module) return;

  const modal = document.getElementById("global-modal");
  const modalTitle = document.getElementById("modal-title-text");
  const modalBody = document.getElementById("modal-body-content");

  if (!modal || !modalTitle || !modalBody) return;

  modalTitle.textContent = module.title;
  modalBody.innerHTML = `
    <div style="margin-bottom: 1rem;">
      <span class="lc-category">${module.category}</span>
      <span style="font-size: 0.8rem; color: var(--text-dark); margin-left: 0.5rem;">${module.readTime}</span>
    </div>
    <p style="font-size: 0.95rem; line-height: 1.5; color: var(--text-muted); margin-bottom: 1.5rem;">${module.description}</p>
    <h4 style="font-size: 0.95rem; margin-bottom: 0.75rem; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">Rakshak Safety Guidelines</h4>
    <ul class="tip-list">
      ${module.tips.map(tip => `<li>${tip}</li>`).join("")}
    </ul>
    <div style="margin-top: 2rem; text-align: right;">
      <button class="btn-cyber" onclick="closeModal()">Understand & Close</button>
    </div>
  `;

  modal.style.display = "flex";
}

function openPoliceReportModal(incidentId) {
  const incident = state.incidents.find(inc => inc.incidentId === incidentId);
  if (!incident) return;

  const child = state.profiles.find(p => p.id === incident.childId) || { name: "Unknown", age: "N/A", safetyScore: 50, riskLevel: "Medium" };
  const evidenceRecord = state.evidence.find(ev => ev.incidentId === incidentId) || { evidenceContent: "No telemetric logs registered." };

  const modal = document.getElementById("global-modal");
  const modalTitle = document.getElementById("modal-title-text");
  const modalBody = document.getElementById("modal-body-content");

  if (!modal || !modalTitle || !modalBody) return;

  modalTitle.textContent = `Official Cyber Crime Log - Case #${incidentId}`;
  
  // Call AI Agent 3
  const reportHtml = generateIncidentReport(incident, child, evidenceRecord.evidenceContent);

  modalBody.innerHTML = `
    ${reportHtml}
    <div style="margin-top: 1.5rem; text-align: right; display: flex; justify-content: flex-end; gap: 1rem;">
      <button class="template-badge" onclick="printReportArea()">🖨️ Print Dossier</button>
      <button class="btn-cyber" onclick="closeModal()">Close Dossier</button>
    </div>
  `;

  modal.style.display = "flex";
}

function printReportArea() {
  const printableContent = document.querySelector('.police-report-doc').outerHTML;
  const originalBody = document.body.innerHTML;
  
  // Simple print view injector
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Ahmedabad Cyber Crime Report</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; padding: 20px; color: #000; }
          .police-report-doc { border: none; box-shadow: none; padding: 0; }
          .police-report-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .report-meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
          .report-meta-item { border-bottom: 1px dashed #000; padding-bottom: 4px; }
          .report-section-title { background: #f0f0f0; border-left: 4px solid #000; padding: 5px 10px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; text-transform: uppercase; }
          .report-evidence-box { background: #fafafa; border: 1px solid #ccc; padding: 10px; font-family: monospace; font-size: 12px; margin: 10px 0; }
          .report-stamp-area { display: flex; justify-content: space-between; margin-top: 40px; }
          .report-sign-line { text-align: center; width: 200px; }
          .report-sign-line hr { border: none; border-top: 1px solid #000; margin-bottom: 5px; }
          .police-stamp { width: 90px; height: 90px; border: 3px double #000; border-radius: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-weight: bold; font-size: 10px; transform: rotate(-15deg); }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        ${printableContent}
      </body>
    </html>
  `);
  printWindow.document.close();
}

function closeModal() {
  const modal = document.getElementById("global-modal");
  if (modal) modal.style.display = "none";
}

// ----------------------------------------------------
// SYSTEM TOAST ALARMS (Simulation of Push notifications)
// ----------------------------------------------------
function showToast(title, message, type = "info") {
  const container = document.getElementById("system-toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type === 'sos' ? 'toast-sos' : ''}`;
  
  let icon = "ℹ️";
  let titleClass = "";
  if (type === "sos") {
    icon = "🚨";
    titleClass = "red-text";
  } else if (type === "critical") {
    icon = "⚠️";
    titleClass = "red-text";
  } else if (type === "warning") {
    icon = "🟠";
  } else if (type === "success") {
    icon = "✅";
  }

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-title ${titleClass}">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(toast);

  // Auto remove after 6 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 7000);
}

// ----------------------------------------------------
// INITIALIZATION ON DOCUMENT LOAD
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initDatabase();
  
  // Wire up role selector buttons
  document.querySelectorAll(".role-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      switchRole(btn.getAttribute("data-role"));
    });
  });

  // Render scanner templates selectors
  const templateBadgeContainer = document.getElementById("scan-templates-badges");
  if (templateBadgeContainer) {
    templateBadgeContainer.innerHTML = state.scanTemplates.map((t, idx) => `
      <span class="template-badge" onclick="populateScannerTemplate(${idx})">${t.name}</span>
    `).join("");
  }

  // Render education cards
  const lcContainer = document.getElementById("learning-cards-container");
  if (lcContainer) {
    lcContainer.innerHTML = state.learningCenter.map((lc, idx) => `
      <div class="lc-card" onclick="openLearningModal(${idx})">
        <div class="lc-card-header">
          <span class="lc-title">${lc.title}</span>
          <span class="lc-category">${lc.category}</span>
        </div>
        <div class="lc-desc">${lc.description}</div>
        <div class="lc-meta">📚 ${lc.readTime} • Click to read guidelines</div>
      </div>
    `).join("");
  }

  // Initialize view
  switchRole("child");
  selectProfile("child_1");
  
  // Modal background close handler
  window.onclick = function(event) {
    const modal = document.getElementById("global-modal");
    if (event.target === modal) {
      closeModal();
    }
  };
});
