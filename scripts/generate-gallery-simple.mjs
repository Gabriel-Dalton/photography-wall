import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const photosDir = path.join(rootDir, 'photos');
const outputFile = path.join(rootDir, 'gallery.json');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.cr2'];

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

async function getImageData(filePath) {
    try {
        const ext = path.extname(filePath).toLowerCase();
        const stats = fs.statSync(filePath);
        const basename = path.basename(filePath, ext);
        const dir = path.dirname(filePath);
        
        let relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
        let finalPath = relativePath;
        
        if (ext === '.cr2') {
            const jpgPath = path.join(dir, `${basename}.jpg`);
            const jpgRelativePath = path.relative(rootDir, jpgPath).replace(/\\/g, '/');
            
            if (!fs.existsSync(jpgPath)) {
                console.log(`Converting ${relativePath} to JPG...`);
                try {
                    await sharp(filePath)
                        .jpeg({ quality: 92, mozjpeg: true })
                        .toFile(jpgPath);
                    console.log(`✓ Converted to ${jpgRelativePath}`);
                } catch (convError) {
                    console.warn(`Could not convert ${relativePath}: ${convError.message}`);
                    console.warn(`  Make sure you have libvips installed for CR2 support`);
                    return null;
                }
            }
            finalPath = jpgRelativePath;
        }
        
        let width = null;
        let height = null;
        
        try {
            const imagePath = ext === '.cr2' ? path.join(dir, `${basename}.jpg`) : filePath;
            const metadata = await sharp(imagePath).metadata();
            width = metadata.width;
            height = metadata.height;
        } catch (err) {
            console.warn(`Could not read dimensions for ${finalPath}`);
        }
        
        return {
            src: finalPath,
            w: width,
            h: height,
            alt: basename,
            mtime: stats.mtime.getTime(),
            filename: path.basename(filePath)
        };
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        return null;
    }
}

function sortImages(images) {
    return images.sort((a, b) => {
        if (b.mtime !== a.mtime) {
            return b.mtime - a.mtime;
        }
        return b.filename.localeCompare(a.filename);
    });
}

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
    
    const sortedItems = sortImages(galleryItems);
    
    const outputItems = sortedItems.map(({ mtime, filename, ...item }) => item);
    
    fs.writeFileSync(outputFile, JSON.stringify(outputItems, null, 2));
    
    console.log(`✓ Generated gallery.json with ${outputItems.length} images`);
    console.log(`  Output: ${outputFile}`);
}

generateGallery().catch(error => {
    console.error('Error generating gallery:', error);
    process.exit(1);
});
