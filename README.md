# Interactive Volumetric VR Viewer

A simple, browser-based viewer for **3D volumetric data** with built-in **VR support** through WebXR.  
Open-source, lightweight, and works directly from your browser.

---

## 1️⃣ General Setup

### Get the Code
Clone this repository:

```
git clone https://github.com/Kainmueller-Lab/Interactive_Volumetric_VR_Viewer.git
```

---

### Option A: Host as a GitHub Page
Turn your repository into a live webpage so it runs directly in the browser and supports VR.
Use this option if your **data is public**.

1. Make it a **public GitHub repository**.  
2. Push all project files (`index.html`, `viewer.js`, `data/...`) to the main branch.  
3. Go to **Settings → Pages → Source → “Deploy from a branch” → main (root)**.  
4. Your viewer will be available at the GitHub Pages URL shown there after a refresh.

---

### Option B: Open Locally in Your Browser
You can preview the viewer locally with a lightweight local server.
Use this option for **private data**.

#### Option 1: **Live Server (VS Code Extension)**
Install the *Live Server* extension.  
Right-click `index.html` → “Open with Live Server”.

#### Option 2: **Python (already on most systems)**
Run this in the project folder:
```
python -m http.server 5500
```
Then open:  
[http://localhost:5500/](http://localhost:5500/)

---

## 2️⃣ Customize Your Viewer

### A. Load Your Own Volume

1. Place your `.nrrd` file inside the `data/` folder.  
2. Edit this line at the top of `viewer.js`:
   ```js
   const VOLUME_PATH = './data/your_volume.nrrd';
   ```
> ⚠️ To view your own data online, your `.nrrd` file must be included in the **public repository**.  
> Do not upload private or sensitive data unless you trust the hosting environment.

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

| Parameter | Description | Typical Range |
|------------|--------------|----------------|
| `VOLUME_PATH` | Path to your `.nrrd` file | `"./data/yourfile.nrrd"` |
| `ROTATION_SPEED` | Rotation speed | 0.001 – 0.01 |
| `FOV` | Camera field of view (angle) | 60 – 100 |
| `ISOSURFACE_THRESHOLD` | Defines how much of the volume is visible | 0.0 – 1.0 |
| `TILT_UP_DOWN`, `TILT_LEFT_RIGHT`, `TILT_CLOCKWISE` | Orientation of the initial view in degrees |  |
| `ZOOM` | Initial zoom level | 0.5 – 2.0 |

---

## 3️⃣ Enter VR Mode

You can explore your 3D volume in **Virtual Reality**.

1. **Host the project online** (e.g., via GitHub Pages).  
2. Open the hosted webpage using a **VR-capable browser** (e.g., smartphone, headset browser, or desktop VR setup).  
3. Click the **“Enter VR”** button in the viewer.
4. (Optional) If you have controllers, use them to adjust the sliders on the VR panel.

---

## 📜 License and Attribution

This project is released under the **MIT License** — completely free to use, modify, and distribute.  
It builds upon the open-source **three.js** codebase and follows its permissive licensing model.  

If you create derivative work or reuse parts of this repository, please:  
- Retain the MIT license notice in your project.  
- Acknowledge this repository and the three.js project in your documentation or credits.  
- Always cite or credit original data sources when redistributing volumetric datasets.

