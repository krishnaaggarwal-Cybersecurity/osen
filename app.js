const ESCALATION_SECONDS = 15;
const STORAGE_KEY = "netragrid-ai-demo-v1";

const seedIncidents = [
  { id: "NG-2047", time: "14:03:18", location: "NH-48 · Hero Honda Chowk", confidence: 87, status: "Dispatched", kind: "Two-wheeler fall" },
  { id: "NG-2046", time: "13:41:52", location: "Sector 4 · Sheetla Mata Road", confidence: 93, status: "Acknowledged", kind: "Vehicle collision" },
  { id: "NG-2045", time: "12:26:09", location: "NH-48 · Bilaspur Junction", confidence: 89, status: "Dismissed", kind: "Stopped vehicle" }
];

const seedActivity = [
  { time: "14:03", tone: "mint", title: "Response unit dispatched", detail: "NG-2047 · Hero Honda Chowk" },
  { time: "13:41", tone: "amber", title: "Incident acknowledged by OP112", detail: "NG-2046 · Sector 4" },
  { time: "12:26", tone: "red", title: "Alert dismissed as false positive", detail: "NG-2045 · Bilaspur Junction" },
  { time: "12:08", tone: "mint", title: "Camera CAM-GGN-019 back online", detail: "Sector 4 · Camera network" }
];

function loadDemoState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { incidents: seedIncidents, activity: seedActivity, sequence: 2048 };
    const parsed = JSON.parse(saved);
    const validIncident = (item) => item && typeof item.id === "string"
      && typeof item.time === "string" && typeof item.location === "string"
      && typeof item.confidence === "number" && typeof item.status === "string"
      && typeof item.kind === "string"
      && (item.status !== "Awaiting review" || Number.isFinite(item.deadline));
    const validActivity = (item) => item && typeof item.time === "string"
      && typeof item.title === "string" && typeof item.detail === "string"
      && ["mint", "amber", "red"].includes(item.tone);
    if (!parsed || !Array.isArray(parsed.incidents) || !parsed.incidents.every(validIncident)
      || !Array.isArray(parsed.activity) || !parsed.activity.every(validActivity)
      || !Number.isInteger(parsed.sequence)) {
      throw new Error("Saved demo data did not match the expected format.");
    }
    return {
      incidents: parsed.incidents.slice(0, 200),
      activity: parsed.activity.slice(0, 6),
      sequence: Math.max(parsed.sequence, ...parsed.incidents.map((item) => Number(item.id.match(/\d+$/)?.[0]) || 0), 2048)
    };
  } catch (error) {
    console.warn("Unable to load saved NetraGrid AI demo data.", error);
    return { incidents: seedIncidents, activity: seedActivity, sequence: 2048, storageUnavailable: true };
  }
}

const initialState = loadDemoState();
let incidents = initialState.incidents.map((incident) => ({ ...incident }));
let activity = initialState.activity.map((item) => ({ ...item }));
const cameras = [
  ["CAM-GGN-042", "Bilaspur Junction · Northbound", "1080p · 24 FPS", "0.4s ago", "Online"],
  ["CAM-GGN-041", "Bilaspur Junction · Southbound", "1080p · 24 FPS", "0.5s ago", "Online"],
  ["CAM-GGN-027", "NH-48 · Toll approach", "720p · 20 FPS", "0.8s ago", "Online"],
  ["CAM-GGN-019", "Sector 4 · Sheetla Mata Road", "1080p · 24 FPS", "1.2s ago", "Online"],
  ["CAM-GGN-008", "NH-48 · Hero Honda Chowk", "—", "6m ago", "Signal weak"],
  ["CAM-GGN-003", "Sector 4 · Service road", "—", "12m ago", "Offline"]
];

let activeIncident = null;
let incidentSequence = initialState.sequence;
let lastFocusedElement = null;
let toastTimer = null;
let storageUnavailable = Boolean(initialState.storageUnavailable);

const $ = (selector) => document.querySelector(selector);
const queueElement = $("#incident-queue");
const activityElement = $("#activity-list");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function formatClock(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);
}

function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date).toUpperCase();
}

function updateClocks() {
  const now = new Date();
  $("#clock").textContent = `${formatClock(now)} IST`;
  $("#feed-time").textContent = formatClock(now);
  $("#current-date").textContent = formatDate(now);
}

