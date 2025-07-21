import { MovieService } from './services/movieService.js'
import { UI } from './ui/ui.js'
import { Search, Star, Sparkles, X, Film, Play, MoreHorizontal, ChevronLeft, ChevronRight, Camera, List, Heart, MapPin, Phone, Mail, Facebook, Twitter, Instagram, Menu, ChevronDown } from 'lucide'
import { termsContent, privacyContent, disclaimerContent } from './legalContent.js'

export function createMovieApp(container) {
    const movieService = new MovieService()
    const ui = new UI()
    
    // --- ROUTING LOGIC ---
    function navigate(path, state = {}) {
        const search = state.search || '';
        if (window.location.pathname === path && window.location.search === search) return;
        history.pushState(state, null, path + search);
        handleRouteChange();
    }

    async function handleRouteChange() {
        const path = window.location.pathname;
        const contentContainer = document.getElementById('main-content');
        if (!contentContainer) return;
        
        let routeFound = false;
        await updatePageMetadata(path);

        const staticRoutes = {
            '/': { handler: loadHomepageContent, nav: 'home' },
            '/search': { handler: renderSearchResultsPage, nav: 'search' },
            '/about': { handler: showAboutSection, nav: 'about' },
            '/contact': { handler: showContactPage, nav: 'contact' },
            '/terms': { handler: showTermsPage, nav: 'legal' },
            '/privacy': { handler: showPrivacyPage, nav: 'legal' },
            '/disclaimer': { handler: showDisclaimerPage, nav: 'legal' },
        };
    
        if (staticRoutes[path]) {
            const route = staticRoutes[path];
            route.handler(contentContainer, history.state);
            updateActiveNavLink(route.nav);
            return;
        }

        const detailMatch = path.match(/^\/(movie|tv)\/(\d+)$/);
        const listMatch = path.match(/^\/(movie|tv)\/(popular|top_rated|upcoming|now_playing|airing_today|on_the_air)$/);
        const genreMatch = path.match(/^\/(movie|tv)\/genre\/(\d+)\/(.+)$/);

        if (detailMatch) {
            const [, mediaType, id] = detailMatch;
            loadMediaDetailPage(contentContainer, { mediaType, id });
            updateActiveNavLink(mediaType);
            routeFound = true;
        } else if (listMatch) {
            const [, mediaType, category] = listMatch;
            const urlParams = new URLSearchParams(window.location.search);
            const page = parseInt(urlParams.get('page') || '1', 10);
            loadListPage(mediaType, category, page);
            updateActiveNavLink(mediaType);
            routeFound = true;
        } else if (genreMatch) {
            const urlParams = new URLSearchParams(window.location.search);
            const page = parseInt(urlParams.get('page') || '1', 10);
            const [, mediaType, id, name] = genreMatch;
            loadGenrePage(mediaType, parseInt(id, 10), decodeURIComponent(name), page);
            updateActiveNavLink(mediaType);
            routeFound = true;
        }
        
        if (!routeFound) {
            showNotFoundPage(contentContainer);
            updateActiveNavLink(null);
        }
    }
    
    function init() {
        renderApp()
        bindEvents()
        handleRouteChange(); // Initial route handling
    }
    
    function renderApp() {
        container.innerHTML = `
            <header class="header">
                <div class="container">
                    <div class="header-content">
                        <a href="/" class="logo">Filmiry</a>
                        <div class="header-right">
                            <nav class="main-nav" id="main-nav">
                                <ul class="nav-links">
                                    <li><a href="/" class="nav-link" data-tab="home">Home</a></li>
                                    <li class="nav-item-dropdown">
                                        <a href="#" class="nav-link" data-tab="movies">Movies</a>
                                        <ul class="dropdown-menu">
                                            <li><a href="/movie/popular">Popular</a></li>
                                            <li><a href="/movie/now_playing">Now Playing</a></li>
                                            <li><a href="/movie/upcoming">Upcoming</a></li>
                                            <li><a href="/movie/top_rated">Top Rated</a></li>
                                        </ul>
                                    </li>
                                    <li class="nav-item-dropdown">
                                        <a href="#" class="nav-link" data-tab="tv">TV Shows</a>
                                        <ul class="dropdown-menu">
                                            <li><a href="/tv/popular">Popular</a></li>
                                            <li><a href="/tv/airing_today">Airing Today</a></li>
                                            <li><a href="/tv/on_the_air">On TV</a></li>
                                            <li><a href="/tv/top_rated">Top Rated</a></li>
                                        </ul>
                                    </li>
                                    <li><a href="/about" class="nav-link" data-tab="about">About</a></li>
                                    <li>
                                        <button id="open-search-btn" class="header-action-btn" aria-label="Open Search">
                                            ${ui.renderIcon(Search, 24)}
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                            <button id="mobile-menu-toggle" class="mobile-menu-toggle" aria-label="Open menu">
                                ${ui.renderIcon(Menu, 28)}
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            
            <main id="main-content"></main>

            <footer class="footer">
                <div class="container">
                    <div class="footer-content">
                        <div class="footer-column">
                            <h4 class="footer-title">The Basics</h4>
                            <ul class="footer-links">
                                <li><a href="/about" class="footer-link">About Filmiry</a></li>
                                <li><a href="/contact" class="footer-link">Contact Us</a></li>
                            </ul>
                        </div>
                        <div class="footer-column">
                            <h4 class="footer-title">Legal</h4>
                            <ul class="footer-links">
                                <li><a href="/terms" class="footer-link">Terms of Service</a></li>
                                <li><a href="/privacy" class="footer-link">Privacy Policy</a></li>
                                <li><a href="/disclaimer" class="footer-link">Disclaimer</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="footer-copyright">
                        &copy; ${new Date().getFullYear()} Filmiry. This product uses the TMDB API but is not endorsed or certified by TMDB.
                    </div>
                </div>
            </footer>
            
            <div class="search-overlay" id="search-overlay">
                <button class="search-overlay-close" id="search-overlay-close-btn" aria-label="Close Search">${ui.renderIcon(X, 32)}</button>
                <div class="search-overlay-content">
                    <form id="search-overlay-form">
                        <input type="search" id="search-overlay-input" placeholder="Search for a movie or TV show..." autocomplete="off">
                    </form>
                </div>
            </div>
        `
    }
    
    async function loadHeroContent(container) {
        try {
            const result = await movieService.getPopularMovies()
            const movie = result.results[Math.floor(Math.random() * 10)]
            
            container.style.backgroundImage = `url(${movieService.getBackdropUrl(movie.backdrop_path, 'original')})`
        } catch (error) {
            console.error('Failed to load hero background:', error)
            container.style.backgroundColor = 'var(--dark-bg)';
        }

        container.innerHTML = `
            <div class="hero-content">
                <div class="container">
                    <h1 class="hero-title">Welcome.</h1>
                    <h2 class="hero-subtitle">Millions of movies & TV shows to discover. Explore now.</h2>
                    <form class="hero-search-form" id="hero-search-form">
                        <input type="text" class="hero-search-input" id="hero-search-input" placeholder="Search for a movie or TV show...">
                        <button type="submit" class="hero-search-btn">Search</button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('hero-search-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const query = document.getElementById('hero-search-input').value.trim();
            if (query) {
                navigate('/search', { search: `?query=${encodeURIComponent(query)}` });
            }
        });
    }
    
    function bindEvents() {
        document.body.addEventListener('click', e => {
            const link = e.target.closest('a');
            if (link && link.origin === window.location.origin && link.target !== '_blank' && link.getAttribute('href') !== '#') {
                e.preventDefault();
                navigate(link.pathname + link.search);
                // Close mobile menu on navigation
                document.getElementById('main-nav').classList.remove('nav--open');
                document.body.classList.remove('no-scroll');
            }

            const card = e.target.closest('.movie-card');
            if (card && card.dataset.id && card.dataset.mediaType) {
                e.preventDefault();
                navigate(`/${card.dataset.mediaType}/${card.dataset.id}`);
            }

            // Handle keyword clicks
            const keywordTag = e.target.closest('.keyword-tag');
            if (keywordTag) {
                e.preventDefault();
                const query = keywordTag.textContent.trim();
                navigate('/search', { search: `?query=${encodeURIComponent(query)}` });
            }
        });
        
        // Event delegation for dynamically loaded content inside main-content
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.addEventListener('click', e => {
                const playBtn = e.target.closest('#play-trailer-btn');
                if (playBtn) {
                    e.preventDefault();
                    const trailerKey = playBtn.dataset.videoKey;
                    if (trailerKey) {
                        // Open in a new tab instead of a modal to avoid embedding issues
                        window.open(`https://www.youtube.com/watch?v=${trailerKey}`, '_blank', 'noopener,noreferrer');
                    }
                }

                const carouselBtn = e.target.closest('.row-carousel-btn');
                if (carouselBtn) {
                    e.preventDefault();
                    const targetTrackId = carouselBtn.dataset.target;
                    const wrapper = document.getElementById(targetTrackId)?.parentElement;
                    if (wrapper) {
                        const scrollAmount = wrapper.clientWidth * 0.8;
                        const direction = carouselBtn.classList.contains('prev') ? -1 : 1;
                        wrapper.scrollBy({
                            left: scrollAmount * direction,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        }

        window.addEventListener('popstate', handleRouteChange);

        // --- Search Overlay Logic ---
        const openSearchBtn = document.getElementById('open-search-btn');
        const closeSearchBtn = document.getElementById('search-overlay-close-btn');
        const searchOverlay = document.getElementById('search-overlay');
        const searchForm = document.getElementById('search-overlay-form');
        const searchInput = document.getElementById('search-overlay-input');

        const openSearch = () => {
            searchOverlay.classList.add('active');
            searchInput.focus();
        };
        openSearchBtn.addEventListener('click', openSearch);

        const closeSearch = () => {
            searchOverlay.classList.remove('active');
            searchInput.value = '';
        };

        closeSearchBtn.addEventListener('click', closeSearch);
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) closeSearch();
        });

        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                navigate('/search', { search: `?query=${encodeURIComponent(query)}` });
                closeSearch();
            }
        });

        // --- Header Scroll Logic ---
        const header = document.querySelector('.header');
        if (header) {
            let lastScrollTop = 0;
            window.addEventListener('scroll', () => {
                const st = window.scrollY;
                if (st > lastScrollTop && st > header.offsetHeight) {
                    header.classList.add('header--hidden');
                } else {
                    header.classList.remove('header--hidden');
                }
                lastScrollTop = st <= 0 ? 0 : st;
            }, { passive: true });
        }

        // --- Mobile Menu Logic ---
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mainNav = document.getElementById('main-nav');
        
        mobileMenuToggle.addEventListener('click', () => {
            const isOpen = mainNav.classList.toggle('nav--open');
            document.body.classList.toggle('no-scroll', isOpen);
        });

        // Clickable dropdowns for mobile
        mainNav.addEventListener('click', e => {
            if (window.innerWidth > 768) return;

            const dropdownToggle = e.target.closest('.nav-item-dropdown > a');
            if (dropdownToggle) {
                e.preventDefault();
                const parent = dropdownToggle.parentElement;
                
                // Close other open dropdowns
                parent.parentElement.querySelectorAll('.nav-item-dropdown.open').forEach(item => {
                    if (item !== parent) {
                        item.classList.remove('open');
                    }
                });

                parent.classList.toggle('open');
            }
        });
    }
    
    function updateActiveNavLink(currentTab) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.tab === currentTab);
        });
    }

    async function updatePageMetadata(path) {
        const origin = window.location.origin;
        let canonicalUrl = origin + path;
        let title = 'Filmiry - Movie & TV Show Discovery';
        let description = 'Explore millions of movies and TV shows. Get ratings, reviews, and recommendations on Filmiry.';
        let schema = {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            'url': origin,
            'name': 'Filmiry',
            'potentialAction': {
                '@type': 'SearchAction',
                'target': `${origin}/search?query={search_term_string}`,
                'query-input': 'required name=search_term_string',
            },
        };

        const detailMatch = path.match(/^\/(movie|tv)\/(\d+)$/);
        if (detailMatch) {
            const [, mediaType, id] = detailMatch;
            try {
                const [details, credits] = await Promise.all([
                    mediaType === 'movie' ? movieService.getMovieDetails(id) : movieService.getTvShowDetails(id),
                    mediaType === 'movie' ? movieService.getMovieCredits(id) : movieService.getTvShowCredits(id)
                ]);

                const mediaTitle = details.title || details.name;
                const releaseDate = details.release_date || details.first_air_date;
                const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
                
                title = `${mediaTitle} (${year}) - Filmiry`;
                description = details.overview ? details.overview.substring(0, 160) + '...' : `Details about ${mediaTitle}.`;
                
                const director = credits.crew.find(c => c.job === 'Director');
                const actors = credits.cast.slice(0, 5).map(a => ({ '@type': 'Person', 'name': a.name }));

                schema = {
                    '@context': 'https://schema.org',
                    '@type': mediaType === 'movie' ? 'Movie' : 'TVSeries',
                    'name': mediaTitle,
                    'description': details.overview,
                    'image': movieService.getImageUrl(details.poster_path),
                    'datePublished': releaseDate,
                    'aggregateRating': {
                        '@type': 'AggregateRating',
                        'ratingValue': details.vote_average.toFixed(1),
                        'bestRating': '10',
                        'ratingCount': details.vote_count,
                    },
                    ...(director && { 'director': { '@type': 'Person', 'name': director.name } }),
                    ...(actors.length > 0 && { 'actor': actors }),
                };
            } catch (e) { /* Use default metadata on error */ }
        }

        ui.updateHeadTags({ title, description, canonical: canonicalUrl });
        ui.injectJsonLd(schema);
    }

    function loadHomepageContent(container) {
        container.innerHTML = `
            <section class="hero" id="hero-section"></section>
            <div class="movies-section">
                <div class="container">
                    <div id="media-rows-container"></div>
                </div>
            </div>
        `;
        loadHeroContent(document.getElementById('hero-section'));

        const rowsContainer = document.getElementById('media-rows-container')
        const rows = [
            { title: 'Trending Movies', fetcher: movieService.getTrendingMovies.bind(movieService), type: 'movie', category: 'popular' },
            { title: 'Trending TV Shows', fetcher: movieService.getTrendingTvShows.bind(movieService), type: 'tv', category: 'popular' },
            { title: 'Popular Movies', fetcher: movieService.getPopularMovies.bind(movieService), type: 'movie', category: 'popular' },
            { title: 'Popular TV Shows', fetcher: movieService.getPopularTvShows.bind(movieService), type: 'tv', category: 'popular' },
        ];
        rows.forEach(row => renderMediaRow(rowsContainer, row))

        // Add an ad slot on the homepage
        const adSlot = document.createElement('div');
        adSlot.className = 'ad-slot-container container';
        adSlot.innerHTML = `<div class="ad-slot ad-slot--banner"><p>Ad Slot - 728x90</p></div>`;
        rowsContainer.appendChild(adSlot);
    }

    async function renderMediaRow(container, { title, fetcher, type, category }) {
        const rowId = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const seeAllLink = `/${type}/${category}`;
        const rowElement = document.createElement('div');
        rowElement.className = 'movie-row';
        rowElement.innerHTML = `
            <div class="row-header">
                <h3 class="row-title">${title}</h3>
                <a href="${seeAllLink}" class="see-all-link">See all</a>
            </div>
            <div class="row-carousel-container">
                <button class="row-carousel-btn prev" data-target="track-${rowId}" aria-label="Previous">${ui.renderIcon(ChevronLeft)}</button>
                <div class="row-carousel-wrapper">
                    <div class="row-carousel-track" id="track-${rowId}">${ui.createSkeletonLoader(10)}</div>
                </div>
                <button class="row-carousel-btn next" data-target="track-${rowId}" aria-label="Next">${ui.renderIcon(ChevronRight)}</button>
            </div>
        `;
        container.appendChild(rowElement);

        try {
            const result = await fetcher();
            const mediaItems = result.results.slice(0, 20);
            const track = document.getElementById(`track-${rowId}`);
            
            if (mediaItems.length > 0) {
                track.innerHTML = mediaItems.map(item => renderMediaCard(item, type)).join('');
            } else {
                track.innerHTML = `<p class="empty-state">No items to display.</p>`;
            }
        } catch (error) {
            console.error(`Failed to load row "${title}":`, error);
            document.getElementById(`track-${rowId}`).innerHTML = ui.createError('Could not load this category.');
        }
    }

    function renderSearchResultsPage(container) {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('query');
        
        container.innerHTML = `
            <div class="container page-container">
                <div id="search-results-container"></div>
            </div>
        `;
        handleSearch(query);
    }

    async function handleSearch(query) {
        const resultsContainer = document.getElementById('search-results-container')
        if (!query) {
            resultsContainer.innerHTML = ui.createEmptyState('Search for movies and TV shows', 'Find your next favorite from our vast library.');
            return;
        }

        resultsContainer.innerHTML = `
            <h2 class="section-title">Searching for "${query}"...</h2>
            <div class="movies-grid">${ui.createSkeletonLoader(20)}</div>
        `;
        
        try {
            const [movieResults, tvResults] = await Promise.all([
                movieService.searchMovies(query),
                movieService.searchTvShows(query)
            ]);

            let html = `<h2 class="section-title">Search Results for "${query}"</h2>`;

            if (movieResults.results.length > 0) {
                html += `
                    <div class="search-results-section">
                        <h3 class="row-title">Movies (${movieResults.total_results.toLocaleString()})</h3>
                        <div class="movies-grid">${movieResults.results.map(item => renderMediaCard(item, 'movie')).join('')}</div>
                    </div>
                `;
            }

            if (tvResults.results.length > 0) {
                html += `
                    <div class="search-results-section">
                        <h3 class="row-title">TV Shows (${tvResults.total_results.toLocaleString()})</h3>
                        <div class="movies-grid">${tvResults.results.map(item => renderMediaCard(item, 'tv')).join('')}</div>
                    </div>
                `;
            }

            if (movieResults.results.length === 0 && tvResults.results.length === 0) {
                html += ui.createEmptyState('No results found.', `We couldn't find any movies or TV shows matching "${query}".`);
            }

            resultsContainer.innerHTML = html;

        } catch (error) {
            resultsContainer.innerHTML = ui.createError('Search failed. Please try again.')
        }
    }

    async function loadListPage(mediaType, category, page = 1) {
        const contentContainer = document.getElementById('main-content');
        
        const categoryMap = {
            'popular': { title: 'Popular', movie: movieService.getPopularMovies, tv: movieService.getPopularTvShows },
            'top_rated': { title: 'Top Rated', movie: movieService.getTopRatedMovies, tv: movieService.getTopRatedTvShows },
            'upcoming': { title: 'Upcoming', movie: movieService.getUpcomingMovies },
            'now_playing': { title: 'Now Playing', movie: movieService.getNowPlayingMovies },
            'airing_today': { title: 'Airing Today', tv: movieService.getAiringTodayTvShows },
            'on_the_air': { title: 'On TV', tv: movieService.getOnTheAirTvShows }
        };
    
        const categoryInfo = categoryMap[category];
        if (!categoryInfo || !categoryInfo[mediaType]) {
            showNotFoundPage(contentContainer);
            return;
        }
    
        const title = `${categoryInfo.title} ${mediaType === 'movie' ? 'Movies' : 'TV Shows'}`;
        contentContainer.innerHTML = `
            <div class="container page-container">
                <div id="list-page-container">
                    <h2 class="section-title">${title}</h2>
                    <div class="movies-grid">${ui.createSkeletonLoader(20)}</div>
                </div>
            </div>
        `;
    
        try {
            const fetcher = categoryInfo[mediaType].bind(movieService);
            const result = await fetcher(page);
    
            renderGridPageContent(
                document.getElementById('list-page-container'),
                title,
                result,
                mediaType,
                (newPage) => navigate(`/${mediaType}/${category}?page=${newPage}`)
            );
        } catch (error) {
            console.error(`Failed to load ${category} page:`, error);
            const listContainer = document.getElementById('list-page-container');
            if (listContainer) {
                listContainer.innerHTML = ui.createError(`Could not load this page.`);
            }
        }
    }

    async function loadGenrePage(mediaType, genreId, genreName, page = 1) {
        const contentContainer = document.getElementById('main-content');
        const title = `${genreName} ${mediaType === 'movie' ? 'Movies' : 'TV Shows'}`;
        contentContainer.innerHTML = `
            <div class="container page-container">
                <div id="genre-results-container">
                    <h2 class="section-title">${title}</h2>
                    <div class="movies-grid">${ui.createSkeletonLoader(20)}</div>
                </div>
            </div>
        `;

        try {
            const fetcher = mediaType === 'movie' ? movieService.getMoviesByGenre.bind(movieService) : movieService.getTvShowsByGenre.bind(movieService);
            const result = await fetcher(genreId, page);
            
            renderGridPageContent(
                document.getElementById('genre-results-container'),
                title,
                result,
                mediaType,
                (newPage) => navigate(`/${mediaType}/genre/${genreId}/${encodeURIComponent(genreName)}?page=${newPage}`)
            );
        } catch (error) {
            console.error('Failed to load genre page:', error);
            const genreContainer = document.getElementById('genre-results-container');
            if(genreContainer) {
                genreContainer.innerHTML = ui.createError('Could not load this genre page.');
            }
        }
    }

    function renderGridPageContent(container, title, result, mediaType, paginationHandler) {
        const { results, page, total_pages, total_results } = result;

        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = `<h2 class="section-title">${title}</h2><div class="empty-state"><h3>No items found.</h3></div>`;
            return;
        }

        let gridItemsHTML = results.map((item, index) => {
            let html = renderMediaCard(item, mediaType);
            // Inject an ad slot after the 8th item on the first page
            if (page === 1 && index === 7) {
                html += `<div class="ad-slot ad-slot--grid-item"><p>Ad Slot - 180x270</p></div>`;
            }
            return html;
        }).join('');

        container.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">${title}</h2>
                <div class="page-info">${total_results.toLocaleString()} items</div>
            </div>
            <div class="movies-grid">${gridItemsHTML}</div>
            <div class="pagination" id="grid-pagination"></div>
        `;
        renderPagination('grid-pagination', page, total_pages, paginationHandler);
    }

    function renderPagination(containerId, currentPage, totalPages, handler) {
        const paginationContainer = document.getElementById(containerId);
        if (!paginationContainer || totalPages <= 1) {
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }
        paginationContainer.innerHTML = ui.createPagination(currentPage, totalPages);

        paginationContainer.addEventListener('click', e => {
            const btn = e.target.closest('.pagination-btn');
            if (btn && !btn.disabled) {
                const page = parseInt(btn.dataset.page, 10);
                if (!isNaN(page)) handler(page);
            }
        });
    }
    
    function showAboutSection(container) {
        container.innerHTML = `
            <div class="container page-container">
                <div class="legal-page-content">
                    <h2>About Filmiry</h2>
                    <p>Filmiry is a passion project born from a love for cinema and technology. We believe that discovering great entertainment should be an experience in itself. Our platform is designed to be your personal film and TV curator, offering deep insights and a fresh perspective on the world of media.</p>
                </div>
            </div>
        `;
    }

    function showContactPage(container) {
        container.innerHTML = `
            <div class="container contact-page-wrapper">
                <div class="contact-section">
                    <form id="contact-form" class="professional-contact-form">
                        <div class="form-group">
                            <input type="text" id="contact-name" class="form-input" placeholder="Full Name" required>
                        </div>
                        <div class="form-group">
                            <input type="email" id="contact-email" class="form-input" placeholder="Email Address" required>
                        </div>
                        <div class="form-group">
                            <textarea id="contact-message" class="form-textarea" rows="5" placeholder="Your Message..." required></textarea>
                        </div>
                        <button type="submit" class="form-submit-btn">Send Message</button>
                    </form>
                </div>
            </div>
        `;
    
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const button = contactForm.querySelector('.form-submit-btn');
                if (button) {
                    button.textContent = '✓ Message Sent!';
                    button.disabled = true;
                    button.classList.add('sent');
                }
            });
        }
    }

    function showTermsPage(container) {
        container.innerHTML = `
            <div class="container page-container">
                <div class="legal-page-content">
                    <h2>Terms of Service</h2>
                    ${termsContent}
                </div>
            </div>
        `;
    }

    function showPrivacyPage(container) {
        container.innerHTML = `
            <div class="container page-container">
                <div class="legal-page-content">
                    <h2>Privacy Policy</h2>
                    ${privacyContent}
                </div>
            </div>
        `;
    }

    function showDisclaimerPage(container) {
        container.innerHTML = `
            <div class="container page-container">
                <div class="legal-page-content">
                    <h2>Disclaimer</h2>
                    ${disclaimerContent}
                </div>
            </div>
        `;
    }
    
    function showNotFoundPage(container) {
        container.innerHTML = `
            <div class="not-found-section">
                <h2 class="not-found-title">Page Not Found</h2>
                <p>We couldn't find the page you're looking for.</p>
                <a href="/" class="btn-large">Back to Home</a>
            </div>
        `;
    }

    function renderMediaCard(media, mediaType) {
        const title = media.title || media.name;
        const releaseDate = media.release_date || media.first_air_date;
        return `
            <div class="movie-card" data-id="${media.id}" data-media-type="${mediaType}" aria-label="View details for ${title}">
                <div class="movie-poster">
                    <img src="${movieService.getImageUrl(media.poster_path)}" alt="${title}" loading="lazy" onerror="this.src='https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/180x270/eee/ccc?text=No+Image'">
                </div>
                <div class="movie-card-content">
                    ${ui.createRatingCircle(media.vote_average, 40)}
                    <h3 class="movie-title">${title}</h3>
                    <p class="movie-date">${ui.formatDate(releaseDate)}</p>
                </div>
            </div>
        `
    }

    async function loadMediaDetailPage(container, { mediaType, id }) {
        container.innerHTML = ui.createLoader('Loading details...');
        try {
            const detailsFetcher = mediaType === 'movie' ? movieService.getMovieDetails.bind(movieService) : movieService.getTvShowDetails.bind(movieService);
            const creditsFetcher = mediaType === 'movie' ? movieService.getMovieCredits.bind(movieService) : movieService.getTvShowCredits.bind(movieService);
            const keywordsFetcher = mediaType === 'movie' ? movieService.getMovieKeywords.bind(movieService) : movieService.getTvShowKeywords.bind(movieService);
            const recsFetcher = mediaType === 'movie' ? movieService.getMovieRecommendations.bind(movieService) : movieService.getTvShowRecommendations.bind(movieService);
            const videosFetcher = mediaType === 'movie' ? movieService.getMovieVideos.bind(movieService) : movieService.getTvShowVideos.bind(movieService);
            const reviewsFetcher = movieService.getMockReviews.bind(movieService);
    
            const [details, credits, keywords, recommendations, videos, reviews] = await Promise.all([
                detailsFetcher(id),
                creditsFetcher(id),
                keywordsFetcher(id),
                recsFetcher(id),
                videosFetcher(id),
                reviewsFetcher(id),
            ]);
    
            container.innerHTML = `
                <div class="detail-hero-wrapper">
                    ${renderDetailHero(details, credits, videos, mediaType)}
                </div>
                <div class="container detail-main-content">
                    <div class="detail-main-column">
                        ${renderCastSection(credits)}
                        ${renderUserReviewsSection(reviews)}
                        ${renderRecommendationsSection(recommendations, mediaType)}
                    </div>
                    <div class="detail-sidebar-column">
                        ${renderSidebar(details, keywords, mediaType)}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Failed to load media detail page:', error);
            container.innerHTML = ui.createError('Could not load details for this item.');
        }
    }

    function renderDetailHero(details, credits, videos, mediaType) {
        const title = details.title || details.name;
        const releaseDate = details.release_date || details.first_air_date;
        const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
        const runtime = details.runtime || (details.episode_run_time ? details.episode_run_time[0] : null);
        const runtimeStr = runtime ? `${Math.floor(runtime / 60)}h ${runtime % 60}m` : '';
        const genres = details.genres.map(g => g.name).join(', ');
        const trailer = videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');

        const crew = credits.crew || [];
        const directors = crew.filter(c => c.job === 'Director').map(c => c.name);
        const writers = crew.filter(c => c.department === 'Writing').map(c => c.name).slice(0, 2); // Limit writers
        const creators = details.created_by || [];

        return `
            <div class="detail-hero" style="background-image: url(${movieService.getBackdropUrl(details.backdrop_path)})">
                <div class="detail-hero-overlay">
                    <div class="container">
                        <div class="detail-hero-content">
                            <div class="detail-hero-poster">
                                <img src="${movieService.getImageUrl(details.poster_path, 'w300')}" alt="${title}">
                            </div>
                            <div class="detail-hero-info">
                                <h2 class="title">${title} <span>(${year})</span></h2>
                                <div class="detail-hero-meta">
                                    <span>${ui.formatDate(releaseDate)}</span>
                                    ${genres ? `<span>&bull;</span><span>${genres}</span>` : ''}
                                    ${runtimeStr ? `<span>&bull;</span><span>${runtimeStr}</span>` : ''}
                                </div>
                                <div class="detail-actions">
                                    <div class="action-item">
                                        ${ui.createRatingCircle(details.vote_average, 60)}
                                        <span class="action-label">User Score</span>
                                    </div>
                                    ${trailer ? `
                                    <div class="action-item">
                                        <button class="action-btn" id="play-trailer-btn" data-video-key="${trailer.key}">${ui.renderIcon(Play)}</button>
                                        <span class="action-label">Play Trailer</span>
                                    </div>
                                    ` : ''}
                                </div>
                                <p class="detail-tagline">${details.tagline || ''}</p>
                                <div class="detail-overview">
                                    <h3>Overview</h3>
                                    <p>${details.overview}</p>
                                </div>
                                <div class="detail-crew">
                                    ${creators.length > 0 ? creators.map(c => `<div class="crew-member"><strong>${c.name}</strong><span>Creator</span></div>`).join('') : ''}
                                    ${directors.length > 0 ? directors.map(d => `<div class="crew-member"><strong>${d}</strong><span>Director</span></div>`).join('') : ''}
                                    ${writers.length > 0 ? writers.map(w => `<div class="crew-member"><strong>${w}</strong><span>Writer</span></div>`).join('') : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderCastSection(credits) {
        const topCast = credits.cast.slice(0, 10);
        if (topCast.length === 0) return '';
        return `
            <section class="detail-section">
                <h3 class="detail-section-title">Top Billed Cast</h3>
                <div class="cast-grid">
                    ${topCast.map(person => `
                        <div class="cast-card">
                            <img src="${movieService.getImageUrl(person.profile_path, 'w185')}" alt="${person.name}" loading="lazy" onerror="this.src='https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/140x175/eee/ccc?text=No+Image'">
                            <div class="cast-card-info">
                                <p class="name">${person.name}</p>
                                <p class="character">${person.character}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function renderUserReviewsSection(reviews) {
        if (!reviews || reviews.length === 0) return '';
        return `
            <section class="detail-section">
                <h3 class="detail-section-title">User Reviews</h3>
                <div class="reviews-list">
                    ${reviews.map(review => `
                        <div class="review-card">
                            <div class="review-header">
                                <img src="${review.avatar_path}" alt="${review.author}" class="review-avatar">
                                <div class="review-user-info">
                                    <span class="review-author">${review.author}</span>
                                    <div class="review-meta">
                                        ${ui.createStarRating(review.rating)}
                                        <span class="review-date">${ui.formatDate(review.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="review-content">
                                <p>${review.content.replace(/\n/g, '</p><p>')}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function renderRecommendationsSection(recommendations, mediaType) {
        const recs = recommendations.results.slice(0, 10);
        if (recs.length === 0) return '';
        return `
            <section class="detail-section">
                <h3 class="detail-section-title">Recommendations</h3>
                <div class="row-carousel-wrapper">
                    <div class="row-carousel-track">
                        ${recs.map(item => renderMediaCard(item, mediaType)).join('')}
                    </div>
                </div>
            </section>
        `;
    }

    function renderSidebar(details, keywordsData, mediaType) {
        const keywords = mediaType === 'movie' ? keywordsData.keywords : keywordsData.results;
        return `
            <div class="ad-slot ad-slot--sidebar"><p>Ad Slot - 300x600</p></div>
            <div class="sidebar-info-block">
                <strong>Status</strong>
                <span>${details.status}</span>
            </div>
            <div class="sidebar-info-block">
                <strong>Original Language</strong>
                <span>${new Intl.DisplayNames(['en'], { type: 'language' }).of(details.original_language)}</span>
            </div>
            ${mediaType === 'movie' ? `
            <div class="sidebar-info-block">
                <strong>Budget</strong>
                <span>${ui.formatCurrency(details.budget)}</span>
            </div>
            <div class="sidebar-info-block">
                <strong>Revenue</strong>
                <span>${ui.formatCurrency(details.revenue)}</span>
            </div>
            ` : `
            <div class="sidebar-info-block">
                <strong>Network</strong>
                <span>${details.networks.map(n => n.name).join(', ')}</span>
            </div>
            <div class="sidebar-info-block">
                <strong>Type</strong>
                <span>${details.type}</span>
            </div>
            `}
            <div class="sidebar-info-block">
                <strong>Keywords</strong>
                <div class="keyword-list">
                    ${keywords.map(kw => `<a href="#" class="keyword-tag">${kw.name}</a>`).join('')}
                </div>
            </div>
        `;
    }
    
    init()
    
    return { cleanup: () => {} }
}
