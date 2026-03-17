# IBI Correction Dashboard

A browser-based tool for validating and correcting peak detection in ECG signals. All data is processed **locally in your browser** — no files are uploaded to any server.

## What it does

Load ECG data with detected R-peaks, visually inspect them, and make corrections:

- Add or remove peaks by selecting regions on the waveform
- Set start/end markers to crop the recording
- Mark artifact regions to exclude from IBI calculation
- Export corrected data with recalculated inter-beat intervals (IBI)

The UI shows a **focus view** (zoomed waveform) and a **context view** (full recording overview with a draggable brush for navigation).

## Run (development)

```bash
cd ibi_dashboard
npm install   # first time only
npm start
```

Opens at `http://localhost:3000`. Hot-reloading is enabled.

## Build

```bash
cd ibi_dashboard
npm run build
```

Output goes to `ibi_dashboard/build/`. Open `index.html` directly in a browser — no server required.

## Usage

1. Click **Load** to import a JSON file (see format below)
2. Select a tool from the toolbar:
   - **Add Peak** — drag to select a region; places a peak at the maximum value
   - **Remove Peaks** — drag to select a region; removes all peaks within it
   - **Set Start / End Marker** — click to define the valid recording range
   - **Exclude Region** — drag to mark an artifact region (excluded from IBI)
   - **Include Region** — click an excluded region to re-include it
3. Use the context view brush to navigate long recordings
4. Click **Download** to export the corrected data

## Data format

### Input JSON

```json
{
  "ecg": [{ "ecg": 0.123 }, ...],
  "peaks": [120, 240, 360, ...],
  "samplingRate": 1000,
  "startIndex": 0,
  "endIndex": 9999,
  "removedRegions": [{ "start": 500, "end": 600 }]
}
```

`startIndex`, `endIndex`, and `removedRegions` are optional.

### Output JSON

```json
{
  "ecgCropped": [{ "index": 0, "ecg": 0.123 }, ...],
  "peaksCropped": [120, 240, ...],
  "ibi": {
    "samples": [120, 121, ...],
    "ms": [120.0, 121.0, ...]
  },
  "samplingRate": 1000,
  "startIndex": 0,
  "endIndex": 9999,
  "removedRegions": [...],
  "ecg": [...],
  "peaks": [...]
}
```

Cropped fields contain only data within the start/end markers, with excluded regions removed. Full `ecg` and `peaks` arrays are included for reference.

## Data conversion utility

If your data is in CSV format, convert it first:

```bash
node ibiDataToInputData.js
```

Reads peak CSVs from `../STREAMS_TO_IBI/ibiData/` and ECG CSVs from `../RAW_TO_STREAMS/streams/`, and writes JSON files to `./dashboardInputData/`.

## Privacy

This app runs entirely in your browser. No data is sent anywhere — ECG files are loaded and processed locally only.
