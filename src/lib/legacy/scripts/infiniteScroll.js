// KefinTweaks Infinite Scroll
// Adds infinite scrolling to media library pages (Movies, TV, Music)
// Requires: cardBuilder.js module to be loaded before this script

(function () {
    const RETRY_ATTEMPTS = 3;
    const RETRY_DELAY = 1000;

    // Common logging functions

    const WARN = (...args) => console.warn('[KefinTweaks InfiniteScroll]', ...args);
    const ERR = (...args) => console.error('[KefinTweaks InfiniteScroll]', ...args);

    // Supported pages (same as headerTabs)
    const SUPPORTED_PAGES = ['tv.html', 'movies.html', 'music.html', 'tv', 'movies', 'music'];

    // Media type configurations - Read from centralized config or use defaults
    const MEDIA_CONFIGS = {
        'movies.html': {
            includeItemTypes: 'Movie',
            context: 'movies',
            sortBy: 'SortName,ProductionYear'
        },
        'tv.html': {
            includeItemTypes: 'Series',
            context: 'tvshows',
            sortBy: 'SortName,ProductionYear'
        },
        'music.html': {
            includeItemTypes: 'Music',
            context: 'music',
            sortBy: 'SortName,ProductionYear'
        },
        'movies': {
            includeItemTypes: 'Movie',
            context: 'movies',
            sortBy: 'SortName,ProductionYear'
        },
        'tv': {
            includeItemTypes: 'Series',
            context: 'tvshows',
            sortBy: 'SortName,ProductionYear'
        },
        'music': {
            includeItemTypes: 'Music',
            context: 'music',
            sortBy: 'SortName,ProductionYear'
        }
    };

    let userId = null;
    const limit = 100;

    let currentPage = null;
    let currentTab = 0;
    let startIndex = 0;
    let loading = false;
    let hasMore = true;
    let totalRecordCount = null; // Track total items available from API
    let retryCount = 0;
    // scrollState removed - not needed
    let scrollTimeout = null;
    let isScrollTriggered = false; // Prevent multiple triggers
    let isRequestInProgress = false; // Blocking flag to prevent multiple simultaneous requests
    let hasInitialized = false; // Prevent multiple initializations
    let isInitializing = false; // Prevent concurrent initializations

    // Create loading indicator element
    function createLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'infinite-scroll-loading';
        loadingDiv.id = 'infinite-scroll-loading-indicator';
        loadingDiv.innerHTML = `
            <div class="spinner"></div>
            <span>Loading more content...</span>
        `;
        return loadingDiv;
    }

    // Show loading indicator
    function showLoadingIndicator() {
        let loadingIndicator = document.getElementById('infinite-scroll-loading-indicator');

        if (!loadingIndicator) {
            loadingIndicator = createLoadingIndicator();

            // Find the container and append the loading indicator as a sibling
            const container = getContainer();
            if (container && container.parentNode) {
                container.parentNode.insertBefore(loadingIndicator, container.nextSibling);
            } else {
                // Fallback: append to body
                document.body.appendChild(loadingIndicator);
            }
        }

        // Show with animation
        setTimeout(() => {
            loadingIndicator.classList.add('show');
        }, 10);
    }

    // Hide loading indicator
    function hideLoadingIndicator() {
        const loadingIndicator = document.getElementById('infinite-scroll-loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.classList.remove('show');

            // Remove from DOM after animation
            setTimeout(() => {
                if (loadingIndicator.parentNode) {
                    loadingIndicator.parentNode.removeChild(loadingIndicator);
                }
            }, 300);
        }
    }

    // Add CSS to hide paging controls when infinite scroll is active
    function addInfiniteScrollCSS() {
        // Check if infinite scroll is enabled in configuration
        const isEnabled = window.KefinTweaksConfig?.scripts?.infiniteScroll !== false;
        if (!isEnabled) {
            return;
        }

        const styleId = 'infinite-scroll-paging-hide';

        // Check if style already exists
        if (document.getElementById(styleId)) {
            return;
        }

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            #moviesTab .listPaging>div, 
            #seriesTab .listPaging>div {
                display: none !important;
            }
            
            /* Infinite scroll loading indicator */
            .infinite-scroll-loading {
                display: flex;
                flex-direction: column;
                gap: 10px;
                justify-content: center;
                align-items: center;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
                font-size: 14px;
                color: #666;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .infinite-scroll-loading.show {
                opacity: 1;
            }
            
            .infinite-scroll-loading .spinner {
                width: 20px;
                height: 20px;
                border: 2px solid #f3f3f3;
                border-top: 2px solid #3498db;
                border-radius: 50%;
                animation: infinite-scroll-spin 1s linear infinite;
                margin-right: 10px;
            }
            
            @keyframes infinite-scroll-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;

        document.head.appendChild(style);
    }

    // Wait for ApiClient to be available
    function waitForApiClient() {
        return new Promise((resolve) => {
            if (typeof ApiClient !== 'undefined' && ApiClient._serverInfo && ApiClient._serverInfo.UserId) {
                userId = ApiClient._serverInfo.UserId;
                resolve();
            } else {
                setTimeout(() => waitForApiClient().then(resolve), 100);
            }
        });
    }

    // Wait for cardBuilder to be available
    function waitForCardBuilder() {
        return new Promise((resolve) => {
            if (typeof window.cardBuilder !== 'undefined' && window.cardBuilder.buildCard) {
                resolve();
            } else {
                setTimeout(() => waitForCardBuilder().then(resolve), 100);
            }
        });
    }

    // Page detection function (same as headerTabs)
    function getCurrentPage() {
        const hash = window.location.hash;
        const hashMatches = hash.match(/#\/([^?]+)/g);

        if (!hashMatches || hashMatches.length === 0) {
            return null;
        }

        for (const match of hashMatches) {
            const pageFromHash = match.replace('#/', '');
            if (SUPPORTED_PAGES.includes(pageFromHash)) {
                return pageFromHash;
            }
        }
        return null;
    }

    // Get current tab index from URL
    function getCurrentTab() {
        const hash = window.location.hash;
        let searchParams = '';

        if (hash.includes('?')) {
            searchParams = hash.split('?')[1];
        } else {
            searchParams = window.location.search.substring(1);
        }

        const urlParams = new URLSearchParams(searchParams);
        const tabParam = urlParams.get('tab');
        return tabParam ? parseInt(tabParam, 10) : 0;
    }

    // State persistence functions - REMOVED
    // We don't need to store scroll state as it can cause issues with infinite scroll behavior

    function getParentId() {
        const match = window.location.hash.match(/topParentId=([^&]+)/);
        return match ? match[1] : null;
    }

    // Get current sort settings from Jellyfin's localStorage keys
    function getCurrentSortSettings() {
        const userId = ApiClient.getCurrentUserId();
        const parentId = getParentId();
        const page = getCurrentPage();

        if (!userId || !parentId || !page) {
            return null;
        }

        // Map page to media type
        const mediaTypeMap = {
            'movies.html': 'movies',
            'tv.html': 'series'
        };

        const mediaType = mediaTypeMap[page];
        if (!mediaType) {
            return null;
        }

        // Build localStorage keys
        const storageKey = `${userId}-${parentId}-${mediaType}`;
        const filterKey = `${userId}-${parentId}-${mediaType}-filter`;

        try {
            // Get main sort settings
            const sortData = JSON.parse(localStorage.getItem(storageKey) || '{}');
            const filterData = JSON.parse(localStorage.getItem(filterKey) || '{}');

            return {
                sortBy: sortData.SortBy || 'SortName,ProductionYear',
                sortOrder: sortData.SortOrder || 'Ascending',
                filters: filterData.Filters || '',
                years: filterData.Years || '',
                genres: filterData.Genres || '',
                tags: filterData.Tags || ''
                // Add other filter properties as needed
            };
        } catch (error) {
            ERR('Error parsing sort settings from localStorage:', error);
            return null;
        }
    }

    // Get current alpha picker selection
    function getCurrentAlphaPicker() {
        const page = getCurrentPage();
        if (!page) return null;

        let activeTab = null;
        if (page === 'tv.html' || page === 'tv') {
            activeTab = document.querySelector('#seriesTab.is-active');
        } else if (page === 'movies.html' || page === 'movies') {
            activeTab = document.querySelector('#moviesTab.is-active');
        }

        if (!activeTab) return null;

        const alphaPickerRow = activeTab.querySelector('.alphaPickerRow');
        if (!alphaPickerRow) return null;

        const selectedButton = alphaPickerRow.querySelector('.alphaPickerButton-selected');
        if (!selectedButton) return null;

        const dataValue = selectedButton.getAttribute('data-value');

        return dataValue;
    }

    // Get current start index based on existing items count
    function getCurrentStartIndex() {
        const container = getContainer();
        if (!container) return 0;

        const existingItemsCount = container.children.length;

        return existingItemsCount;
    }

    // Update pagination display to show current range
    function updatePaginationDisplay() {
        const page = getCurrentPage();
        if (!page) return;

        let activeTab = null;
        if (page === 'tv.html' || page === 'tv') {
            activeTab = document.querySelector('#seriesTab.is-active');
        } else if (page === 'movies.html' || page === 'movies') {
            activeTab = document.querySelector('#moviesTab.is-active');
        }

        if (!activeTab) return;

        const listPagings = activeTab.querySelectorAll('.listPaging');
        if (!listPagings.length) return;

        listPagings.forEach(listPaging => {
            const span = listPaging.querySelector('span');
            if (!span) return;

            const container = getContainer();
            if (!container) return;

            const currentItemsCount = container.children.length;
            const totalCount = totalRecordCount || '?';

            // Update the display to show current range
            span.textContent = `1-${currentItemsCount} of ${totalCount}`;
        });
    }

    function getContainer() {
        const libraryPage = document.querySelector('.libraryPage:not(.hide)');
        if (!libraryPage) return null;

        // Check if we're on the correct active tab
        const page = getCurrentPage();
        if (!page) return null;

        let activeTab = null;
        if (page === 'tv.html' || page === 'tv') {
            activeTab = document.querySelector('#seriesTab.is-active');
        } else if (page === 'movies.html' || page === 'movies') {
            activeTab = document.querySelector('#moviesTab.is-active');
        }

        if (!activeTab) {
            return null;
        }

        const container = activeTab.querySelector('.itemsContainer');
        if (!container) {
            return null;
        }

        return container;
    }

    async function loadMore() {
        if (loading || !hasMore || isRequestInProgress) {
            return;
        }

        // Don't load more if there are no items in the container (page still loading)
        const container = getContainer();
        if (container && container.children.length === 0) {
            return;
        }

        loading = true;
        isRequestInProgress = true;

        // Show loading indicator
        showLoadingIndicator();

        // Wait for ApiClient to be ready
        if (!userId) {
            await waitForApiClient();
        }

        // Wait for cardBuilder to be ready
        await waitForCardBuilder();

        const page = getCurrentPage();
        const tab = getCurrentTab();

        if (!page) {
            WARN('No supported page detected');
            loading = false;
            isRequestInProgress = false;
            hideLoadingIndicator();
            return;
        }

        const parentId = getParentId();
        if (!parentId) {
            WARN('No topParentId found in URL');
            loading = false;
            isRequestInProgress = false;
            hideLoadingIndicator();
            return;
        }

        const mediaConfig = MEDIA_CONFIGS[page];
        if (!mediaConfig) {
            WARN('No media configuration found for page:', page);
            loading = false;
            isRequestInProgress = false;
            hideLoadingIndicator();
            return;
        }

        // Double-check ApiClient is available
        if (typeof ApiClient === 'undefined') {
            ERR('ApiClient is not available');
            loading = false;
            isRequestInProgress = false;
            hideLoadingIndicator();
            return;
        }

        // Get current start index based on existing items
        startIndex = getCurrentStartIndex();

        // Get current sort settings from localStorage
        const sortSettings = getCurrentSortSettings();
        const apiParams = {
            SortBy: mediaConfig.sortBy, // fallback
            SortOrder: 'Ascending', // fallback
            IncludeItemTypes: mediaConfig.includeItemTypes,
            Recursive: true,
            Fields: 'PrimaryImageAspectRatio,MediaSourceCount',
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
            ParentId: parentId,
            StartIndex: startIndex,
            Limit: limit
        };

        // Apply detected sort settings if available
        if (sortSettings) {
            apiParams.SortBy = sortSettings.sortBy;
            apiParams.SortOrder = sortSettings.sortOrder;

            // Add filter parameters if they exist
            if (sortSettings.filters) {
                apiParams.Filters = sortSettings.filters;
            }
            if (sortSettings.years) {
                apiParams.Years = sortSettings.years;
            }
            if (sortSettings.genres) {
                apiParams.Genres = sortSettings.genres;
            }
            if (sortSettings.tags) {
                apiParams.Tags = sortSettings.tags;
            }
        } else {
        }

        // Add alpha picker support
        const alphaPicker = getCurrentAlphaPicker();
        if (alphaPicker) {
            apiParams.NameStartsWith = alphaPicker;
        }

        const url = ApiClient.getUrl('Users/' + userId + '/Items', apiParams);

        try {
            const result = await ApiClient.getJSON(url);

            // Update total record count from API response
            if (result.TotalRecordCount !== undefined) {
                totalRecordCount = result.TotalRecordCount;
            }

            if (result.Items && result.Items.length > 0) {
                const container = getContainer();
                if (container) {
                    // Check if cardBuilder is available
                    if (typeof window.cardBuilder === 'undefined' || !window.cardBuilder.buildCard) {
                        ERR('cardBuilder not available or buildCard method missing');
                        loading = false;
                        isRequestInProgress = false;
                        hideLoadingIndicator();
                        return;
                    }

                    // Build each card individually and append to container
                    result.Items.forEach((item, index) => {
                        const card = window.cardBuilder.buildCard(item);
                        card.setAttribute('data-index', startIndex + index);
                        container.appendChild(card);
                    });
                }
                startIndex += result.Items.length;

                // Update pagination display
                updatePaginationDisplay();

                // Update hasMore based on total record count
                if (totalRecordCount !== null) {
                    hasMore = startIndex < totalRecordCount;
                } else {
                    // Fallback to old logic if no total count available
                    hasMore = result.Items.length >= limit;
                }
            } else {
                hasMore = false;
            }

            // Reset retry count on success
            retryCount = 0;
        } catch (err) {
            ERR('Infinite scroll load error', err);

            // Retry logic
            if (retryCount < RETRY_ATTEMPTS) {
                retryCount++;
                WARN(`Retrying loadMore (attempt ${retryCount}/${RETRY_ATTEMPTS})`);
                setTimeout(() => {
                    loading = false;
                    isRequestInProgress = false;
                    loadMore();
                }, RETRY_DELAY * retryCount);
                return;
            } else {
                ERR('Max retry attempts reached, giving up');
                hasMore = false;
            }
        } finally {
            loading = false;
            isRequestInProgress = false;

            // Hide loading indicator
            hideLoadingIndicator();
        }
    }

    function setupScrollWatcher() {
        // Remove any existing scroll listener
        window.removeEventListener('scroll', handleScroll);

        // Add throttled scroll listener
        window.addEventListener('scroll', handleScroll);
    }

    function handleScroll() {
        // Throttle scroll events - only check every 100ms
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }

        scrollTimeout = setTimeout(() => {
            checkScrollPosition();
        }, 100);
    }

    function checkScrollPosition() {
        // Don't trigger if already loading, no more items, or request in progress
        if (loading || !hasMore || isScrollTriggered || isRequestInProgress) {
            return;
        }

        const container = getContainer();
        if (!container) {
            return;
        }

        // Don't trigger if there are no items in the container (page still loading)
        const existingItemsCount = container.children.length;
        if (existingItemsCount === 0) {
            return;
        }

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // Calculate distance from bottom - trigger when one viewport height away
        const distanceFromBottom = documentHeight - (scrollTop + windowHeight);
        const triggerThreshold = windowHeight; // One viewport height from bottom

        if (distanceFromBottom <= triggerThreshold) {
            isScrollTriggered = true;
            loadMore().finally(() => {
                // Reset trigger flag after load completes
                setTimeout(() => {
                    isScrollTriggered = false;
                }, 1000); // Wait 1 second before allowing next trigger
            });
        }
    }

    // Reset state when navigating to a new library or tab
    function reset() {
        const page = getCurrentPage();
        const tab = getCurrentTab();

        // startIndex will be calculated dynamically based on existing items
        hasMore = true;
        totalRecordCount = null;
        loading = false;
        retryCount = 0;
        isScrollTriggered = false;
        isRequestInProgress = false;

        // Scroll state restoration removed - not needed

        // Clear container if switching pages/tabs
        if (currentPage !== page || currentTab !== tab) {
            const container = getContainer();
            if (container) {
                //container.innerHTML = '';
            }
            hasInitialized = false; // Reset initialization flag for new page/tab
            isInitializing = false; // Reset initializing flag for new page/tab
        }

        currentPage = page;
        currentTab = tab;
    }

    // Check if we should initialize infinite scroll
    function shouldInitialize() {
        const page = getCurrentPage();
        const container = getContainer();

        if (!page) {
            return false;
        }

        if (!container) {
            return false;
        }

        // Double-check that we have the correct active tab
        let activeTab = null;
        if (page === 'tv.html' || page === 'tv') {
            activeTab = document.querySelector('#seriesTab.is-active');
        } else if (page === 'movies.html' || page === 'movies') {
            activeTab = document.querySelector('#moviesTab.is-active');
        }

        if (!activeTab) {
            return false;
        }

        return true;
    }

    // Initialize infinite scroll
    async function initialize() {
        if (!shouldInitialize() || hasInitialized || isInitializing) {
            return;
        }

        isInitializing = true;
        hasInitialized = true;

        try {
            // Add CSS to hide paging controls
            addInfiniteScrollCSS();

            // Wait for ApiClient to be ready
            if (!userId) {
                await waitForApiClient();
            }

            // Wait for cardBuilder to be ready
            await waitForCardBuilder();

            reset();
            //loadMore(); // load first page
            setupScrollWatcher();

            // Update pagination display with initial state
            updatePaginationDisplay();
        } finally {
            isInitializing = false;
        }
    }

    // Scroll state loading removed - not needed

    // Wait for page to mount
    const observer = new MutationObserver(() => {
        if (shouldInitialize()) {
            initialize().catch(err => ERR('Initialization failed:', err));
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Also try to initialize immediately if page is already loaded
    if (document.readyState === 'complete') {
        setTimeout(() => {
            initialize().catch(err => ERR('Initial initialization failed:', err));
        }, 100);
    }

    // Cleanup function
    function cleanup() {
        window.removeEventListener('scroll', handleScroll);
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }

        // Remove the CSS that hides paging controls
        const styleElement = document.getElementById('infinite-scroll-paging-hide');
        if (styleElement) {
            styleElement.remove();
        }

        // Hide and remove loading indicator
        hideLoadingIndicator();
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
})();
