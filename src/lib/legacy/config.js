export {};

(function () {
    const protocol = window.location.protocol, host = window.location.host;
    window.KefinTweaksConfig = {
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
                    'name': 'Recently Released Movies',
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
                    'name': 'Recently Aired Episodes',
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
                    'name': 'Recently Added in Movies',
                    'cardFormat': 'Poster',
                    'order': 11
                },
                'bfd8445a64c947c9ae8a9e68bd705b4f': {
                    'enabled': true,
                    'itemLimit': 30,
                    'name': 'Recently Added in TVShows',
                    'cardFormat': 'Thumb',
                    'order': 11
                }
            },
            'trending': {
                'enabled': false,
                'itemLimit': 16,
                'name': 'Trending',
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
                'name': 'Popular TV Networks',
                'sortOrder': 'Random',
                'sortOrderDirection': 'Ascending',
                'cardFormat': 'Poster',
                'order': 61
            },
            'watchlist': {
                'enabled': true,
                'itemLimit': 16,
                'name': 'Watchlist',
                'sortOrder': 'DateAdded',
                'sortOrderDirection': 'Descending',
                'cardFormat': 'Poster',
                'order': 60
            },
            'watchAgain': {
                'enabled': true,
                'itemLimit': 16,
                'name': 'Watch Again',
                'sortOrder': 'Random',
                'sortOrderDirection': 'Ascending',
                'cardFormat': 'Poster',
                'order': 62
            },
            'upcoming': {
                'enabled': true,
                'itemLimit': 48,
                'name': 'Upcoming',
                'cardFormat': 'Thumb',
                'order': 20
            },
            'imdbTop250': {
                'enabled': true,
                'itemLimit': 16,
                'name': 'IMDb Top 250',
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
                        'name': 'Halloween',
                        'enabled': true,
                        'startDate': '10-01',
                        'endDate': '10-31',
                        'order': 100,
                        'sections': [
                            {
                                'id': 'halloween-tag',
                                'enabled': true,
                                'name': 'Halloween Movies',
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
                                'name': 'Horror Genre',
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
                                'name': 'Thriller Genre',
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
                                'name': 'Thanksgiving Movies',
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
                                'name': 'Thanksgiving Episodes',
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
                                'name': 'Christmas Movies',
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
                                'name': 'Christmas Episodes',
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
                        'name': 'Top Rated [Genre] Movies',
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'spotlightNetwork': {
                        'itemLimit': 16,
                        'name': 'Top Rated Shows from [Studio]',
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'genreMovies': {
                        'itemLimit': 16,
                        'name': '[Genre] Movies',
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'studioShows': {
                        'itemLimit': 16,
                        'name': 'Shows from [Studio]',
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
                        'name': 'Because you watched [Movie]',
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'becauseYouLiked': {
                        'itemLimit': 16,
                        'name': 'Because you liked [Movie]',
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'starringTopActor': {
                        'itemLimit': 16,
                        'name': 'Starring [Actor]',
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'directedByTopDirector': {
                        'itemLimit': 16,
                        'name': 'Directed by [Director]',
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'writtenByTopWriter': {
                        'itemLimit': 16,
                        'name': 'Written by [Writer]',
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'becauseYouRecentlyWatched': {
                        'itemLimit': 16,
                        'name': 'Because you recently watched [Movie]',
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'starringActorRecentlyWatched': {
                        'itemLimit': 16,
                        'name': 'Starring [Actor] because you recently watched [Movie]',
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'directedByDirectorRecentlyWatched': {
                        'itemLimit': 16,
                        'name': 'Directed by [Director] because you recently watched [Movie]',
                        'cardFormat': 'Poster',
                        'order': 100,
                        'isPlayed': null,
                        'enabled': true
                    },
                    'writtenByWriterRecentlyWatched': {
                        'itemLimit': 16,
                        'name': 'Written by [Writer] because you recently watched [Movie]',
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
    localStorage.setItem('KefinTweaksConfig', JSON.stringify(window.KefinTweaksConfig));
})();
    