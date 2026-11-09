# Dive ColorLab

**Dive ColorLab** is a free, browser-based colour lab for underwater photos and videos. Water absorbs red light first, so dive footage tends to look blue or green, flat and hazy. Dive ColorLab restores the colour, contrast and clarity, and lets you save the corrected result back to your computer.

It is a pure static website: no server, no build step, no account. **Your files never leave your device.** They are opened with the browser's File API and processed locally on a canvas.

**Live site:** https://abdelrahmankatkat.github.io/Diver_Lens/

## Features

- **Open local files**: Import Media button or drag and drop. Photos (JPG, PNG, WebP, AVIF) and videos (MP4, WebM, MOV where the browser supports it).
- **Underwater correction**: white balance with Auto, colour-cast removal (blue/green), dehaze, backscatter reduction, noise reduction.
- **Colour and tone**: temperature, tint, exposure, contrast, highlights, shadows, vibrance, saturation, clarity.
- **Pro controls**: RGB and per-channel curves, shadows/midtones/highlights colour wheels, 9-band HSL.
- **Quick Actions**: Auto Enhance, Color Restore, Remove Haze, Dehaze + Contrast, Underwater WB, Denoise.
- **Presets**: built-in looks (Tropical Reef, Blue Water, Green Water, Cave / Low Light, Wreck Cinematic, Macro Pop) plus your own, saved in the browser.
- **Before / After**: draggable split, side-by-side, or original only.
- **Export**: JPEG, PNG or WebP at full resolution; video to `.webm`; batch export as a ZIP or into a folder; project files that store your settings.
- **Dark and light theme**: follows your system, toggle in the header.

## How to use

The bar under the header shows the workflow:

1. **Import**: click **Import Media** (or drop files onto the page). Sample reef photos are included so you can try it immediately.
2. **Correct**: pick a photo in the filmstrip, then try **Auto Enhance**, or adjust the sliders on the right (Color Correction / Advanced / Presets tabs), Curves, Color Wheels and HSL at the bottom. Double-click a slider label to reset it.
3. **Compare**: drag the divider on the preview, or press **Compare** to cycle split, side-by-side and original.
4. **Export**: click **Export**, choose format, quality and size, and save. In Chrome and Edge you get a normal Save As dialog; other browsers download the file.

**Batch tab**: copy the current settings to every opened photo, then export all of them as a ZIP (or straight into a folder in Chromium browsers).

**Projects**: in the sidebar, save your settings to a small `.json` file and reopen it later with the same files.

### Notes

- Video export is re-rendered in real time (up to 960 px on the long edge). Keep the tab visible until it finishes. Output is `.webm`.
- RAW and HEIC files cannot be decoded by browsers.
- Presets and theme are stored in your browser's local storage only.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## Host it on GitHub Pages

1. Push this repository to GitHub (branch `main`).
2. Go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, then `main` and `/ (root)`.
3. The site is published at `https://<your-user>.github.io/<repo>/`. All paths are relative, so it works under a sub-path.

## Project structure

```
index.html        page markup
css/style.css     layout and dark / light themes
js/engine.js      colour-processing engine, curves, statistics, ZIP writer
js/app.js         interface, file opening, comparison, export
assets/           background, sample photos, logo
```

## Credits

Sample photos are from Wikimedia Commons:

- Sea turtle: David Vogel (public domain)
- Clownfish: Janderk (public domain)
- Manta ray: NOAA National Marine Sanctuaries (public domain)
- Shipwreck: W. Strickling, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- Coral reef: NOAA Photo Library (public domain)

The page background is a cinematic coral reef illustration supplied with the project.
