export class UI {
    renderIcon(iconNode, size = 20) {
        // iconNode is expected to be in lucide's format: [tag, attrs, children]
        if (!Array.isArray(iconNode) || iconNode.length < 3) {
            // Fallback for safety
            return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
        }

        const [tag, defaultAttrs, children] = iconNode;

        const attrs = {
            ...defaultAttrs,
            width: size,
            height: size,
            class: `lucide-icon`,
        };
        
        attrs.fill = attrs.fill || 'none';
        attrs.stroke = attrs.stroke || 'currentColor';
        attrs['stroke-width'] = attrs['stroke-width'] || 2;
        attrs['stroke-linecap'] = attrs['stroke-linecap'] || 'round';
        attrs['stroke-linejoin'] = attrs['stroke-linejoin'] || 'round';

        const attrsString = Object.entries(attrs)
            .map(([key, value]) => `${key}="${value}"`)
            .join(' ');

        const childrenString = children
            .map((childNode) => {
                // FIX: Add a check to ensure the child node is a valid, iterable array.
                // This prevents the "object is not iterable" error if the data is malformed.
                if (!Array.isArray(childNode) || childNode.length < 1) {
                    console.warn('Skipping invalid lucide child node:', childNode);
                    return ''; // Safely skip malformed children
                }

                // Use a default for attributes for added safety.
                const [childTag, childAttrs = {}] = childNode;

                const childAttrsString = Object.entries(childAttrs)
                    .map(([key, value]) => `${key}="${value}"`)
                    .join(' ');
                // Ensure self-closing tags for elements like 'path' and 'line'
                if (['path', 'line', 'circle', 'rect', 'polygon'].includes(childTag)) {
                    return `<${childTag} ${childAttrsString} />`;
                }
                return `<${childTag} ${childAttrsString}></${childTag}>`;
            })
            .join('');

        return `<${tag} ${attrsString}>${childrenString}</${tag}>`;
    }
    
    createLoader(text = 'Loading...') {
        return `<div class="loading"><div class="spinner"></div> ${text}</div>`;
    }

    createSkeletonLoader(count = 1) {
        const skeletonCard = `
            <div class="movie-card skeleton-card">
                <div class="skeleton skeleton-poster"></div>
                <div class="skeleton-content">
                    <div class="skeleton skeleton-line skeleton-title"></div>
                    <div class="skeleton skeleton-line skeleton-text"></div>
                </div>
            </div>
        `;
        return Array(count).fill(skeletonCard).join('');
    }
    
    createError(message) {
        return `<div class="error"><p>${message}</p></div>`;
    }
    
    createEmptyState(title, description) {
        return `<div class="empty-state"><h3>${title}</h3><p>${description}</p></div>`;
    }

    createRatingCircle(rating, size = 40) {
        const voteAvg = (typeof rating === 'number' && isFinite(rating)) ? rating : 0;
        const percentage = Math.round(voteAvg * 10);

        // Dynamic calculations based on size
        const strokeWidth = Math.max(2, Math.round(size * 0.1)); // Ensure stroke is at least 2px
        const radius = (size / 2) - (strokeWidth / 2);
        const circumference = 2 * Math.PI * radius;
        const center = size / 2;

        let color, trackColor;
        if (percentage >= 70) {
            color = 'var(--tmdb-green)';
            trackColor = '#204529';
        } else if (percentage >= 40) {
            color = 'var(--tmdb-yellow)';
            trackColor = '#423d0f';
        } else if (percentage > 0) {
            color = 'var(--tmdb-red)';
            trackColor = '#571435';
        } else {
            color = 'transparent'; // No progress bar for 0 or NR
            trackColor = '#666';   // A neutral dark grey for the track
        }

        const progress = isFinite(percentage) && percentage > 0 ? percentage / 100 : 0;
        const offset = circumference * (1 - progress);

        // Adjust font size based on container size
        const fontSize = size * 0.3;
        const supFontSize = fontSize * 0.5;

        // Use inline styles for size-dependent properties
        return `
            <div class="rating-circle" style="width: ${size}px; height: ${size}px;">
                <svg class="rating-progress-svg" viewBox="0 0 ${size} ${size}">
                    <circle class="rating-progress-bg" cx="${center}" cy="${center}" r="${radius}" stroke="${trackColor}" stroke-width="${strokeWidth}" />
                    <circle class="rating-progress-bar" cx="${center}" cy="${center}" r="${radius}" 
                            stroke="${color}" 
                            stroke-width="${strokeWidth}"
                            stroke-dasharray="${circumference}" 
                            stroke-dashoffset="${offset}" />
                </svg>
                <div class="rating-circle-inner" style="font-size: ${fontSize}px;">
                    ${percentage > 0 ? `${percentage}<sup style="font-size: ${supFontSize}px; top: -0.3em;">%</sup>` : 'NR'}
                </div>
            </div>
        `;
    }

    createStarRating(rating, maxStars = 5) {
        let starsHTML = '<div class="star-rating">';
        for (let i = 1; i <= maxStars; i++) {
            const isFilled = i <= Math.round(rating);
            const starSVG = `
                <svg class="star-icon ${isFilled ? 'star--filled' : ''}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
            `;
            starsHTML += starSVG;
        }
        starsHTML += '</div>';
        return starsHTML;
    }

    createPagination(currentPage, totalPages) {
        let paginationHTML = `<div class="pagination-controls">`;
        paginationHTML += `<button class="pagination-btn" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''}>Prev</button>`;

        const pages = this.getPaginationPages(currentPage, totalPages);
        pages.forEach(page => {
            if (page === '...') {
                paginationHTML += `<button class="pagination-btn" disabled>...</button>`;
            } else {
                paginationHTML += `<button class="pagination-btn ${page === currentPage ? 'current' : ''}" data-page="${page}">${page}</button>`;
            }
        });
        
        paginationHTML += `<button class="pagination-btn" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''}>Next</button>`;
        paginationHTML += '</div>';
        return paginationHTML;
    }

    getPaginationPages(currentPage, totalPages) {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (currentPage <= 4) {
            return [1, 2, 3, 4, 5, '...', totalPages];
        }
        if (currentPage > totalPages - 4) {
            return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    }
    
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    formatCurrency(amount) {
        if (typeof amount !== 'number' || amount === 0) {
            return '-';
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    // --- SEO & METADATA METHODS ---
    updateHeadTags({ title, description, canonical }) {
        document.title = title;

        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', description);

        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalLink);
        }
        canonicalLink.setAttribute('href', canonical);
    }

    injectJsonLd(schema) {
        // Remove any existing LD+JSON scripts
        document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());

        if (schema) {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.textContent = JSON.stringify(schema);
            document.head.appendChild(script);
        }
    }
}
