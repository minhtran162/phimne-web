import globalize from '../globalize';

export {};

// Wait for translations to be loaded
function waitForTranslations(callback) {

    if (typeof globalize.translate === 'function') {
        try {
            const test = globalize.translate('RecentlyReleasedMovies');
            if (test && test !== 'RecentlyReleasedMovies') {
                callback();
                return;
            }
        } catch (e) {
            // Continue waiting
        }
    }
    
    setTimeout(() => waitForTranslations(callback), 100);
}

// Build configuration with safe translations
function buildConfig() {
    const protocol = window.location.protocol, host = window.location.host;
    return {
        'kefinTweaksRoot': `${protocol}//${host}/${protocol === 'https:' ? 'web/' : ''}assets/jellyfintweaks/`,
        'scripts': {
            'watchlist': true,
            'homeScreen': true,
            'search': true,
            'infiniteScroll': true,
            'removeContinue': true,
            'skinManager': true,
            'headerTabs': true,
            'customMenuLinks': false,
            'breadcrumbs': true,
            'playlist': false,
            'itemDetailsCollections': true,
            'flattenSingleSeasonShows': true,
            'seriesInfo': true,
            'collections': true,
            'subtitleSearch': false,
            'exclusiveElsewhere': false,
            'backdropLeakFix': true,
            'dashboardButtonFix': true
        },
        'homeScreen': {
            'defaultItemLimit': 16,
            'defaultSortOrder': 'Random',
            'defaultCardFormat': 'Poster',
            'customSections': []
        },
        'exclusiveElsewhere': {
            'hideServerName': false
        },
        'search': {
            'enableJellyseerr': false
        },
        'defaultSkin': 'GlassFin',
        'skins': [],
        'themes': [],
        'customMenuLinks': [],
        'enabled': true,
        'flattenSingleSeasonShows': {
            'hideSingleSeasonContainer': false
        },
        'optionalIncludes': [
            {
                'key': 'global-lscambo13-custom-media-covers-latest-min.css',
                'enabled': false
            },
            {
                'key': 'global-JamsRepos-central-libraries-small.css',
                'enabled': false
            },
            {
                'key': 'global-JamsRepos-hide-my-media.css',
                'enabled': false
            },
            {
                'key': 'global-JamsRepos-smaller-cast.css',
                'enabled': false
            },
            {
                'key': 'global-LitCastVlog-ScyFlow-EpisodeGrid.css',
                'enabled': false
            },
            {
                'key': 'global-LitCastVlog-ScyFLow-RoundCastCrew.css',
                'enabled': false
            },
            {
                'key': 'global-CTalvio-smallercast.css',
                'enabled': false
            },
            {
                'key': 'global-CTalvio-episodes_compactlist.css',
                'enabled': false
            },
            {
                'key': 'global-CTalvio-episodes_grid.css',
                'enabled': true
            },
            {
                'key': 'global-CTalvio-pan-animation.css',
                'enabled': true
            },
            {
                'key': 'global-LitCastVlog-ScyFlow-AnimatedOverlay.css',
                'enabled': true
            }
        ]
    };
}

waitForTranslations(() => {
    window.KefinTweaksConfig = buildConfig();
    localStorage.setItem('KefinTweaksConfig', JSON.stringify(window.KefinTweaksConfig));
    
    // Also set initial config for backward compatibility
    if (!window.KefinTweaksConfig) {
        window.KefinTweaksConfig = buildConfig();
    }
});

// Set initial config immediately (may have translation keys)
window.KefinTweaksConfig = buildConfig();
localStorage.setItem('KefinTweaksConfig', JSON.stringify(window.KefinTweaksConfig));