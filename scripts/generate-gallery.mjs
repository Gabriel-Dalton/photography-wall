import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const photosDir = path.join(rootDir, 'photos');
const outputFile = path.join(rootDir, 'gallery.json');

// Supported image extensions
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

// Get all image files recursively
function getAllImages(dir, fileList = []) {
    if (!fs.existsSync(dir)) {
        console.warn(`Photos directory not found: ${dir}`);
        return fileList;
    }

    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            getAllImages(filePath, fileList);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (IMAGE_EXTENSIONS.includes(ext)) {
                fileList.push(filePath);
            }
        }
    });

    return fileList;
}

// Get image metadata and sort key
async function getImageData(filePath) {
    try {
        const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
        const stats = fs.statSync(filePath);
        
        let width, height;
        let exifDate = null;
        
        try {
            const metadata = await sharp(filePath).metadata();
            width = metadata.width;
            height = metadata.height;
            
            // Try to get EXIF date
            if (metadata.exif) {
                // Sharp doesn't directly expose EXIF, but we can try to parse it
                // For simplicity, we'll use file mtime as fallback
                // In a production setup, you might use 'exif-reader' or similar
            }
        } catch (err) {
            console.warn(`Could not read metadata for ${relativePath}:`, err.message);
            // Fallback: try to get dimensions from a basic image read
            try {
                const image = sharp(filePath);
                const metadata = await image.metadata();
                width = metadata.width;
                height = metadata.height;
            } catch (e) {
                console.warn(`Could not get dimensions for ${relativePath}`);
            }
        }
        
        return {
            src: relativePath,
            w: width || null,
            h: height || null,
            alt: path.basename(filePath, path.extname(filePath)),
            mtime: stats.mtime.getTime(),
            filename: path.basename(filePath)
        };
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        return null;
    }
}

// Sort images: newest first (by mtime, then by filename)
function sortImages(images) {
    return images.sort((a, b) => {
        // First sort by modification time (newest first)
        if (b.mtime !== a.mtime) {
            return b.mtime - a.mtime;
        }
        // Then by filename (descending for newest)
        return b.filename.localeCompare(a.filename);
    });
}

// Main function
async function generateGallery() {
    console.log('Scanning photos directory...');
    const imageFiles = getAllImages(photosDir);
    
    if (imageFiles.length === 0) {
        console.warn('No images found in photos directory.');
        fs.writeFileSync(outputFile, JSON.stringify([], null, 2));
        console.log(`Generated empty gallery.json`);
        return;
    }
    
    console.log(`Found ${imageFiles.length} images. Processing...`);
    
    const galleryItems = [];
    
    for (const filePath of imageFiles) {
        const imageData = await getImageData(filePath);
        if (imageData) {
            galleryItems.push(imageData);
        }
    }
    
    // Sort images (by mtime and filename)
    const sortedItems = sortImages(galleryItems);
    
    // Remove internal sort fields before output
    const outputItems = sortedItems.map(({ mtime, filename, ...item }) => item);
    
    // Write gallery.json
    fs.writeFileSync(outputFile, JSON.stringify(outputItems, null, 2));
    
    console.log(`✓ Generated gallery.json with ${outputItems.length} images`);
    console.log(`  Output: ${outputFile}`);
}

// Run
generateGallery().catch(error => {
    console.error('Error generating gallery:', error);
    process.exit(1);
});

