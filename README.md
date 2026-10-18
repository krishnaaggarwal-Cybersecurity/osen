# NetraGrid AI — Command Center Demo

A responsive, dependency-free operator console prototype inspired by the NetraGrid AI pitch. It demonstrates a simulated camera incident, a 15-second operator review window, searchable and filterable audit history, camera health, and a stylized response map.

## Run locally

Open `index.html` in a modern browser. No build step, package installation, backend, or API keys are required. For local serving, run `python -m http.server 8000` from this directory and visit `http://localhost:8000`.

## Demo interactions

- **Simulate incident** adds a sample collision alert and starts the 15-second review timer.
- **Acknowledge**, **Dispatch unit**, or **Dismiss alert** records a simulated operator action. The modal also supports `A` to acknowledge, `D` to simulate dispatch, and `Esc` to close.
- If the timer expires, including while the alert is closed or the page is refreshed, the console records a simulated fallback event. The timer uses a stored deadline rather than a pause-sensitive interval.
- **Incident log** and **Camera network** in the sidebar show sample audit and camera telemetry.
- Search or filter the incident log; use **Reset demo data** to restore the original sample history.
- Simulated incidents and audit entries are stored in this browser's local storage and remain local to this demo.

## Prototype boundary

This is a front-end demo with illustrative data and artwork. It does not process camera feeds, perform computer-vision inference, contact emergency services, or place phone calls. Dispatch and timer behavior is client-side simulation only; local browser storage is not an operational incident database. This prototype is not suitable for operational or emergency use.
