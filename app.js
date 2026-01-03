let galleryData = [];
let currentIndex = 0;
let touchStartX = 0;
let touchEndX = 0;
const SWIPE_THRESHOLD = 50;

const galleryContainer = document.getElementById('galleryContainer');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const lightboxCounter = document.getElementById('lightboxCounter');

async function init() {
    try {
        const response = await fetch(`gallery.json?t=${Date.now()}`, {
            cache: 'no-cache'
        });
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

function renderGallery() {
    const grid = document.createElement('div');
    grid.className = 'gallery-grid';
    
    galleryData.forEach((item, index) => {
        const itemElement = createGalleryItem(item, index);
        grid.appendChild(itemElement);
    });
    
    galleryContainer.appendChild(grid);
}

function createGalleryItem(item, index) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'gallery-item loading';
    itemDiv.setAttribute('data-index', index);
    
    const img = document.createElement('img');
    img.src = '';
    img.alt = item.alt || `Image ${index + 1}`;
    img.loading = index < 6 ? 'eager' : 'lazy';
    img.decoding = 'async';
    
    const src = item.src;
    
    itemDiv.style.paddingBottom = '100%';
    itemDiv.style.height = '0';
    itemDiv.style.position = 'relative';
    itemDiv.style.gridRowEnd = 'span 30';
    
    if (item.w && item.h) {
        const aspectRatio = item.h / item.w;
        const paddingBottom = aspectRatio * 100;
        itemDiv.style.paddingBottom = `${paddingBottom}%`;
        
        const estimatedWidth = 300;
        const estimatedHeight = estimatedWidth * aspectRatio;
        const rowHeight = 10;
        const rowSpan = Math.ceil(estimatedHeight / rowHeight);
        itemDiv.style.gridRowEnd = `span ${rowSpan}`;
    }
    
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
    
    img.onload = function() {
        if (!item.w || !item.h) {
            const aspectRatio = img.naturalHeight / img.naturalWidth;
            const paddingBottom = aspectRatio * 100;
            itemDiv.style.paddingBottom = `${paddingBottom}%`;
            
            const estimatedWidth = 300;
            const estimatedHeight = estimatedWidth * aspectRatio;
            const rowHeight = 10;
            const rowSpan = Math.ceil(estimatedHeight / rowHeight);
            itemDiv.style.gridRowEnd = `span ${rowSpan}`;
        }
        itemDiv.classList.remove('loading');
        itemDiv.classList.add('loaded');
    };
    
    if (index < 6) {
        img.src = src;
    } else {
        observer.observe(itemDiv);
    }
    
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
    
    preloadAdjacentImages();
}

function preloadAdjacentImages() {
    const nextIndex = (currentIndex + 1) % galleryData.length;
    if (galleryData[nextIndex]) {
        const nextImg = new Image();
        nextImg.src = galleryData[nextIndex].src;
    }
    
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
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
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
            nextImage();
        } else {
            prevImage();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const copyrightEl = document.getElementById('copyright');
    if (copyrightEl) {
        copyrightEl.textContent = `© ${new Date().getFullYear()}`;
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