function persistDemoState() {
  if (storageUnavailable) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ incidents, activity, sequence: incidentSequence }));
  } catch (error) {
    storageUnavailable = true;
    console.warn("Unable to save NetraGrid AI demo data in this browser.", error);
    showToast("Browser storage is unavailable. Demo changes will not survive a refresh.", "warning");
  }
}

function openIncidentModal(incident) {
  activeIncident = incident;
  lastFocusedElement = document.activeElement;
  $("#modal-id").textContent = incident.id;
  $("#modal-confidence").textContent = `${incident.confidence}%`;
  $("#decision-modal").hidden = false;
  document.body.classList.add("modal-open");
  $("#countdown-ring").classList.remove("is-urgent");
  updateCountdown();
  $("#dismiss-incident").focus();
}

function closeIncidentModal() {
  $("#decision-modal").hidden = true;
  document.body.classList.remove("modal-open");
  if (lastFocusedElement instanceof HTMLElement && lastFocusedElement.isConnected) lastFocusedElement.focus();
  else $("#trigger-incident").focus();
}

function updateCountdown() {
  const expired = incidents.filter((incident) => incident.status === "Awaiting review" && incident.deadline <= Date.now());
  for (const incident of expired) {
    incident.status = "Fallback simulated";
    const message = "Review timer expired. Simulated fallback recorded; no call was placed.";
    activity.unshift({ time: formatClock().slice(0, 5), tone: "amber", title: message, detail: `${incident.id} · ${incident.location}` });
  }
  if (expired.length) {
    if (activeIncident && expired.includes(activeIncident)) {
      activeIncident = null;
      closeIncidentModal();
      showToast("Review timer expired. Simulated fallback recorded; no call was placed.", "warning");
    }
    activity.splice(6);
    renderAll();
  }
  if (!activeIncident) return;
  const seconds = Math.max(0, Math.ceil((activeIncident.deadline - Date.now()) / 1000));
  $("#countdown-number").textContent = seconds;
  $("#countdown-ring").classList.toggle("is-urgent", seconds <= 3);
}

function pushActivity(title, detail, tone = "mint") {
  activity.unshift({ time: formatClock().slice(0, 5), tone, title, detail });
  activity.splice(6);
  renderActivity();
  persistDemoState();
}

function renderActivity() {
  activityElement.innerHTML = activity.map((item) => `
    <div class="activity-item">
      <span class="activity-symbol ${escapeHtml(item.tone)}" aria-hidden="true">${item.tone === "red" ? "×" : item.tone === "amber" ? "!" : "✓"}</span>
      <div class="activity-copy">${escapeHtml(item.title)}<span>${escapeHtml(item.detail)}</span></div>
      <time class="activity-time">${escapeHtml(item.time)}</time>
    </div>
  `).join("");
}

function incidentStatusClass(status) {
  if (status === "Fallback simulated") return "is-fallback";
  if (status === "Awaiting review") return "";
  return "is-resolved";
}

