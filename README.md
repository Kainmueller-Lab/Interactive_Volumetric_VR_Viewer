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

### Open Locally in Your Browser
You can preview the viewer locally with a lightweight local server.

#### Option 1: **Python (already on most systems)**
Run this in the project folder:
```
python -m http.server 5500
```
Then open:  
[http://localhost:5500/](http://localhost:5500/)

#### Option 2: **Live Server (VS Code Extension)**
Install the *Live Server* extension.  
Right-click `index.html` → “Open with Live Server”.

---

## 2️⃣ Customize Your Viewer

### Load Your Own Volume

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

### Adjust Parameters Without Coding

All adjustable parameters are grouped at the top of `viewer.js`.  
Modify them directly to control camera behavior, rotation, field of view, and more.

| Parameter | Description | Typical Range |
|------------|--------------|----------------|
| `VOLUME_PATH` | Path to your `.nrrd` file | `"./data/yourfile.nrrd"` |
| `ROTATION_SPEED` | Rotation speed | 0.001 – 0.01 |
| `FOV` | Camera field of view (angle) | 60 – 100 |
| `ISOSURFACE_THRESHOLD` | Defines how much of the volume is visible | 0.0 – 1.0 |
| `TILT_UP_DOWN`, `TILT_LEFT_RIGHT`, `TILT_CLOCKWISE` | Orientation of the initial view in degrees | 0 - 360° |
| `ZOOM` | Initial zoom level | 0.5 – 2.0 |

---

## 3️⃣ Enter VR Mode

You can explore your 3D volume directly in **Virtual Reality**.  
For WebXR to work, the page must be served over **HTTPS** — either through public hosting or a secure local tunnel.

---

### 🅰️ Option A: Host the Project Online (GitHub Pages)

Turn your repository into a live, browser-accessible webpage that supports WebXR and VR mode.

1. Create a **public GitHub repository**.  
2. Push all project files (`index.html`, `viewer.js`, `data/...`) to the `main` branch.  
3. In your repo, go to **Settings → Pages → Source → “Deploy from a branch” → main (root)**.  
4. After saving, GitHub will provide a public URL (e.g., `https://username.github.io/repo-name/`).

Once the page is live, open it in any WebXR-compatible browser (desktop or VR device) and click **“Enter VR.”**

> ⚠️ If you want to view your own `.nrrd` data online, it must be included in the **public repository**.  
> Be careful when uploading **private, unpublished, or confidential datasets.**

---

### 🅱️ Option B: Use ngrok to Create a Secure Local Tunnel

If you prefer to keep your project and data private but still need an HTTPS link for WebXR, use **ngrok**.

1. Install ngrok from [https://ngrok.com](https://ngrok.com) (free signup required).  
2. Run your local server (e.g., `python -m http.server 5500` or `npx http-server -p 5500`).  
3. In another terminal, start an ngrok tunnel pointing to your local port:
```
ngrok http 5500
```
4. ngrok will display a forwarding HTTPS URL, for example:  
`https://a1b2c3d4.ngrok.io`
5. Open that HTTPS link in a **VR-capable browser** — on your computer, smartphone, or headset.
6. Click **“Enter VR”** to switch to immersive mode.  
7. (Optional) If you have VR controllers, you can interact with the viewer and adjust the parameters using the VR UI panel.

> This method keeps your data local while still satisfying browser security requirements for WebXR (HTTPS context).

---

## 📜 License and Attribution

This project is released under the **MIT License** — completely free to use, modify, and distribute.  
It builds upon the open-source **three.js** codebase and follows its permissive licensing model.  

If you create derivative work or reuse parts of this repository, please:  
- Retain the MIT license notice in your project.  
- Acknowledge this repository and the three.js project in your documentation or credits.  
- Always cite or credit original data sources when redistributing volumetric datasets.

