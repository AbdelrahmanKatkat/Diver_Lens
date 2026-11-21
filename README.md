# Dive ColorLab

**Dive ColorLab** is a free, browser-based colour lab for underwater photos and videos. Water absorbs red light first, so dive footage tends to look blue or green, flat and hazy. Dive ColorLab restores the colour, contrast and clarity, and lets you save the corrected result back to your computer.

It is a pure static website: no server, no build step, no account. **Your files never leave your device.** They are opened with the browser's File API and processed locally on a canvas.

**Live site:** https://abdelrahmankatkat.github.io/Diver_Lens/

## Features

- **Open local files**: Import Media button or drag and drop. Photos (JPG, PNG, WebP, AVIF) and videos (MP4, WebM, MOV where the browser supports it).
- **Adaptive Auto Enhance**: reads each picture (how much red is lost, blue or green water, haze, brightness), tries several looks and keeps the most natural one. An **Amount** slider (0 to 150%) dials it up or down, and a note tells you what it found.
- **Underwater correction**: white balance with Auto and a **Pick grey** eyedropper, colour-cast removal (blue/green), dehaze, backscatter reduction, noise reduction.
- **Colour and tone**: temperature, tint, exposure, contrast, highlights, shadows, vibrance, saturation, clarity.
- **Pro controls**: RGB and per-channel curves, shadows/midtones/highlights colour wheels, 9-band HSL.
- **Quick Actions**: Auto Enhance, Color Restore, Remove Haze, Dehaze + Contrast, Underwater WB, Denoise.
- **Presets**: built-in looks (Tropical Reef, Blue Water, Green Water, Cave / Low Light, Wreck Cinematic, Macro Pop) plus your own, saved in the browser.
- **Before / After**: draggable split, side-by-side, or original only.
- **Crop, rotate and flip**: drag a crop frame on the preview (free, original, 1:1, 4:3, 3:2, 16:9, 9:16 or 4:5), rotate in 90° steps and flip. Works for photos and videos and is applied on export.
- **Video editing**: trim start and end, speed from 0.25× to 4×, fade in and out, remove the audio. The preview and the exported MP4 follow your edits.
- **Export**: JPEG, PNG or WebP at full resolution; **video to MP4 (H.264 + AAC)** up to the original resolution; batch export as a ZIP or into a folder; project files that store your settings.
- **Water conditions**: tell Auto what you are diving in (Blue, Green, Turbid, Shallow or Corrected), or leave it on Auto and it shows what it detected.
- **Zoom and pan** on the preview (mouse wheel, or the Fit / 100% buttons), preset thumbnails made from your own photo, copy and paste settings between photos, and a note when you reopen a file you edited before.
- **Fast**: the colour engine runs on your graphics card (WebGL2), so sliders and video preview are real-time. A CPU version is used automatically if WebGL2 is not available.
- **Undo / redo, histogram, shortcuts**: Ctrl+Z / Ctrl+Y, hold `\` to see the original, `W` for the grey picker. Curves, Color Wheels and HSL sit under a **Pro tools** bar that you can open when you need them.
- **Works offline**: after the first visit the app files are cached (never your media), and it can be installed as an app.
- **Dark and light theme**: follows your system, toggle in the header.

## How to use

The bar under the header shows the workflow:

1. **Import**: click **Import Media** (or drop files onto the page). Sample reef photos are included so you can try it immediately.
2. **Correct**: pick a photo in the filmstrip, then try **Auto Enhance**, or adjust the sliders on the right (Color Correction / Advanced / Presets tabs), Curves, Color Wheels and HSL at the bottom. Double-click a slider label to reset it.
3. **Compare**: drag the divider on the preview, or press **Compare** to cycle split, side-by-side and original.
4. **Export**: click **Export**, choose format, quality and size, and save. In Chrome and Edge you get a normal Save As dialog; other browsers download the file.

**Crop & Trim tab** (right panel): pick a crop shape and drag the frame on the preview, then switch to another tab to see the result. For videos you can also set the start and end (type a time, or move the playhead and press *Start = playhead* / *End = playhead*), change the speed, add fades or remove the sound. Reset crop & rotation puts the picture back.

**Batch tab**: copy the current settings to every opened photo, then export all of them as a ZIP (or straight into a folder in Chromium browsers).

**Projects**: in the sidebar, save your settings to a small `.json` file and reopen it later with the same files.

### Notes

- In Chrome and Edge the MP4 is written straight to the file you choose, so long clips do not fill memory. Video export decodes the file with the browser, runs every frame through your GPU and keeps the source frame rate (there is a Compatibility mode in the export dialog for older setups). It renders frame by frame on your GPU and encodes MP4 with the browser's built-in encoder (WebCodecs), keeping the original audio. Choose 720p, 1080p or original size (up to 4K). Keep the tab visible until it finishes. Browsers without WebCodecs fall back to a slower WebM mode.
- Video levels are measured once per clip, so the colour does not flicker between frames.
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
js/engine.js      colour-processing engine (CPU reference), curves, statistics, ZIP writer
js/gl.js          the same engine as a WebGL2 shader (live preview and fast export)
js/vendor/        mp4-muxer (MIT) and Mediabunny (MPL-2.0) used to read and write video files
js/app.js         interface, file opening, comparison, export
js/theme.js       applies the saved theme before first paint
sw.js, manifest.webmanifest   offline cache and install support
tests/run.js      optional dev checks (GPU matches CPU, Auto sanity, undo); see the file header
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

MP4 writing uses [mp4-muxer](https://github.com/Vanilagy/mp4-muxer) by Vanilagy (MIT license, included in `js/vendor/`). Video export reads and writes files with [Mediabunny](https://github.com/Vanilagy/mediabunny) by Vanilagy (MPL-2.0, license included in `js/vendor/`).