function renderQueue() {
  const pending = incidents.filter((incident) => incident.status === "Awaiting review");
  const latest = pending[0];
  document.querySelector(".video-frame").classList.toggle("has-incident", Boolean(latest));
  document.querySelector(".map-canvas").classList.toggle("has-incident", Boolean(latest));
  if (latest) {
    $("#feed-detection-label").textContent = `${latest.kind.toUpperCase()} · ${latest.confidence}%`;
    $("#map-incident-label").textContent = `${latest.id} · ACTIVE`;
  }
  $("#pending-count").textContent = String(pending.length).padStart(2, "0");
  $("#nav-incident-count").textContent = String(incidents.length).padStart(2, "0");
  $("#queue-summary").textContent = `${pending.length} incident${pending.length === 1 ? "" : "s"} awaiting review`;
  if (!latest) {
    queueElement.innerHTML = `<div class="queue-empty"><strong>Queue clear</strong><span>No incidents need operator review.</span></div>`;
    return;
  }

  queueElement.innerHTML = `
    <article class="incident-card">
      <div class="incident-card-top">
        <div class="incident-type"><span class="live-pulse"></span>${escapeHtml(latest.kind)}</div>
        <span class="severity-badge">HIGH PRIORITY</span>
      </div>
      <div class="incident-location">${escapeHtml(latest.location)}</div>
      <div class="incident-details">
        <span>${escapeHtml(latest.id)} · ${escapeHtml(latest.time)}</span>
        <span class="incident-confidence">${escapeHtml(latest.confidence)}% CONF.</span>
      </div>
      <div class="incident-actions">
        <button class="button-small-quiet" data-action="dismiss" data-id="${escapeHtml(latest.id)}">Dismiss</button>
        <button class="button-small-primary" data-action="review" data-id="${escapeHtml(latest.id)}">Review alert →</button>
      </div>
    </article>
    ${incidents.filter((incident) => incident.status !== "Awaiting review").slice(0, 2).map((incident) => `
      <article class="incident-card ${incidentStatusClass(incident.status)}">
        <div class="incident-card-top">
          <div class="incident-type"><span class="mini-dot"></span>${escapeHtml(incident.kind)}</div>
          <span class="incident-status"><i class="mini-dot"></i>${escapeHtml(incident.status)}</span>
        </div>
        <div class="incident-location">${escapeHtml(incident.location)}</div>
        <div class="incident-details"><span>${escapeHtml(incident.id)} · ${escapeHtml(incident.time)}</span><span class="incident-confidence">${escapeHtml(incident.confidence)}% CONF.</span></div>
      </article>
    `).join("")}
  `;
}

function renderIncidentTable() {
  const query = $("#incident-search").value.trim().toLocaleLowerCase();
  const status = $("#incident-filter").value;
  const filtered = incidents.filter((incident) => {
    const matchesStatus = status === "all" || incident.status === status;
    const searchable = `${incident.id} ${incident.kind} ${incident.location} ${incident.status}`.toLocaleLowerCase();
    return matchesStatus && searchable.includes(query);
  });
  $("#incident-table").innerHTML = filtered.map((incident) => {
    const statusClass = incident.status === "Awaiting review" ? "pending" : incident.status === "Fallback simulated" ? "fallback" : "";
    return `<tr>
      <td>${escapeHtml(incident.id)}<span class="table-subtext">${escapeHtml(incident.kind)}</span></td>
      <td>${escapeHtml(incident.time)} IST</td>
      <td>${escapeHtml(incident.location)}</td>
      <td class="confidence-cell">${escapeHtml(incident.confidence)}%</td>
      <td><span class="status-tag ${statusClass}">${escapeHtml(incident.status)}</span></td>
    </tr>`;
  }).join("");
  $("#incident-table-empty").hidden = filtered.length > 0;
  $("#stat-incidents").textContent = String(incidents.length).padStart(2, "0");
}

function renderCameraTable() {
  $("#camera-table").innerHTML = cameras.map((camera) => {
    const online = camera[4] === "Online";
    return `<tr>
      <td>${escapeHtml(camera[0])}</td>
      <td>${escapeHtml(camera[1])}</td>
      <td>${escapeHtml(camera[2])}</td>
      <td>${escapeHtml(camera[3])}</td>
      <td><span class="table-status ${online ? "" : "warning"}"><i class="mini-dot"></i>${escapeHtml(camera[4])}</span></td>
    </tr>`;
  }).join("");
}

function renderAll() {
  renderQueue();
  renderActivity();
  renderIncidentTable();
  renderCameraTable();
  persistDemoState();
}

function showToast(message, tone = "") {
  const toast = document.createElement("div");
  toast.className = `toast ${tone}`.trim();
  toast.setAttribute("role", "status");
  toast.textContent = message;
  $("#toast-region").replaceChildren(toast);
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.remove(), 4400);
}

function finishIncident(status, tone, message) {
  if (!activeIncident) return;
  const incident = activeIncident;
  incident.status = status;
  activeIncident = null;
  closeIncidentModal();
  pushActivity(message, `${incident.id} · ${incident.location}`, tone);
  renderAll();
  showToast(message, tone === "amber" ? "warning" : "");
}

