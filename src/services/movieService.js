import { faker } from '@faker-js/faker';

export class MovieService {
    constructor() {
        this.baseURL = 'https://api.themoviedb.org/3'
        this.imageBaseURL = 'https://image.tmdb.org/t/p'
        this.apiKey = import.meta.env.VITE_TMDB_API_KEY
        
        if (!this.apiKey) {
            console.warn('TMDB API key not found. Please add VITE_TMDB_API_KEY to your .env file')
        }
    }
    
    async makeRequest(endpoint, params = {}) {
        if (!this.apiKey) {
            throw new Error('TMDB API key is not configured');
        }
    
        const url = new URL(`${this.baseURL}${endpoint}`);
        url.searchParams.append('api_key', this.apiKey);
    
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value);
            }
        });
    
        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                cache: 'no-cache',
                headers: { 'Accept': 'application/json' },
            });
    
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const errorMessage = errorData?.status_message || `API Error: ${response.status} ${response.statusText}`;
                throw new Error(errorMessage);
            }
    
            return response.json();
        } catch (error) {
            console.error(`Request failed for endpoint: ${endpoint}`, error);
            throw new Error(`Failed to fetch data. Please check your network connection and disable any ad-blockers.`);
        }
    }
    
    // --- Movie Methods ---
    async getPopularMovies(page = 1) { return this.makeRequest('/movie/popular', { page }) }
    async searchMovies(query, page = 1) { return this.makeRequest('/search/movie', { query, page }) }
    async getMovieDetails(movieId) { return this.makeRequest(`/movie/${movieId}`) }
    async getTrendingMovies(page = 1, timeWindow = 'week') { return this.makeRequest(`/trending/movie/${timeWindow}`, { page }) }
    async getTopRatedMovies(page = 1) { return this.makeRequest('/movie/top_rated', { page }) }
    async getUpcomingMovies(page = 1) { return this.makeRequest('/movie/upcoming', { page }) }
    async getNowPlayingMovies(page = 1) { return this.makeRequest('/movie/now_playing', { page }) }
    async getMoviesByGenre(genreId, page = 1) { return this.makeRequest('/discover/movie', { with_genres: genreId, page, sort_by: 'popularity.desc' }) }
    async getMovieVideos(movieId) { return this.makeRequest(`/movie/${movieId}/videos`) }
    async getMovieCredits(movieId) { return this.makeRequest(`/movie/${movieId}/credits`) }
    async getMovieKeywords(movieId) { return this.makeRequest(`/movie/${movieId}/keywords`) }
    async getMovieRecommendations(movieId) { return this.makeRequest(`/movie/${movieId}/recommendations`) }
    
    // --- TV Show Methods ---
    async getPopularTvShows(page = 1) { return this.makeRequest('/tv/popular', { page }) }
    async searchTvShows(query, page = 1) { return this.makeRequest('/search/tv', { query, page }) }
    async getTvShowDetails(tvId) { return this.makeRequest(`/tv/${tvId}`) }
    async getTrendingTvShows(page = 1, timeWindow = 'week') { return this.makeRequest(`/trending/tv/${timeWindow}`, { page }) }
    async getTopRatedTvShows(page = 1) { return this.makeRequest('/tv/top_rated', { page }) }
    async getAiringTodayTvShows(page = 1) { return this.makeRequest('/tv/airing_today', { page }) }
    async getOnTheAirTvShows(page = 1) { return this.makeRequest('/tv/on_the_air', { page }) }
    async getTvShowsByGenre(genreId, page = 1) { return this.makeRequest('/discover/tv', { with_genres: genreId, page, sort_by: 'popularity.desc' }) }
    async getTvShowVideos(tvId) { return this.makeRequest(`/tv/${tvId}/videos`) }
    async getTvShowCredits(tvId) { return this.makeRequest(`/tv/${tvId}/credits`) }
    async getTvShowKeywords(tvId) { return this.makeRequest(`/tv/${tvId}/keywords`) }
    async getTvShowRecommendations(tvId) { return this.makeRequest(`/tv/${tvId}/recommendations`) }

    // --- MOCK DATA METHOD ---
    async getMockReviews(mediaId) {
        // Use mediaId to seed faker for consistent "random" data per item
        faker.seed(parseInt(mediaId, 10));
    
        const reviewCount = faker.number.int({ min: 3, max: 8 });
        const reviews = [];
    
        for (let i = 0; i < reviewCount; i++) {
            reviews.push({
                author: faker.person.fullName(),
                avatar_path: faker.image.avatar(),
                rating: faker.number.int({ min: 1, max: 5 }),
                created_at: faker.date.past({ years: 2 }),
                content: faker.lorem.paragraphs({ min: 1, max: 3 }),
            });
        }
        // Simulate a small network delay
        await new Promise(resolve => setTimeout(resolve, 100));
        return reviews;
    }

    // --- Utility Methods ---
    getImageUrl(path, size = 'w500') {
        if (!path) return 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/300x450/1a1f2e/667eea?text=No+Image'
        return `${this.imageBaseURL}/${size}${path}`
    }
    
    getBackdropUrl(path, size = 'w1280') {
        if (!path) return 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/1280x720/1a1f2e/667eea?text=No+Image'
        return `${this.imageBaseURL}/${size}${path}`
    }
}
