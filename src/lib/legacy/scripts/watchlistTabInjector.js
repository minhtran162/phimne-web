(function () {
    'use strict';

    const WARN = (...args) => console.warn('[KefinTweaks WatchlistInjector]', ...args);

    function injectWatchlistTab(view, element) {
        // Only run on home screen
        if (!view.classList.contains('homePage')) return;

        // Check if tab already exists
        const existingTab = element.querySelector('.headerTabButton[data-kefintweaks-watchlist]');
        if (existingTab) return;

        const tabsContainer = element.querySelector('.homeLibraryTabs');
        if (!tabsContainer) return;

        const sectionsContainer = element.querySelector('.homeSectionsContainer');
        if (!sectionsContainer) return;

        // Create content div if missing
        let watchlistDiv = sectionsContainer.querySelector('.sections.watchlist');
        if (!watchlistDiv) {
            watchlistDiv = document.createElement('div');
            watchlistDiv.classList.add('sections', 'watchlist');
            watchlistDiv.style.display = 'none';
            // watchlist.js will populate this
            sectionsContainer.appendChild(watchlistDiv);
        }

        // Create tab button
        const watchlistTab = document.createElement('button');
        watchlistTab.type = 'button';
        watchlistTab.classList.add('headerTabButton', 'mdl-button', 'mdl-js-button', 'mdl-js-ripple-effect');
        watchlistTab.dataset.kefintweaksWatchlist = 'true';
        // Match style of other tabs
        watchlistTab.innerHTML = '<span class="material-icons local_activity"></span> <span>Watchlist</span>';

        // Insert at the end
        tabsContainer.appendChild(watchlistTab);

        // Handle click
        watchlistTab.addEventListener('click', () => {
            // Deactivate other tabs
            const allTabs = tabsContainer.querySelectorAll('.headerTabButton');
            allTabs.forEach(t => t.classList.remove('emby-tab-button-active'));
            watchlistTab.classList.add('emby-tab-button-active');

            // Hide other sections
            const allSections = sectionsContainer.querySelectorAll('.sections');
            allSections.forEach(s => {
                s.classList.add('hide');
                s.style.display = 'none';
            });

            // Show watchlist
            watchlistDiv.classList.remove('hide');
            watchlistDiv.style.display = 'block';

            // Trigger resize event to ensure content renders correctly
            window.dispatchEvent(new Event('resize'));
        });
    }

    // Try to hook using Utils if available
    function init() {
        document.addEventListener('viewshow', (e) => {
            injectWatchlistTab(e.target, e.target);
        }, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