function triggerIncident() {
  const pending = incidents.find((incident) => incident.status === "Awaiting review");
  if (pending) {
    openIncidentModal(pending);
    return;
  }
  incidentSequence += 1;
  const incident = {
    id: `NG-${incidentSequence}`,
    time: formatClock().slice(0, 8),
    location: "NH-48 · Bilaspur Junction",
    confidence: 88 + (incidentSequence % 10),
    status: "Awaiting review",
    kind: "Two-wheeler fall",
    deadline: Date.now() + ESCALATION_SECONDS * 1000
  };
  incidents.unshift(incident);
  persistDemoState();
  pushActivity("Possible collision detected by AI", `${incident.id} · CAM-GGN-042`, "red");
  renderAll();
  openIncidentModal(incident);
}

function setView(viewName) {
  const names = ["overview", "incidents", "cameras"];
  if (!names.includes(viewName)) return;
  names.forEach((name) => {
    $(`#view-${name}`).hidden = name !== viewName;
  });
  document.querySelectorAll(".nav-item").forEach((button) => {
    const active = button.dataset.view === viewName;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  $("#page-crumb").textContent = viewName === "overview" ? "COMMAND CENTER" : viewName === "incidents" ? "INCIDENT LOG" : "CAMERA NETWORK";
  if (window.location.hash !== `#${viewName}`) window.history.replaceState(null, "", `#${viewName}`);
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});
document.querySelectorAll("[data-view-link]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.viewLink));
});
$("#incident-search").addEventListener("input", renderIncidentTable);
$("#incident-filter").addEventListener("change", renderIncidentTable);
$("#reset-demo").addEventListener("click", () => {
  if (!window.confirm("Reset all simulated incidents and activity to the original demo data?")) return;
  const modalWasOpen = !$("#decision-modal").hidden;
  activeIncident = null;
  if (modalWasOpen) closeIncidentModal();
  incidents.splice(0, incidents.length, ...seedIncidents.map((incident) => ({ ...incident })));
  activity.splice(0, activity.length, ...seedActivity.map((item) => ({ ...item })));
  incidentSequence = 2048;
  $("#incident-search").value = "";
  $("#incident-filter").value = "all";
  storageUnavailable = false;
  renderAll();
  showToast("Demo data reset to the original sample incidents.");
});
$("#trigger-incident").addEventListener("click", triggerIncident);
$("#trigger-incident-log").addEventListener("click", triggerIncident);
$("#modal-close").addEventListener("click", closeIncidentModal);
$("#acknowledge-incident").addEventListener("click", () => finishIncident("Acknowledged", "mint", "Incident acknowledged by OP112"));
$("#dispatch-incident").addEventListener("click", () => finishIncident("Dispatched · simulated", "mint", "Response unit dispatched (simulation)"));
$("#dismiss-incident").addEventListener("click", () => finishIncident("Dismissed", "amber", "Alert dismissed by OP112"));
queueElement.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const incident = incidents.find((item) => item.id === button.dataset.id);
  if (!incident) return;
  if (button.dataset.action === "review") openIncidentModal(incident);
  if (button.dataset.action === "dismiss") {
    incident.status = "Dismissed";
    pushActivity("Alert dismissed by OP112", `${incident.id} · ${incident.location}`, "amber");
    renderAll();
    showToast("Alert dismissed. No unit was contacted.", "warning");
  }
});
$("#decision-modal").addEventListener("click", (event) => {
  if (event.target.id === "decision-modal") closeIncidentModal();
});
document.addEventListener("keydown", (event) => {
  if ($("#decision-modal").hidden) return;
  const target = event.target;
  if (event.key === "Tab") {
    const controls = [...$("#decision-modal").querySelectorAll("button:not([disabled])")];
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
    return;
  }
  if (event.key === "Escape") closeIncidentModal();
  if (target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable=true]")) return;
  if (event.key.toLowerCase() === "a") finishIncident("Acknowledged", "mint", "Incident acknowledged by OP112");
  if (event.key.toLowerCase() === "d") finishIncident("Dispatched · simulated", "mint", "Response unit dispatched (simulation)");
});
window.addEventListener("hashchange", () => {
  const view = window.location.hash.slice(1);
  setView(["overview", "incidents", "cameras"].includes(view) ? view : "overview");
});

renderAll();
updateClocks();
window.setInterval(updateClocks, 1000);
window.setInterval(updateCountdown, 200);
updateCountdown();
if (storageUnavailable) showToast("Saved demo data could not be read. Changes in this session are temporary.", "warning");
const initialView = window.location.hash.slice(1);
setView(["overview", "incidents", "cameras"].includes(initialView) ? initialView : "overview");
