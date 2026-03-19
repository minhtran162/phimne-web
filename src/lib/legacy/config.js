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
    const protocol = window.location.protocol; const host = window.location.host;
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
            'recentlyReleased': {
                'enabled': true,
                'movies': {
                    'enabled': true,
                    'itemLimit': 16,
                    'sortOrder': 'Random',
                    'sortOrderDirection': 'Descending',
                    'cardFormat': 'Poster',
                    'order': 30,
                    'isPlayed': null,
                    'minAgeInDays': 0,
                    'maxAgeInDays': 30
                },
                'episodes': {
                    'enabled': true,
                    'itemLimit': 16,
                    'sortOrder': 'PremiereDate',
                    'sortOrderDirection': 'Descending',
                    'cardFormat': 'Backdrop',
                    'order': 31,
                    'isPlayed': null,
                    'minAgeInDays': 0,
                    'maxAgeInDays': 30
                }
            },
            'recentlyAddedInLibrary': {
                'f137a2dd21bbc1b99aa5c0f6bf02a805': {
                    'enabled': true,
                    'itemLimit': 30,
                    'cardFormat': 'Poster',
                    'order': 11
                },
                'bfd8445a64c947c9ae8a9e68bd705b4f': {
                    'enabled': true,
                    'itemLimit': 30,
                    'cardFormat': 'Thumb',
                    'order': 11
                }
            },
            'trending': {
                'enabled': false,
                'itemLimit': 16,
                'sortOrder': 'Random',
                'sortOrderDirection': 'Ascending',
                'cardFormat': 'Poster',
                'order': 32,
                'isPlayed': null
            },
            'popularTVNetworks': {
                'enabled': true,
                'minimumShowsForNetwork': 5,
                'itemLimit': 16,

                'sortOrder': 'Random',
                'sortOrderDirection': 'Ascending',
                'cardFormat': 'Poster',
                'order': 61
            },
            'watchlist': {
                'enabled': true,
                'itemLimit': 16,
                'sortOrder': 'DateAdded',
                'sortOrderDirection': 'Descending',
                'cardFormat': 'Poster',
                'order': 60
            },
            'watchAgain': {
                'enabled': true,
                'itemLimit': 16,
                'sortOrder': 'Random',
                'sortOrderDirection': 'Ascending',
                'cardFormat': 'Poster',
                'order': 62
            },
            'upcoming': {
                'enabled': true,
                'itemLimit': 48,
                'cardFormat': 'Thumb',
                'order': 20
            },
            'imdbTop250': {
                'enabled': true,
                'itemLimit': 16,
                'sortOrder': 'Random',
                'sortOrderDirection': 'Ascending',
                'cardFormat': 'Poster',
                'order': 21,
                'isPlayed': null
            },
            'seasonal': {
                'enabled': true,
                'enableSeasonalAnimations': true,
                'enableSeasonalBackground': true,
                'defaultItemLimit': 16,
                'defaultSortOrder': 'Random',
                'defaultCardFormat': 'Poster',
                'seasons': [
                    {
                        'id': 'halloween',

                        'enabled': true,
                        'startDate': '10-01',
                        'endDate': '10-31',
                        'order': 100,
                        'sections': [
                            {
                                'id': 'halloween-tag',
                                'enabled': true,
                                'type': 'Tag',
                                'source': 'halloween',
                                'itemLimit': 16,
                                'sortOrder': 'Random',
                                'sortOrderDirection': 'Ascending',
                                'cardFormat': 'Poster',
                                'order': 50,
                                'renderMode': 'Normal',
                                'spotlight': false,
                                'discoveryEnabled': false,
                                'searchTerm': '',
                                'includeItemTypes': [
                                    'Movie'
                                ],
                                'additionalQueryOptions': []
                            },
                            {
                                'id': 'halloween-horror',
                                'enabled': true,
                                'type': 'Genre',
                                'source': 'Horror',
                                'itemLimit': 16,
                                'sortOrder': 'Random',
                                'sortOrderDirection': 'Ascending',
                                'cardFormat': 'Poster',
                                'order': 51
                            },
                            {
                                'id': 'halloween-thriller',
                                'enabled': true,
                                'type': 'Genre',
                                'source': 'Thriller',
                                'itemLimit': 16,
                                'sortOrder': 'Random',
                                'sortOrderDirection': 'Ascending',
                                'cardFormat': 'Poster',
                                'order': 52
                            }
                        ]
                    },
                    {
                        'id': 'thanksgiving',
                        'name': 'Thanksgiving',
                        'enabled': true,
                        'startDate': '11-20',
                        'endDate': '11-30',
                        'order': 50,
                        'sections': [
                            {
                                'id': 'seasonal-2-section-0',
                                'enabled': true,
                                'type': 'Tag',
                                'source': 'thanksgiving',
                                'itemLimit': 16,
                                'sortOrder': 'Random',
                                'sortOrderDirection': 'Ascending',
                                'cardFormat': 'Poster',
                                'order': 50,
                                'renderMode': 'Spotlight',
                                'spotlight': true,
                                'discoveryEnabled': false,
                                'searchTerm': '',
                                'includeItemTypes': [
                                    'Movie'
                                ],
                                'additionalQueryOptions': []
                            },
                            {
                                'id': 'seasonal-2-section-1',
                                'enabled': true,
                                'type': 'Parent',
                                'source': '',
                                'itemLimit': 16,
                                'sortOrder': 'Random',
                                'sortOrderDirection': 'Ascending',
                                'cardFormat': 'Thumb',
                                'order': 51,
                                'renderMode': 'Normal',
                                'spotlight': false,
                                'discoveryEnabled': false,
                                'searchTerm': 'thanksgiving',
                                'includeItemTypes': [
                                    'Episode'
                                ],
                                'additionalQueryOptions': []
                            }
                        ]
                    },
                    {
                        'id': 'christmas',
                        'name': 'Christmas',
                        'enabled': true,
                        'startDate': '12-01',
                        'endDate': '12-31',
                        'order': 100,
                        'sections': [
                            {
                                'id': 'seasonal-1-section-0',
                                'enabled': true,
                                'type': 'Tag',
                                'source': 'christmas',
                                'itemLimit': 16,
                                'sortOrder': 'Random',
                                'sortOrderDirection': 'Ascending',
                                'cardFormat': 'Poster',
                                'order': 50,
                                'renderMode': 'Spotlight',
                                'spotlight': true,
                                'discoveryEnabled': false,
                                'searchTerm': '',
                                'includeItemTypes': [
                                    'Movie'
                                ],
                                'additionalQueryOptions': []
                            },
                            {
                                'id': 'seasonal-1-section-1',
                                'enabled': true,
                                'type': 'Parent',
                                'source': '',
                                'itemLimit': 16,
                                'sortOrder': 'Random',
                                'sortOrderDirection': 'Ascending',
                                'cardFormat': 'Thumb',
                                'order': 51,
                                'renderMode': 'Normal',
                                'spotlight': false,
                                'discoveryEnabled': false,
                                'searchTerm': 'christmas',
                                'includeItemTypes': [
                                    'Episode'
                                ],
                                'additionalQueryOptions': []
                            }
                        ]
                    }
                ]
            },
            'discovery': {
                'enabled': true,
                'infiniteScroll': true,
                'randomizeOrder': false,
                'minPeopleAppearances': 10,
                'minGenreMovieCount': 50,
                'spotlightDiscoveryChance': 0.5,
                'renderSpotlightAboveMatching': false,
                'defaultItemLimit': 16,
                'defaultSortOrder': 'Random',
                'defaultCardFormat': 'Poster',
                'sectionTypes': {
                    'spotlightGenre': {
                        'itemLimit': 16,
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'spotlightNetwork': {
                        'itemLimit': 16,
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'genreMovies': {
                        'itemLimit': 16,
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'studioShows': {
                        'itemLimit': 16,
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'collections': {
                        'itemLimit': 16,
                        'name': '[Collection Name]',
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true,
                        'minimumItems': 10
                    },
                    'becauseYouWatched': {
                        'itemLimit': 16,
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'becauseYouLiked': {
                        'itemLimit': 16,
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'starringTopActor': {
                        'itemLimit': 16,
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'directedByTopDirector': {
                        'itemLimit': 16,
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'writtenByTopWriter': {
                        'itemLimit': 16,
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'becauseYouRecentlyWatched': {
                        'itemLimit': 16,
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'starringActorRecentlyWatched': {
                        'itemLimit': 16,
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'directedByDirectorRecentlyWatched': {
                        'itemLimit': 16,
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'writtenByWriterRecentlyWatched': {
                        'itemLimit': 16,
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    }
                }
            },
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
