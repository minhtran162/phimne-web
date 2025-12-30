import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Strict-order slideshow controller with:
 * - Manual prev/next that always follows movieList order
 * - Autoplay timer that never goes stale
 * - Preloading next slide images (backdrop + logo)
 * - Background prefetching of all slides after first load
 * - Lazy-loading by default (only fetch what you need)
 */
export function useSlideshowController({
    shuffleInterval = 15000,
    moviesSeriesBoth = 3, // 1=Movie 2=Series 3=Both (for fallback random)
    useSponsorBlock = true,
    useTrailers = true,
    trailerMaxLength = 0,
    plotMaxLength = 550
}) {
    // ---------------------------
    // State
    // ---------------------------
    const [state, setState] = useState({
        slideshow: { hasInitialized: false, containerFocused: false },
        jellyfinData: {
            userId: null, appName: null, appVersion: null,
            deviceName: null, deviceId: null,
            accessToken: null, serverAddress: null, serverId: null
        },
        movieList: [],
        currentMovieIndex: 0,
        previousMovies: [],
        forwardMovies: [],
        currentMovie: null,
        isMuted: true,
        player: null
    });

    const [imageCache, setImageCache] = useState({}); // { [id]: { backdrop, logo, hasBackdrop, hasLogo } }
    const [movieCache, setMovieCache] = useState({}); // { [id]: movieData }
    const [favorites, setFavorites] = useState(new Set());
    const [isVisible, setIsVisible] = useState(false);

    // ---------------------------
    // Refs to avoid stale closures
    // ---------------------------
    const jellyfinRef = useRef(state.jellyfinData);
    const listRef = useRef(state.movieList);
    const indexRef = useRef(state.currentMovieIndex);
    const timerRef = useRef(null);
    const mountedRef = useRef(false);
    const isTrailerPlayingRef = useRef(false); // true only when trailer is playing
    const movieCacheRef = useRef({}); // Keep cache in ref to avoid stale closures
    const imageCacheRef = useRef({});

    // ---------------------------
    useEffect(() => { jellyfinRef.current = state.jellyfinData; }, [state.jellyfinData]);
    useEffect(() => { listRef.current = state.movieList; }, [state.movieList]);
    useEffect(() => { indexRef.current = state.currentMovieIndex; }, [state.currentMovieIndex]);
    useEffect(() => { movieCacheRef.current = movieCache; }, [movieCache]);
    useEffect(() => { imageCacheRef.current = imageCache; }, [imageCache]);

    // ---------------------------
    // Utilities: Timer
    // ---------------------------
    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        clearTimer();

        if (isTrailerPlayingRef.current) return;

        const list = listRef.current;
        timerRef.current = setTimeout(() => {
            if (!list?.length) {
                fetchRandomMovie();
            } else {
                advanceBy(1);
            }
        }, shuffleInterval);
    }, [advanceBy, fetchRandomMovie, shuffleInterval, clearTimer]);

    const pauseAutoplay = useCallback(() => {
        clearTimer();
    }, [clearTimer]);

    const resumeAutoplay = useCallback(() => {
        isTrailerPlayingRef.current = false;
        startTimer();
    }, [startTimer]);

    // ---------------------------
    // Utilities: Base URL & Auth
    // ---------------------------
    const getBaseUrl = useCallback(() => {
        const addr = jellyfinRef.current?.serverAddress;
        if (!addr) return null;
        try {
            const u = new URL(addr);
            return `${u.protocol}//${u.host}${u.pathname && u.pathname !== '/' ? u.pathname.replace(/\/+$/, '') : ''}`;
        } catch {
            return null;
        }
    }, []);

    const getAuthHeader = useCallback(() => {
        const j = jellyfinRef.current;
        if (!j?.accessToken) return '';
        return `MediaBrowser Client="${j.appName || ''}", Device="${j.deviceName || ''}", DeviceId="${j.deviceId || ''}", Version="${j.appVersion || ''}", Token="${j.accessToken}"`;
    }, []);

    // ---------------------------
    // Fetch helpers
    // ---------------------------
    const fetchItemById = useCallback(async (id) => {
        const base = getBaseUrl();
        if (!base || !id) return null;
        try {
            const res = await fetch(
                `${base}/Items/${encodeURIComponent(id)}?Fields=Overview,RemoteTrailers,PremiereDate,RunTimeTicks,ChildCount,Genres,Type,OfficialRating,CommunityRating,CriticRating`,
                { headers: { Authorization: getAuthHeader() } }
            );
            if (!res.ok) return null;
            return await res.json();
        } catch {
            return null;
        }
    }, [getBaseUrl, getAuthHeader]);

    // Check image availability with HEAD, then preload via <img>
    const ensureImagesAndPreload = useCallback(async (movie) => {
        const base = getBaseUrl();
        if (!base || !movie?.Id) return { backdrop: null, logo: null, hasBackdrop: false, hasLogo: false };

        const backdropUrl = `${base}/Items/${encodeURIComponent(movie.Id)}/Images/Backdrop/0`;
        const logoUrl = `${base}/Items/${encodeURIComponent(movie.Id)}/Images/Logo`;

        // HEAD check
        const [hasBackdrop, hasLogo] = await Promise.all([
            fetch(backdropUrl, { method: 'HEAD', headers: { Authorization: getAuthHeader() } }).then(r => r.ok).catch(() => false),
            fetch(logoUrl, { method: 'HEAD', headers: { Authorization: getAuthHeader() } }).then(r => r.ok).catch(() => false)
        ]);

        // Preload images if available
        if (hasBackdrop) {
            try { const img = new Image(); img.src = backdropUrl; } catch { }
        }
        if (hasLogo) {
            try { const img = new Image(); img.src = logoUrl; } catch { }
        }

        return {
            backdrop: hasBackdrop ? backdropUrl : null,
            logo: hasLogo ? logoUrl : null,
            hasBackdrop,
            hasLogo
        };
    }, [getBaseUrl, getAuthHeader]);

    // Preload next index images ahead of time
    const preloadNextIndexImages = useCallback(async (nextIndex) => {
        const list = listRef.current;
        if (!list?.length) return;
        const idx = ((nextIndex % list.length) + list.length) % list.length;
        const nextId = list[idx];
        if (!nextId) return;

        // Skip if already cached (use ref for current values)
        const cachedMovie = movieCacheRef.current[nextId];
        const cachedImage = imageCacheRef.current[nextId];
        if (cachedMovie && (cachedImage?.hasBackdrop !== undefined || cachedImage?.hasLogo !== undefined)) return;

        const movie = await fetchItemById(nextId);
        if (!movie) return;

        // Cache movie metadata
        setMovieCache(prev => ({ ...prev, [nextId]: movie }));

        const result = await ensureImagesAndPreload(movie);
        setImageCache(prev => ({ ...prev, [nextId]: result }));
    }, [fetchItemById, ensureImagesAndPreload]);

    // Background prefetch all slides in the list
    const prefetchAllSlides = useCallback(async () => {
        const list = listRef.current;
        if (!list?.length) return;
        
        // Process in batches to avoid overwhelming the server
        const batchSize = 3;
        for (let i = 0; i < list.length; i += batchSize) {
            const batch = list.slice(i, i + batchSize);
            
            await Promise.all(
                batch.map(async (id) => {
                    // Skip if already cached (use ref for current values)
                    const cachedMovie = movieCacheRef.current[id];
                    const cachedImage = imageCacheRef.current[id];
                    if (cachedMovie && (cachedImage?.hasBackdrop !== undefined || cachedImage?.hasLogo !== undefined)) {
                        return;
                    }

                    try {
                        const movie = await fetchItemById(id);
                        if (!movie) return;

                        // Cache movie metadata
                        setMovieCache(prev => ({ ...prev, [id]: movie }));

                        const imgInfo = await ensureImagesAndPreload(movie);
                        setImageCache(prev => ({ ...prev, [id]: imgInfo }));
                    } catch (err) {
                        console.warn(`Failed to prefetch slide ${id}:`, err);
                    }
                })
            );

            // Small delay between batches to avoid rate limiting
            if (i + batchSize < list.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }, [fetchItemById, ensureImagesAndPreload]);

    // ---------------------------
    // Slide creation and strict-order navigation
    // ---------------------------
    const createSlide = useCallback((movie) => {
        if (!movie) return;
        clearTimer();

        isTrailerPlayingRef.current = false;
        setState(prev => {
            const prevMovies = [...prev.previousMovies];
            if (!prevMovies.length || prevMovies[prevMovies.length - 1]?.Id !== movie.Id) {
                prevMovies.push(movie);
            }
            return {
                ...prev,
                currentMovie: movie,
                previousMovies: prevMovies.slice(-50)
            };
        });
        setTimeout(() => startTimer(), 0);
    }, [clearTimer, startTimer]);

    const showIndex = useCallback(async (newIndex) => {
        const list = listRef.current;

        if (!list?.length) return;

        // clamp/loop index
        const normalized = ((newIndex % list.length) + list.length) % list.length;
        const id = list[normalized];
        if (!id) return;

        clearTimer();

        setState(prev => ({ ...prev, currentMovieIndex: normalized }));

        // Check cache first before fetching (use ref for current value)
        let movie = movieCacheRef.current[id];
        
        if (!movie) {
            // Not in cache, fetch from server
            movie = await fetchItemById(id);
            
            if (!movie) {
                // If can't fetch, try next slide immediately instead of waiting
                console.warn(`Failed to fetch item ${id}, advancing to next slide`);
                const nextNormalized = ((normalized + 1) % list.length + list.length) % list.length;
                showIndex(nextNormalized);
                return;
            }
            
            // Cache it for next time
            setMovieCache(prev => ({ ...prev, [id]: movie }));
        }

        // Check if images are cached, if not fetch them (use ref for current value)
        const cachedImage = imageCacheRef.current[id];
        if (!cachedImage || cachedImage.hasBackdrop === undefined) {
            const imgInfo = await ensureImagesAndPreload(movie);
            setImageCache(prev => ({ ...prev, [id]: imgInfo }));
        }

        // Show slide
        createSlide(movie);

        // Preload upcoming slide assets
        preloadNextIndexImages(normalized + 1);
    }, [clearTimer, fetchItemById, ensureImagesAndPreload, createSlide, preloadNextIndexImages]);

    // Always try strict list → fallback to random when list = empty
    const advanceBy = useCallback((delta) => {
        const list = listRef.current;
        if (!list?.length) {
            // No list? fallback to random movie
            fetchRandomMovie();
            return;
        }
        const next = indexRef.current + delta;
        showIndex(next);
    }, [showIndex, fetchRandomMovie]);

    // Public navigation
    const nextSlide = useCallback(() => {
        clearTimer();
        const list = listRef.current;
        if (!list?.length) {
            // no list → random movie
            fetchRandomMovie();
        } else {
            advanceBy(1);
        }
        startTimer();
    }, [advanceBy, clearTimer, startTimer, fetchRandomMovie]);

    const prevSlide = useCallback(() => {
        clearTimer();
        const list = listRef.current;
        if (!list?.length) {
            // If no list and no previousMovies → just random again
            const prev = state.previousMovies;
            if (prev.length > 1) {
                // navigate back in history
                const movie = prev[prev.length - 2];
                createSlide(movie);
            } else {
                fetchRandomMovie();
            }
        } else {
            advanceBy(-1);
        }
        startTimer();
    }, [advanceBy, clearTimer, startTimer, fetchRandomMovie, state.previousMovies, createSlide]);

    // ---------------------------
    // Fallback random (only if list is empty)
    // ---------------------------
    const fetchRandomMovie = useCallback(async () => {
        const list = listRef.current;
        if (list?.length) {
            // If list exists, follow strict order instead
            advanceBy(1);
            return;
        }
        const base = getBaseUrl();
        if (!base) {
            startTimer();
            return;
        }
        const types = moviesSeriesBoth === 1 ? 'Movie' : moviesSeriesBoth === 2 ? 'Series' : 'Movie,Series';
        try {
            const res = await fetch(`${base}/Items?IncludeItemTypes=${encodeURIComponent(types)}&Recursive=true&Limit=1&SortBy=random&Fields=Id,Overview,RemoteTrailers,PremiereDate,RunTimeTicks,ChildCount,Genres,Type,OfficialRating,CommunityRating,CriticRating`, {
                headers: { Authorization: getAuthHeader() }
            });
            if (!res.ok) {
                startTimer();
                return;
            }
            const data = await res.json();
            const item = data?.Items?.[0];
            if (!item) {
                startTimer();
                return;
            }
            // mirror strict flow for random
            const imgInfo = await ensureImagesAndPreload(item);
            setImageCache(prev => ({ ...prev, [item.Id]: imgInfo }));
            createSlide(item);
            // no preloading for random since unknown next
        } catch {
            startTimer();
        }
    }, [moviesSeriesBoth, getBaseUrl, getAuthHeader, ensureImagesAndPreload, createSlide, startTimer, advanceBy]);

    // ---------------------------
    // Player callbacks
    // ---------------------------
    const onPlayerReady = useCallback(e => {
        const player = e?.target;
        if (!player) return;

        isTrailerPlayingRef.current = true; // ✅ trailer starts
        clearTimer();
        try { player.mute(); } catch { }
        try { player.playVideo(); } catch { }
    }, [state.isMuted, pauseAutoplay]);

    const onPlayerStateChange = useCallback((event) => {
        if (event?.data === 0) { // trailer ended
            isTrailerPlayingRef.current = false;
            startTimer();
            nextSlide(); // move to next slide
        }
    }, [nextSlide, startTimer]);

    const onPlayerError = useCallback((event) => {
        console.warn('YouTube Trailer Error:', event?.data);

        // Hide trailer overlay if visible
        try {
            const overlay = document.getElementById('video-overlay');
            if (overlay) overlay.style.display = 'none';
        } catch { }

        // Mark that we're no longer playing a trailer
        isTrailerPlayingRef.current = false;

        // Error 153 = playback blocked by YouTube (copyright, embedding, TV restrictions)
        if (event?.data === 153) {
            console.warn('Trailer blocked (Error 153) → Skipping to slideshow');
            resumeAutoplay(); // resume normal slideshow
            return;
        }

        // Any other error, still resume autoplay
        resumeAutoplay();
    }, [resumeAutoplay]);

    // ---------------------------
    // Initialization
    // ---------------------------
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            clearTimer();
        };
    }, [clearTimer]);

    useEffect(() => {
        let interval = null;

        const checkLogin = async () => {
            try {
                const api = window.ApiClient;
                const isLoggedIn =
                    api
                    && (typeof api.getCurrentUserId === 'function' ? api.getCurrentUserId() : api._currentUser?.Id)
                    && (api._serverInfo?.AccessToken || api._serverInfo);

                if (isLoggedIn && !state.slideshow.hasInitialized) {
                    // Save Phim Nè data
                    setState(prev => ({
                        ...prev,
                        jellyfinData: {
                            userId: typeof api.getCurrentUserId === 'function' ? api.getCurrentUserId() : api._currentUser?.Id || null,
                            appName: api._appName || null,
                            appVersion: api._appVersion || null,
                            deviceName: api._deviceName || null,
                            deviceId: api._deviceId || null,
                            accessToken: api._serverInfo?.AccessToken || null,
                            serverAddress: api._serverInfo?.Address || api._serverAddress || api._serverInfo?.LocalAddress || null,
                            serverId: api._serverInfo?.Id || null
                        },
                        slideshow: { ...prev.slideshow, hasInitialized: true }
                    }));

                    // Load list file: keep your path as needed
                    const listFileFromServer = window.slideShowItems;

                    if (listFileFromServer.length > 0) {
                        const ids = listFileFromServer;
                        
                        setState(prev => ({ ...prev, movieList: ids, currentMovieIndex: 0 }));
                        listRef.current = ids;

                        // Show first slide strictly by order
                        await showIndex(0);
                        // Preload second
                        preloadNextIndexImages(1);
                        
                        // Start background prefetch for all remaining slides
                        setTimeout(() => {
                            prefetchAllSlides();
                        }, 1000); // Delay slightly to let first slide render smoothly
                        
                        return;
                    }
                    // If list empty or fetch failed: fallback random
                    await fetchRandomMovie();
                }
            } catch {
                // ignore
            }
        };

        interval = setInterval(checkLogin, 500);
        checkLogin();

        return () => clearInterval(interval);
    }, [state.slideshow.hasInitialized, showIndex, preloadNextIndexImages, fetchRandomMovie, prefetchAllSlides]);

    // ---------------------------
    // Visibility follows init
    // ---------------------------
    useEffect(() => {
        setIsVisible(!!state.slideshow.hasInitialized);
    }, [state.slideshow.hasInitialized]);

    // ---------------------------
    // Public API
    // ---------------------------
    return {
        state,
        imageCache,
        movieCache,
        favorites,
        setFavorites,
        isVisible,
        setIsVisible,

        // navigation
        nextSlide,
        prevSlide,

        // if you still call this somewhere, it respects strict order fallback
        fetchRandomMovie,
        
        // background prefetch
        prefetchAllSlides,

        // config needed by UI
        plotMaxLength,
        shuffleInterval,
        useTrailers,
        useSponsorBlock,
        trailerMaxLength,

        // player callbacks
        onPlayerReady,
        onPlayerStateChange,
        onPlayerError,
        resumeAutoplay,
        pauseAutoplay
    };
}
