# Photography Wall Portfolio

A clean, minimal, and performant static photography portfolio that automatically generates a gallery from images in the `/photos` folder. Perfect for hosting on GitHub Pages.

## Features

- 🖼️ **Responsive masonry grid** - Beautiful photo wall that adapts to any screen size
- 🔍 **Lightbox viewer** - Click any photo to view in full-screen with smooth animations
- ⌨️ **Keyboard navigation** - Arrow keys to navigate, Esc to close
- 📱 **Touch/swipe support** - Swipe left/right on mobile devices
- ⚡ **Performance optimized** - Lazy loading, responsive images, IntersectionObserver
- 🔄 **Auto-generated gallery** - Just add photos to `/photos` and run the build script
- 🎨 **Clean design** - Minimal UI focused on your photography

## Quick Start

### 1. Add Your Photos

Place your images in the `/photos` folder. You can organize them in subfolders if needed.

```
photos/
  ├── image1.jpg
  ├── image2.jpg
  ├── vacation/
  │   ├── photo1.jpg
  │   └── photo2.jpg
  └── ...
```

### 2. Generate Gallery

**✨ Option A: Automatic (Easiest - Just push photos!)**

The GitHub Action will automatically generate `gallery.json` when you push photos to the `/photos` folder. **You don't need to do anything!** Just:

1. Upload your photos to `/photos` folder on GitHub
2. Push the changes
3. The GitHub Action runs automatically and updates `gallery.json`
4. Your gallery updates automatically!

**Option B: Browser-Based Generator (No npm required)**

1. Open `generate-gallery.html` in your web browser
2. Click "Select images from /photos folder" and select your entire `/photos` folder (or individual images)
3. Click "Generate Gallery JSON"
4. Download the generated `gallery.json` file and place it in your project root

**Option C: Node.js Script (Optional)**

If you have Node.js installed and want to test locally:

```bash
npm install
npm run generate
```

### 3. Test Locally

You can test the site locally using any static file server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### 4. Deploy to GitHub Pages

1. Push your repository to GitHub
2. Go to your repository settings
3. Navigate to **Pages** in the sidebar
4. Under **Source**, select your branch (usually `main` or `master`)
5. Click **Save**

Your site will be available at `https://[username].github.io/[repository-name]`

**Enable GitHub Actions (for automatic gallery generation):**
1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select **Read and write permissions**
3. Check **Allow GitHub Actions to create and approve pull requests**
4. Click **Save**

Now when you push photos to `/photos`, the gallery will update automatically!

**Important:** 
- If using the **GitHub Action** (Option A): Just push your photos - the gallery updates automatically!
- If using **manual methods** (Options B or C): Remember to regenerate and commit `gallery.json` after adding photos

## How It Works

### Gallery Generation

The build script (`scripts/generate-gallery.mjs`) does the following:

1. **Scans** the `/photos` directory recursively for image files
2. **Reads** image dimensions and metadata using Sharp
3. **Sorts** images by modification date (newest first), falling back to filename if dates are equal
4. **Generates** `gallery.json` with an array of image objects:
   ```json
   [
     {
       "src": "photos/image1.jpg",
       "w": 1920,
       "h": 1080,
       "alt": "image1"
     }
   ]
   ```

### Image Loading

- **Lazy loading**: Images below the fold are loaded only when they come into view
- **Priority loading**: First 6 images are loaded immediately for fast initial render
- **IntersectionObserver**: Efficiently detects when images enter the viewport
- **Responsive images**: Uses `object-fit` and aspect ratio placeholders to prevent layout shift

### Lightbox

- Opens on click with smooth zoom animation
- Navigation via arrow keys, on-screen buttons, or swipe gestures
- Closes with Esc key or by clicking outside the image
- Shows current image counter (e.g., "3 / 12")

## Recommended Image Sizes and Formats

### Formats

- **WebP** or **AVIF** - Best compression and quality (recommended)
- **JPEG** - Universal support, good for photos
- **PNG** - Best for graphics with transparency

### Sizes

For optimal performance:

- **Desktop**: 1200-1920px wide (depending on your needs)
- **Mobile**: 800-1200px wide
- **File size**: Aim for < 500KB per image when possible

The gallery will work with any size, but smaller files load faster. Consider using image optimization tools like:

- [Squoosh](https://squoosh.app/) - Web-based image optimizer
- [ImageOptim](https://imageoptim.com/) - Desktop app
- [Sharp](https://sharp.pixelplumbing.com/) - Node.js library (already in dependencies)

## File Structure

```
photography-wall/
├── index.html          # Main HTML file
├── styles.css          # All styles
├── app.js              # Gallery and lightbox logic
├── gallery.json        # Auto-generated gallery data
├── generate-gallery.html  # Browser-based gallery generator (no npm needed!)
├── photos/             # Your images go here
│   ├── image1.jpg
│   └── ...
├── scripts/
│   └── generate-gallery.mjs  # Node.js build script (optional)
├── package.json        # Node.js dependencies (optional)
└── README.md          # This file
```

## Customization

### Change Colors

Edit CSS variables in `styles.css`:

```css
:root {
    --bg-color: #fafafa;        /* Background color */
    --text-color: #333;         /* Text color */
    --lightbox-bg: rgba(0, 0, 0, 0.95);  /* Lightbox background */
}
```

### Adjust Grid Spacing

Modify the `--spacing` variable and grid gap values in `styles.css`.

### Change Footer Link

Edit the footer in `index.html`:

```html
<footer class="footer">
    <a href="https://your-link.com" target="_blank" rel="noopener noreferrer">Your Link</a>
</footer>
```

## Performance Tips

1. **Optimize images** before adding them to `/photos`
2. **Use WebP/AVIF** formats when possible
3. **Keep file sizes reasonable** (< 500KB per image)
4. **Regenerate `gallery.json`** after adding new photos (use `generate-gallery.html` or `npm run generate`)
5. **Commit `gallery.json`** to your repository so GitHub Pages serves it correctly

## Troubleshooting

### Gallery is empty

- Make sure you've run `npm run generate` after adding photos
- Check that images are in the `/photos` folder
- Verify `gallery.json` exists and contains image data

### Images not loading

- Check browser console for errors
- Verify image paths in `gallery.json` are correct
- Ensure images are committed to the repository

### Build script fails

- **Use the browser-based generator instead!** Open `generate-gallery.html` in your browser - no npm needed
- If using Node.js: Make sure you've run `npm install` first
- Check that Node.js version is 14+ (for ES modules)
- Verify the `/photos` folder exists

## License

MIT

