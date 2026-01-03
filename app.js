// Gallery data will be loaded from gallery.json
let galleryData = [];
let currentIndex = 0;
let touchStartX = 0;
let touchEndX = 0;
const SWIPE_THRESHOLD = 50;

// DOM elements
const galleryContainer = document.getElementById('galleryContainer');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const lightboxCounter = document.getElementById('lightboxCounter');

// Initialize
async function init() {
    try {
        const response = await fetch('gallery.json');
        if (!response.ok) {
            throw new Error('Failed to load gallery.json');
        }
        galleryData = await response.json();
        
        if (galleryData.length === 0) {
            galleryContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">No images found. Add photos to the /photos folder.</p>';
            return;
        }
        
        renderGallery();
        setupLightbox();
    } catch (error) {
        console.error('Error loading gallery:', error);
        galleryContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: #d32f2f;">Error loading gallery. Please ensure gallery.json exists.</p>';
    }
}

// Render gallery grid
function renderGallery() {
    const grid = document.createElement('div');
    grid.className = 'gallery-grid';
    
    galleryData.forEach((item, index) => {
        const itemElement = createGalleryItem(item, index);
        grid.appendChild(itemElement);
    });
    
    galleryContainer.appendChild(grid);
}

// Create a gallery item
function createGalleryItem(item, index) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'gallery-item loading';
    itemDiv.setAttribute('data-index', index);
    
    const img = document.createElement('img');
    img.src = '';
    img.alt = item.alt || `Image ${index + 1}`;
    img.loading = index < 6 ? 'eager' : 'lazy';
    img.decoding = 'async';
    
    // Use WebP/AVIF if available, fallback to original
    const src = item.src;
    
    // Set aspect ratio placeholder - will be updated when image loads
    // Default to square until we know the actual dimensions
    itemDiv.style.paddingBottom = '100%';
    itemDiv.style.height = '0';
    itemDiv.style.position = 'relative';
    itemDiv.style.gridRowEnd = 'span 30'; // Approximate for square
    
    // If dimensions are provided, use them
    if (item.w && item.h) {
        const aspectRatio = item.h / item.w;
        const paddingBottom = aspectRatio * 100;
        itemDiv.style.paddingBottom = `${paddingBottom}%`;
        
        // Calculate grid row span for masonry (grid-auto-rows: 10px)
        const estimatedWidth = 300; // Approximate column width
        const estimatedHeight = estimatedWidth * aspectRatio;
        const rowHeight = 10; // grid-auto-rows value
        const rowSpan = Math.ceil(estimatedHeight / rowHeight);
        itemDiv.style.gridRowEnd = `span ${rowSpan}`;
    }
    
    // Lazy load with IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetImg = entry.target.querySelector('img');
                if (targetImg && !targetImg.src) {
                    targetImg.src = src;
                    targetImg.onload = () => {
                        entry.target.classList.remove('loading');
                        entry.target.classList.add('loaded');
                    };
                }
                observer.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: '50px'
    });
    
    // Update aspect ratio when image loads (if dimensions weren't provided)
    img.onload = function() {
        if (!item.w || !item.h) {
            // Update aspect ratio based on actual image dimensions
            const aspectRatio = img.naturalHeight / img.naturalWidth;
            const paddingBottom = aspectRatio * 100;
            itemDiv.style.paddingBottom = `${paddingBottom}%`;
            
            // Update grid row span
            const estimatedWidth = 300;
            const estimatedHeight = estimatedWidth * aspectRatio;
            const rowHeight = 10;
            const rowSpan = Math.ceil(estimatedHeight / rowHeight);
            itemDiv.style.gridRowEnd = `span ${rowSpan}`;
        }
        itemDiv.classList.remove('loading');
        itemDiv.classList.add('loaded');
    };
    
    // Preload first few images immediately
    if (index < 6) {
        img.src = src;
    } else {
        observer.observe(itemDiv);
    }
    
    // Position image absolutely within the aspect ratio container
    img.style.position = 'absolute';
    img.style.top = '0';
    img.style.left = '0';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    
    itemDiv.appendChild(img);
    itemDiv.addEventListener('click', () => openLightbox(index));
    
    return itemDiv;
}

// Lightbox functions
function openLightbox(index) {
    currentIndex = index;
    updateLightboxImage();
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function updateLightboxImage() {
    const item = galleryData[currentIndex];
    if (!item) return;
    
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt || `Image ${currentIndex + 1}`;
    lightboxCounter.textContent = `${currentIndex + 1} / ${galleryData.length}`;
    
    // Preload adjacent images for smoother navigation
    preloadAdjacentImages();
}

function preloadAdjacentImages() {
    // Preload next image
    const nextIndex = (currentIndex + 1) % galleryData.length;
    if (galleryData[nextIndex]) {
        const nextImg = new Image();
        nextImg.src = galleryData[nextIndex].src;
    }
    
    // Preload previous image
    const prevIndex = (currentIndex - 1 + galleryData.length) % galleryData.length;
    if (galleryData[prevIndex]) {
        const prevImg = new Image();
        prevImg.src = galleryData[prevIndex].src;
    }
}

function nextImage() {
    currentIndex = (currentIndex + 1) % galleryData.length;
    updateLightboxImage();
}

function prevImage() {
    currentIndex = (currentIndex - 1 + galleryData.length) % galleryData.length;
    updateLightboxImage();
}

// Setup lightbox event listeners
function setupLightbox() {
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        prevImage();
    });
    lightboxNext.addEventListener('click', (e) => {
        e.stopPropagation();
        nextImage();
    });
    
    // Close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        switch(e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                prevImage();
                break;
            case 'ArrowRight':
                nextImage();
                break;
        }
    });
    
    // Touch/swipe support
    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
}

function handleSwipe() {
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
        if (diff > 0) {
            // Swipe left - next
            nextImage();
        } else {
            // Swipe right - previous
            prevImage();
        }
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

