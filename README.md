# Interactive Volumetric VR Viewer

A simple, browser-based viewer for **3D volumetric data** with built-in **VR support** through WebXR.  
Open-source, lightweight, and works directly from your browser — no installation or compilation needed.

---

## 1️⃣ General Setup

### A. Get the Code
Download or clone this repository:

```
your-project/
├─ index.html
├─ viewer.js
└─ data/
   └─ stent.nrrd   ← sample volume
```

---

### B. Optional: Host as a GitHub Page
You can turn the repository into a live webpage so it runs directly in the browser and supports VR.

1. Create a **public GitHub repository**.  
2. Push all project files (`index.html`, `viewer.js`, `data/...`) to the main branch.  
3. Go to **Settings → Pages → Source → “Deploy from a branch” → main (root)**.  
4. Your viewer will be available at the GitHub Pages URL shown there.

This allows WebXR (VR) to run properly over HTTPS.

---

### C. Open Locally in Your Browser

You can preview the viewer locally with a lightweight local server — this avoids browser security restrictions on file loading.

#### Option 1: **Five Server (VS Code Extension)**
You already use this — just click **“Go Live”** in VS Code.

#### Option 2: **Live Server (VS Code Extension)**
Install the *Live Server* extension.  
Right-click `index.html` → “Open with Live Server”.

#### Option 3: **Python (already on most systems)**
Run this in the project folder:
```
python -m http.server 5500
```
Then open:  
[http://localhost:5500/](http://localhost:5500/)

#### Option 4: **Node.js**
If you have Node installed:
```
npx http-server -p 5500
```
Then open the same URL.

> ⚠️ Avoid opening `index.html` directly via `file://`. Browsers block loading local `.nrrd` files that way.

---

## 2️⃣ Customize Your Viewer

### A. Load Your Own Volume

1. Place your `.nrrd` file inside the `data/` folder.  
2. Edit this line at the top of `viewer.js`:
   ```js
   const VOLUME_PATH = './data/your_volume.nrrd';
   ```

Currently only **NRRD** format is supported.  
If your data is in another format, convert it first.

#### Easy Conversion to NRRD
You can use any of these methods:

- **3D Slicer:** Load your data → `File > Save` → choose `.nrrd`
- **ImageJ/Fiji:** Import your image stack → `File > Save As > Nrrd...`
- **ITK-SNAP:** `File > Save Image...` → `.nrrd`
- **Python (SimpleITK):**
  ```python
  import SimpleITK as sitk
  img = sitk.ReadImage("input.nii.gz")
  sitk.WriteImage(img, "output.nrrd")
  ```

---

### B. Adjust Parameters Without Coding

All adjustable parameters are grouped at the top of `viewer.js`.  
Modify them directly to control camera behavior, rotation, field of view, and more.

```js
// ================================================================
// CONFIGURATION PARAMETERS — Customize your VR Volume Viewer
// ================================================================

// Path to the volumetric dataset (NRRD)
const VOLUME_PATH = './data/stent.nrrd';

// Viewer rotation speed (Left–Right). 
// Typical range: 0.002 (slow) – 0.01 (fast)
const ROTATION_SPEED = 0.003;

// Camera field of view in degrees
const FOV = 80;

// Initial isosurface threshold (0–1). 
// Lower values show more detail; higher values show less.
const ISOSURFACE_THRESHOLD = 0.06;

// Camera orientation in degrees
const TILT_UP_DOWN = 90;      // Tilt up/down
const TILT_LEFT_RIGHT = 90;   // Tilt left/right
const TILT_CLOCKWISE = 0;     // Rotate clockwise

// Initial zoom (1.0 = default size)
const ZOOM = 1.0;

// ================================================================
```

**Parameter meanings:**

| Parameter | Description | Typical Range |
|------------|--------------|----------------|
| `VOLUME_PATH` | Path to your `.nrrd` file | `"./data/yourfile.nrrd"` |
| `ROTATION_SPEED` | Rotation sensitivity | 0.002 – 0.01 |
| `FOV` | Camera field of view (angle) | 60 – 90 |
| `ISOSURFACE_THRESHOLD` | Defines how much of the volume is visible | 0.02 – 0.2 |
| `TILT_UP_DOWN`, `TILT_LEFT_RIGHT`, `TILT_CLOCKWISE` | Orientation of the initial view | 0–180° |
| `ZOOM` | Initial zoom level | 0.5 – 2.0 |

---

## 3️⃣ Enter VR Mode

You can explore your 3D volume in **Virtual Reality**.

1. **Host the project online** (e.g., via GitHub Pages).  
2. Open the hosted webpage using a **VR-capable browser** (e.g., smartphone, headset browser, or desktop VR setup).  
3. Click the **“Enter VR”** button in the viewer.

> ⚠️ To view your own data online, your `.nrrd` file must be included in the **public repository**.  
> Do not upload private or sensitive data unless you trust the hosting environment.

**Browser Tips:**
- Works best with **Chromium-based browsers** supporting WebXR.
- On standalone headsets (Quest, Pico, etc.), use the built-in browser.
- If you don’t see “Enter VR,” ensure the site uses HTTPS and your device supports WebXR.

---

## ⚙️ Troubleshooting

| Problem | Likely Cause | Fix |
|----------|---------------|-----|
| Nothing appears | Wrong `VOLUME_PATH` or fetch error | Check path and console |
| CORS / fetch blocked | Opened via `file://` | Serve via local server |
| “Enter VR” missing | Browser lacks WebXR or no HTTPS | Use secure hosting |
| Viewer lagging | Volume too large | Downsample data or raise `ISOSURFACE_THRESHOLD` |

---

## 📜 License and Attribution

Free to use and modify.  
If you share your project, credit this repository or include a LICENSE file.  
Always cite original data sources if redistributing datasets.
