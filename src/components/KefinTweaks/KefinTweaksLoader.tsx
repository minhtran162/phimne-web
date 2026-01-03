import React, { useEffect, useRef } from 'react';
import browser from '../../scripts/browser';

// Declare global types for KefinTweaks
declare global {
    interface Window {
        KefinTweaksConfig?: any;
        KefinTweaks?: any;
        Emby?: any;
        LocalStorageCache?: any;
        ModalSystem?: any;
        JellyfinEnhanced?: any;
    }
}

// Jellyfin Enhanced Scripts
const JE_SCRIPTS = [
    'splashscreen.js',
    'enhanced/helpers.js',
    'enhanced/config.js',
    'enhanced/themer.js',
    'enhanced/subtitles.js',
    'enhanced/ui.js',
    'enhanced/playback.js',
    'enhanced/features.js',
    'enhanced/events.js',
    'enhanced/osd-rating.js',
    'migrate.js',
    'elsewhere.js',
    'jellyseerr/api.js',
    'jellyseerr/modal.js',
    'jellyseerr/more-info-modal.js',
    'jellyseerr/ui.js',
    'jellyseerr/issue-reporter.js',
    'jellyseerr/item-details.js',
    'jellyseerr/jellyseerr.js',
    'pausescreen.js',
    'reviews.js',
    'qualitytags.js',
    'genretags.js',
    'languagetags.js',
    'ratingtags.js',
    'arr-links.js',
    'arr-tag-links.js',
    'letterboxd-links.js'
];

const jeScriptImports: Record<string, () => Promise<any>> = {
    // @ts-ignore
    'splashscreen.js': () => import('../../lib/legacy/JellyfinEnhanced/splashscreen.js'),
    // @ts-ignore
    'enhanced/helpers.js': () => import('../../lib/legacy/JellyfinEnhanced/enhanced/helpers.js'),
    // @ts-ignore
    'enhanced/config.js': () => import('../../lib/legacy/JellyfinEnhanced/enhanced/config.js'),
    // @ts-ignore
    'enhanced/themer.js': () => import('../../lib/legacy/JellyfinEnhanced/enhanced/themer.js'),
    // @ts-ignore
    'enhanced/subtitles.js': () => import('../../lib/legacy/JellyfinEnhanced/enhanced/subtitles.js'),
    // @ts-ignore
    'enhanced/ui.js': () => import('../../lib/legacy/JellyfinEnhanced/enhanced/ui.js'),
    // @ts-ignore
    'enhanced/playback.js': () => import('../../lib/legacy/JellyfinEnhanced/enhanced/playback.js'),
    // @ts-ignore
    'enhanced/features.js': () => import('../../lib/legacy/JellyfinEnhanced/enhanced/features.js'),
    // @ts-ignore
    'enhanced/events.js': () => import('../../lib/legacy/JellyfinEnhanced/enhanced/events.js'),
    // @ts-ignore
    'enhanced/osd-rating.js': () => import('../../lib/legacy/JellyfinEnhanced/enhanced/osd-rating.js'),
    // @ts-ignore
    'migrate.js': () => import('../../lib/legacy/JellyfinEnhanced/migrate.js'),
    // @ts-ignore
    'elsewhere.js': () => import('../../lib/legacy/JellyfinEnhanced/elsewhere.js'),
    // @ts-ignore
    'jellyseerr/api.js': () => import('../../lib/legacy/JellyfinEnhanced/jellyseerr/api.js'),
    // @ts-ignore
    'jellyseerr/modal.js': () => import('../../lib/legacy/JellyfinEnhanced/jellyseerr/modal.js'),
    // @ts-ignore
    'jellyseerr/more-info-modal.js': () => import('../../lib/legacy/JellyfinEnhanced/jellyseerr/more-info-modal.js'),
    // @ts-ignore
    'jellyseerr/ui.js': () => import('../../lib/legacy/JellyfinEnhanced/jellyseerr/ui.js'),
    // @ts-ignore
    'jellyseerr/issue-reporter.js': () => import('../../lib/legacy/JellyfinEnhanced/jellyseerr/issue-reporter.js'),
    // @ts-ignore
    'jellyseerr/item-details.js': () => import('../../lib/legacy/JellyfinEnhanced/jellyseerr/item-details.js'),
    // @ts-ignore
    'jellyseerr/jellyseerr.js': () => import('../../lib/legacy/JellyfinEnhanced/jellyseerr/jellyseerr.js'),
    // @ts-ignore
    'pausescreen.js': () => import('../../lib/legacy/JellyfinEnhanced/pausescreen.js'),
    // @ts-ignore
    'reviews.js': () => import('../../lib/legacy/JellyfinEnhanced/reviews.js'),
    // @ts-ignore
    'qualitytags.js': () => import('../../lib/legacy/JellyfinEnhanced/qualitytags.js'),
    // @ts-ignore
    'genretags.js': () => import('../../lib/legacy/JellyfinEnhanced/genretags.js'),
    // @ts-ignore
    'languagetags.js': () => import('../../lib/legacy/JellyfinEnhanced/languagetags.js'),
    // @ts-ignore
    'ratingtags.js': () => import('../../lib/legacy/JellyfinEnhanced/ratingtags.js'),
    // @ts-ignore
    'arr-links.js': () => import('../../lib/legacy/JellyfinEnhanced/arr-links.js'),
    // @ts-ignore
    'arr-tag-links.js': () => import('../../lib/legacy/JellyfinEnhanced/arr-tag-links.js'),
    // @ts-ignore
    'letterboxd-links.js': () => import('../../lib/legacy/JellyfinEnhanced/letterboxd-links.js'),
};

// Configuration defaults
const DEFAULT_ENABLED_SCRIPTS: Record<string, boolean> = {
    watchlist: true,
    homeScreen: true,
    search: true,
    headerTabs: true,
    customMenuLinks: true,
    exclusiveElsewhere: true,
    updoot: false,
    backdropLeakFix: true,
    dashboardButtonFix: true,
    infiniteScroll: true,
    removeContinue: true,
    subtitleSearch: true,
    playlist: true,
    itemDetailsCollections: true,
    flattenSingleSeasonShows: true,
    seriesInfo: true,
    collections: true,
    skinManager: browser.tizen ? false : true,
    settings: true,
};

const DEFAULT_ENABLED_JELLYFIN_ENHANCED_SETTINGS = {
    "autoPauseEnabled": true,
    "autoResumeEnabled": false,
    "autoPipEnabled": false,
    "autoSkipIntro": false,
    "autoSkipOutro": false,
    "selectedStylePresetIndex": 1,
    "selectedFontSizePresetIndex": 5,
    "selectedFontFamilyPresetIndex": 0,
    "disableCustomSubtitleStyles": false,
    "randomButtonEnabled": false,
    "randomIncludeMovies": true,
    "randomIncludeShows": true,
    "randomUnwatchedOnly": false,
    "showWatchProgress": true,
    "showFileSizes": true,
    "showAudioLanguages": true,
    "removeContinueWatchingEnabled": false,
    "pauseScreenEnabled": true,
    "qualityTagsEnabled": false,
    "genreTagsEnabled": false,
    "languageTagsEnabled": false,
    "ratingTagsEnabled": false,
    "qualityTagsPosition": "top-left",
    "genreTagsPosition": "top-right",
    "languageTagsPosition": "bottom-left",
    "ratingTagsPosition": "bottom-right",
    "showRatingInPlayer": true,
    "reviewsExpandedByDefault": false,
    "disableAllShortcuts": false,
    "longPress2xEnabled": false,
    "lastOpenedTab": "settings",
    "Shortcuts": [
        {
            "Name": "OpenSearch",
            "Key": "/",
            "Label": "Open Search",
            "Category": "Global"
        },
        {
            "Name": "GoToHome",
            "Key": "Shift+H",
            "Label": "Go to Home",
            "Category": "Global"
        },
        {
            "Name": "GoToDashboard",
            "Key": "D",
            "Label": "Go to Dashboard",
            "Category": "Global"
        },
        {
            "Name": "QuickConnect",
            "Key": "Q",
            "Label": "Quick Connect",
            "Category": "Global"
        },
        {
            "Name": "PlayRandomItem",
            "Key": "R",
            "Label": "Play Random Item",
            "Category": "Global"
        },
        {
            "Name": "ClearAllBookmarks",
            "Key": "Ctrl+Shift+B",
            "Label": "Clear All Bookmarks",
            "Category": "Global"
        },
        {
            "Name": "CycleAspectRatio",
            "Key": "A",
            "Label": "Cycle Aspect Ratio",
            "Category": "Player"
        },
        {
            "Name": "ShowPlaybackInfo",
            "Key": "I",
            "Label": "Show Playback Info",
            "Category": "Player"
        },
        {
            "Name": "SubtitleMenu",
            "Key": "S",
            "Label": "Subtitle Menu",
            "Category": "Player"
        },
        {
            "Name": "CycleSubtitleTracks",
            "Key": "C",
            "Label": "Cycle Subtitle Tracks",
            "Category": "Player"
        },
        {
            "Name": "CycleAudioTracks",
            "Key": "V",
            "Label": "Cycle Audio Tracks",
            "Category": "Player"
        },
        {
            "Name": "IncreasePlaybackSpeed",
            "Key": "+",
            "Label": "Increase Playback Speed",
            "Category": "Player"
        },
        {
            "Name": "DecreasePlaybackSpeed",
            "Key": "-",
            "Label": "Decrease Playback Speed",
            "Category": "Player"
        },
        {
            "Name": "ResetPlaybackSpeed",
            "Key": "R",
            "Label": "Reset Playback Speed",
            "Category": "Player"
        },
        {
            "Name": "BookmarkCurrentTime",
            "Key": "B",
            "Label": "Bookmark Current Time",
            "Category": "Player"
        },
        {
            "Name": "GoToSavedBookmark",
            "Key": "Shift+B",
            "Label": "Go to Saved Bookmark",
            "Category": "Player"
        },
        {
            "Name": "OpenEpisodePreview",
            "Key": "P",
            "Label": "Open Episode Preview",
            "Category": "Player"
        }
    ],

    "ToastDuration": 1500,
    "HelpPanelAutocloseDelay": 15000,
    "EnableCustomSplashScreen": false,
    "SplashScreenImageUrl": "",
    "ElsewhereEnabled": false,
    "DEFAULT_REGION": "US",
    "DEFAULT_PROVIDERS": "",
    "IGNORE_PROVIDERS": "",
    "ElsewhereCustomBrandingText": "",
    "ElsewhereCustomBrandingImageUrl": "",

};

interface ScriptDefinition {
    name: string;
    script: string;
    css: string | null;
    dependencies: string[];
    priority?: boolean;
    description: string;
}

// Script definitions from injector.js
const SCRIPT_DEFINITIONS: ScriptDefinition[] = [
    {
        name: 'utils',
        script: 'utils.js',
        css: null,
        dependencies: [],
        description: 'Common utilities for page view management and MutationObserver conversion'
    },
    {
        name: 'settings',
        script: 'settings.js',
        css: null,
        dependencies: ['utils'],
        description: 'KefinTweaks Settings UI'
    },
    {
        name: 'skinConfigLegacyDefaults',
        script: 'skinConfig-0.3.5-defaults.js',
        css: null,
        dependencies: [],
        description: 'Legacy skin defaults (v0.3.5) for duplicate detection'
    },
    {
        name: 'skinConfig',
        script: 'skinConfig.js',
        css: null,
        dependencies: [],
        description: 'Default skin configuration for KefinTweaks'
    },
    {
        name: 'skinManager',
        script: 'skinManager.js',
        css: 'defaultSkin.css',
        dependencies: ['utils', 'skinConfigLegacyDefaults', 'skinConfig', 'modal'],
        priority: true,
        description: 'Adds skin selection dropdown to display preferences page and manages skin CSS loading'
    },
    {
        name: 'apiHelper',
        script: 'apiHelper.js',
        css: null,
        dependencies: [],
        description: 'API helper functions for common Jellyfin operations'
    },
    {
        name: 'cardBuilder',
        script: 'cardBuilder.js',
        css: 'cardBuilder.css',
        dependencies: ['apiHelper'],
        description: 'Core card building functionality (required by other scripts)'
    },
    {
        name: 'localStorageCache',
        script: 'localStorageCache.js',
        css: null,
        dependencies: [],
        description: 'localStorage-based caching layer with 24-hour TTL and manual refresh'
    },
    {
        name: 'indexedDBCache',
        script: 'indexedDBCache.js',
        css: null,
        dependencies: [],
        description: 'IndexedDB-based caching layer for large datasets with TTL support'
    },
    {
        name: 'modal',
        script: 'modal.js',
        css: 'modal.css',
        dependencies: [],
        description: 'Generic modal system for Jellyfin-style dialogs'
    },
    {
        name: 'toaster',
        script: 'toaster.js',
        css: null,
        dependencies: [],
        description: 'Toast notification system using Jellyfin\'s existing toast functionality'
    },
    {
        name: 'watchlistTabInjector',
        script: 'watchlistTabInjector.js',
        css: null,
        dependencies: ['utils'],
        description: 'Injects Watchlist tab into home screen (replaces Custom Tabs plugin)'
    },
    {
        name: 'watchlist',
        script: 'watchlist.js',
        css: 'watchlist.css',
        dependencies: ['cardBuilder', 'localStorageCache', 'modal', 'utils', 'watchlistTabInjector'],
        description: 'Adds watchlist functionality throughout Jellyfin interface'
    },
    {
        name: 'homeScreen',
        script: 'homeScreen.js',
        css: 'homeScreen.css',
        dependencies: ['cardBuilder', 'localStorageCache', 'utils'],
        description: 'Adds custom home screen sections'
    },
    {
        name: 'search',
        script: 'search.js',
        css: 'search.css',
        dependencies: ['cardBuilder', 'utils'],
        description: 'Enhanced search functionality'
    },
    {
        name: 'headerTabs',
        script: 'headerTabs.js',
        css: null,
        dependencies: [],
        description: 'Header tab improvements'
    },
    {
        name: 'customMenuLinks',
        script: 'customMenuLinks.js',
        css: null,
        dependencies: ['utils'],
        description: 'Load and add custom menu links from configuration'
    },
    {
        name: 'exclusiveElsewhere',
        script: 'exclusiveElsewhere.js',
        css: null,
        dependencies: [],
        description: 'Modifies the behavior of the Jellyfin Enhanced Elsewhere functionality to add custom branding when items are not available on streaming services'
    },
    {
        name: 'backdropLeakFix',
        script: 'backdropLeakFix.js',
        css: null,
        dependencies: [],
        description: 'Fixes issue that causes backdrop images to be continuously added to the page if the tab isn\'t focused.'
    },
    {
        name: 'updoot',
        script: 'updoot.js',
        css: null,
        dependencies: [],
        description: 'Upvote functionality provided by https://github.com/BobHasNoSoul/jellyfin-updoot'
    },
    {
        name: 'dashboardButtonFix',
        script: 'dashboardButtonFix.js',
        css: null,
        dependencies: [],
        description: 'Fixes the dashboard button to redirect to the home page when the back button is clicked and there is no history to go back to'
    },
    {
        name: 'infiniteScroll',
        script: 'infiniteScroll.js',
        css: null,
        dependencies: ['cardBuilder'],
        description: 'Adds infinite scroll functionality to media library pages'
    },
    {
        name: 'removeContinue',
        script: 'removeContinue.js',
        css: null,
        dependencies: [],
        description: 'Adds remove from continue watching functionality to cards with data-position-ticks'
    },
    {
        name: 'subtitleSearch',
        script: 'subtitleSearch.js',
        css: 'subtitleSearch.css',
        dependencies: ['toaster'],
        description: 'Adds subtitle search functionality to the video OSD, allowing users to search and download subtitles from remote sources'
    },
    {
        name: 'breadcrumbs',
        script: 'breadcrumbs.js',
        css: 'breadcrumbNav.css',
        dependencies: ['utils'],
        description: 'Adds breadcrumb navigation to item detail pages for Movies, Series, Seasons, Episodes, Music Artists, and Music Albums'
    },
    {
        name: 'playlist',
        script: 'playlist.js',
        css: null,
        dependencies: ['cardBuilder', 'utils', 'modal'],
        description: 'Modifies playlist view page behavior to navigate to item details instead of playing, adds play button to playlist items, and adds sorting functionality'
    },
    {
        name: 'itemDetailsCollections',
        script: 'itemDetailsCollections.js',
        css: null,
        dependencies: ['indexedDBCache', 'utils', 'cardBuilder'],
        description: 'Adds related collections to item details pages showing which collections contain the current item'
    },
    {
        name: 'flattenSingleSeasonShows',
        script: 'seriesEpisodes.js', // Note: name mismatch in definition vs file, using definition name as key, file as value
        css: 'seriesEpisodes.css',
        dependencies: ['cardBuilder', 'utils'],
        description: 'Displays episodes directly on series page with season selection. Works for both single and multi-season shows when enabled.'
    },
    {
        name: 'seriesInfo',
        script: 'seriesInfo.js',
        css: null,
        dependencies: ['utils'],
        description: 'Adds series and season information (seasons count, episodes count, end time) to details pages'
    },
    {
        name: 'collections',
        script: 'collections.js',
        css: null,
        dependencies: ['utils', 'modal'],
        description: 'Adds sorting functionality to collection pages'
    }
];

// Map for script imports
const scriptImports: Record<string, () => Promise<any>> = {
    // @ts-ignore
    'utils': () => import('../../lib/legacy/scripts/utils.js'),
    // @ts-ignore
    'settings': () => import('../../lib/legacy/scripts/settings.js'),
    // @ts-ignore
    'skinConfigLegacyDefaults': () => import('../../lib/legacy/scripts/skinConfig-0.3.5-defaults.js'),
    // @ts-ignore
    'skinConfig': () => import('../../lib/legacy/scripts/skinConfig.js'),
    // @ts-ignore
    'skinManager': () => import('../../lib/legacy/scripts/skinManager.js'),
    // @ts-ignore
    'apiHelper': () => import('../../lib/legacy/scripts/apiHelper.js'),
    // @ts-ignore
    'cardBuilder': () => import('../../lib/legacy/scripts/cardBuilder.js'),
    // @ts-ignore
    'localStorageCache': () => import('../../lib/legacy/scripts/localStorageCache.js'),
    // @ts-ignore
    'indexedDBCache': () => import('../../lib/legacy/scripts/indexedDBCache.js'),
    // @ts-ignore
    'modal': () => import('../../lib/legacy/scripts/modal.js'),
    // @ts-ignore
    'toaster': () => import('../../lib/legacy/scripts/toaster.js'),
    // @ts-ignore
    'watchlistTabInjector': () => import('../../lib/legacy/scripts/watchlistTabInjector.js'),
    // @ts-ignore
    'watchlist': () => import('../../lib/legacy/scripts/watchlist.js'),
    // @ts-ignore
    'homeScreen': () => import('../../lib/legacy/scripts/homeScreen.js'),
    // @ts-ignore
    'search': () => import('../../lib/legacy/scripts/search.js'),
    // @ts-ignore
    'headerTabs': () => import('../../lib/legacy/scripts/headerTabs.js'),
    // @ts-ignore
    'customMenuLinks': () => import('../../lib/legacy/scripts/customMenuLinks.js'),
    // @ts-ignore
    'exclusiveElsewhere': () => import('../../lib/legacy/scripts/exclusiveElsewhere.js'),
    // @ts-ignore
    'backdropLeakFix': () => import('../../lib/legacy/scripts/backdropLeakFix.js'),
    // @ts-ignore
    'updoot': () => import('../../lib/legacy/scripts/updoot.js'),
    // @ts-ignore
    'dashboardButtonFix': () => import('../../lib/legacy/scripts/dashboardButtonFix.js'),
    // @ts-ignore
    'infiniteScroll': () => import('../../lib/legacy/scripts/infiniteScroll.js'),
    // @ts-ignore
    'removeContinue': () => import('../../lib/legacy/scripts/removeContinue.js'),
    // @ts-ignore
    'subtitleSearch': () => import('../../lib/legacy/scripts/subtitleSearch.js'),
    // @ts-ignore
    'breadcrumbs': () => import('../../lib/legacy/scripts/breadcrumbs.js'),
    // @ts-ignore
    'playlist': () => import('../../lib/legacy/scripts/playlist.js'),
    // @ts-ignore
    'itemDetailsCollections': () => import('../../lib/legacy/scripts/itemDetailsCollections.js'),
    // @ts-ignore
    'flattenSingleSeasonShows': () => import('../../lib/legacy/scripts/seriesEpisodes.js'),
    // @ts-ignore
    'seriesInfo': () => import('../../lib/legacy/scripts/seriesInfo.js'),
    // @ts-ignore
    'collections': () => import('../../lib/legacy/scripts/collections.js'),
};

// Map for CSS imports
const cssImports: Record<string, () => Promise<any>> = {
    // @ts-ignore
    'defaultSkin.css': () => import('../../assets/jellyfintweaks/scripts/defaultSkin.css'),
    // @ts-ignore
    'cardBuilder.css': () => import('../../assets/jellyfintweaks/scripts/cardBuilder.css'),
    // @ts-ignore
    'modal.css': () => import('../../assets/jellyfintweaks/scripts/modal.css'),
    // @ts-ignore
    'watchlist.css': () => import('../../assets/jellyfintweaks/scripts/watchlist.css'),
    // @ts-ignore
    'homeScreen.css': () => import('../../assets/jellyfintweaks/scripts/homeScreen.css'),
    // @ts-ignore
    'search.css': () => import('../../assets/jellyfintweaks/scripts/search.css'),
    // @ts-ignore
    'subtitleSearch.css': () => import('../../assets/jellyfintweaks/scripts/subtitleSearch.css'),
    // @ts-ignore
    'breadcrumbNav.css': () => import('../../assets/jellyfintweaks/scripts/breadcrumbNav.css'),
    // @ts-ignore
    'seriesEpisodes.css': () => import('../../assets/jellyfintweaks/scripts/seriesEpisodes.css'),
};

// Jellyfin Enhanced Logic
const jeHelpers = {
    toCamelCase: (obj: any): any => {
        if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
            return obj;
        }
        const camelCased: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
                camelCased[camelKey] = jeHelpers.toCamelCase(obj[key]);
            }
        }
        return camelCased;
    },
    injectMetadataIcons: (enabled: boolean) => {
        const existing = document.getElementById('metadataIconsCss');
        if (enabled && !existing) {
            const link = document.createElement('link');
            link.id = 'metadataIconsCss';
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/gh/Druidblack/jellyfin-icon-metadata/public-icon.css';
            document.head.appendChild(link);
        } else if (!enabled && existing) {
            existing.remove();
        }
    }
};

const initializeJellyfinEnhanced = async () => {
    const ApiClient = (window as any).ApiClient;
    if (!ApiClient) {
        console.warn('[KefinTweaks Component] ApiClient not found, retrying initialization of Jellyfin Enhanced later...');
        setTimeout(initializeJellyfinEnhanced, 500);
        return;
    }

    console.log('[KefinTweaks Component] Initializing Jellyfin Enhanced...');

    // 1. Setup global namespace
    if (!window.JellyfinEnhanced) {
        window.JellyfinEnhanced = {
            pluginConfig: {},
            userConfig: { settings: {}, shortcuts: { Shortcuts: [] }, bookmarks: { Bookmarks: {} }, elsewhere: {} },
            translations: {},
            pluginVersion: 'unknown',
            state: {
                activeShortcuts: {},
                currentContextItemId: null,
                isContinueWatchingContext: false,
                skipToastShown: false,
                pauseScreenClickTimer: null
            },
            _cacheManager: {
                callbacks: new Set(),
                dirty: false,
                scheduleId: null as any,
                register(saveCallback: any) { this.callbacks.add(saveCallback); },
                unregister(saveCallback: any) { this.callbacks.delete(saveCallback); },
                markDirty() {
                    this.dirty = true;
                    if (!this.scheduleId) {
                        if (typeof requestIdleCallback !== 'undefined') {
                            this.scheduleId = requestIdleCallback(() => this._flush(), { timeout: 5000 });
                        } else {
                            this.scheduleId = setTimeout(() => this._flush(), 1000);
                        }
                    }
                },
                _flush() {
                    if (this.dirty) {
                        this.callbacks.forEach((cb: any) => { try { cb(); } catch (e) { console.error('Cache save error:', e); } });
                        this.dirty = false;
                    }
                    this.scheduleId = null;
                },
                forceSave() { this.dirty = true; this._flush(); }
            },
            t: (key: string, params: any = {}) => {
                const translations = window.JellyfinEnhanced?.translations || {};
                let text = translations[key] || key;
                if (params) {
                    for (const [param, value] of Object.entries(params)) {
                        text = text.replace(new RegExp(`{${param}}`, 'g'), value as string);
                    }
                }
                return text;
            },
            loadSettings: () => { console.warn("🪼 Jellyfin Enhanced: loadSettings called before config.js loaded"); return {}; },
            initializeShortcuts: () => { console.warn("🪼 Jellyfin Enhanced: initializeShortcuts called before config.js loaded"); },
            saveUserSettings: async (fileName: string) => { console.warn(`🪼 Jellyfin Enhanced: saveUserSettings(${fileName}) called before config.js loaded`); }
        };
    }

    const JE = window.JellyfinEnhanced;

    // Load Translations Logic
    const loadTranslations = async () => {
        const CACHE_DURATION = 24 * 60 * 60 * 1000;
        const protocol = window.location.protocol;
        const host = window.location.host;
        const baseUrl = `${protocol}//${host}/${protocol === 'https:' ? 'web/' : ''}assets/`;

        try {
            let pluginVersion = JE.pluginVersion;
            if (!pluginVersion || pluginVersion === 'unknown') {
                try {
                    const versionResponse = await fetch(ApiClient.getUrl('/JellyfinEnhanced/version'));
                    if (versionResponse.ok) {
                        pluginVersion = await versionResponse.text();
                        JE.pluginVersion = pluginVersion;
                    }
                } catch (e) {
                    pluginVersion = 'unknown';
                }
            }

            let user = ApiClient.getCurrentUser ? ApiClient.getCurrentUser() : null;
            if (user instanceof Promise) user = await user;
            const userId = user?.Id;
            let lang = 'en';

            if (userId) {
                const storageKey = `${userId}-language`;
                const storedLang = localStorage.getItem(storageKey);
                if (storedLang) lang = storedLang.split('-')[0];
            }

            // Clean old cache
            try {
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith('JE_translation_') || key.startsWith('JE_translation_ts_'))) {
                        if (!key.includes(`_${pluginVersion}`)) localStorage.removeItem(key);
                    }
                }
            } catch (e) { }

            const cacheKey = `JE_translation_${lang}_${pluginVersion}`;
            const timestampKey = `JE_translation_ts_${lang}_${pluginVersion}`;
            const cachedTranslations = localStorage.getItem(cacheKey);
            const cachedTimestamp = localStorage.getItem(timestampKey);

            if (cachedTranslations && cachedTimestamp) {
                const age = Date.now() - parseInt(cachedTimestamp, 10);
                if (age < CACHE_DURATION) {
                    try { return JSON.parse(cachedTranslations); } catch (e) { }
                }
            }

            // Local fetch
            try {
                const response = await fetch(baseUrl.concat(`locales/${lang}.json`));
                if (response.ok) return await response.json();
            } catch (e) { }

            return {};
        } catch (error) {
            console.error('Failed to load translations', error);
            return {};
        }
    };

    // Load Plugin Data
    const loadPluginData = async () => {
        // Use local defaults instead of loading from server
        const versionPromise = ApiClient.ajax({ type: 'GET', url: ApiClient.getUrl('/JellyfinEnhanced/version'), dataType: 'text' }).catch(() => 'unknown');
        return Promise.all([Promise.resolve(DEFAULT_ENABLED_JELLYFIN_ENHANCED_SETTINGS), versionPromise]);
    };

    const loadPrivateConfig = async () => {
        try {
            const privateConfig = await ApiClient.ajax({ type: 'GET', url: ApiClient.getUrl('/JellyfinEnhanced/private-config'), dataType: 'json' });
            Object.assign(JE.pluginConfig, privateConfig);
        } catch (error) { }
    };

    try {
        // Stage 1
        const [[config, version], translations] = await Promise.all([loadPluginData(), loadTranslations()]);
        JE.pluginConfig = config && typeof config === 'object' ? config : {};
        JE.pluginVersion = version || 'unknown';
        JE.translations = translations || {};
        JE.t = window.JellyfinEnhanced.t;
        await loadPrivateConfig();

        jeHelpers.injectMetadataIcons(!!JE.pluginConfig?.MetadataIconsEnabled);

        // Stage 2: User Settings
        const userId = ApiClient.getCurrentUserId();
        if (userId) {
            const fetchPromises = [
                ApiClient.ajax({ type: 'GET', url: ApiClient.getUrl(`/JellyfinEnhanced/user-settings/${userId}/settings.json`), dataType: 'json' }).catch((e: any) => ({ name: 'settings', status: 'rejected' })),
                ApiClient.ajax({ type: 'GET', url: ApiClient.getUrl(`/JellyfinEnhanced/user-settings/${userId}/shortcuts.json`), dataType: 'json' }).catch((e: any) => ({ name: 'shortcuts', status: 'rejected' })),
                ApiClient.ajax({ type: 'GET', url: ApiClient.getUrl(`/JellyfinEnhanced/user-settings/${userId}/bookmarks.json`), dataType: 'json' }).catch((e: any) => ({ name: 'bookmarks', status: 'rejected' })),
                ApiClient.ajax({ type: 'GET', url: ApiClient.getUrl(`/JellyfinEnhanced/user-settings/${userId}/elsewhere.json`), dataType: 'json' }).catch((e: any) => ({ name: 'elsewhere', status: 'rejected' }))
            ];

            await Promise.all(fetchPromises);

            // Initialize with default settings, then merge with loaded settings
            JE.userConfig = {
                settings: { Settings: {} },
                shortcuts: { Shortcuts: [] },
                bookmarks: { Bookmarks: {} },
                elsewhere: { Elsewhere: {} }
            };
        }

        // Initialize Splash Screen (early load via scriptImports)
        if (jeScriptImports['splashscreen.js']) await jeScriptImports['splashscreen.js']();
        if (typeof JE.initializeSplashScreen === 'function') JE.initializeSplashScreen();

        // Stage 3: Load ALL component scripts
        console.log('[KefinTweaks Component] Loading Jellyfin Enhanced scripts...');

        // We need to load them sequentially or parallel? Plugin.js used Promise.allSettled but effectively parallel.
        // Dynamic imports are promises.

        const loadScript = async (name: string) => {
            if (jeScriptImports[name]) {
                try {
                    await jeScriptImports[name]();
                } catch (e) {
                    console.error(`Failed to load JE script: ${name}`, e);
                }
            }
        };

        // Filter out splashscreen as we loaded it
        const scriptsToLoad = JE_SCRIPTS.filter(s => s !== 'splashscreen.js');
        await Promise.all(scriptsToLoad.map(loadScript));

        console.log('[KefinTweaks Component] JE Scripts loaded.');

        // Stage 4: Init core settings
        if (typeof JE.loadSettings === 'function') JE.currentSettings = JE.loadSettings();
        if (typeof JE.initializeShortcuts === 'function') JE.initializeShortcuts();

        // Stage 5: Themer
        if (typeof JE.themer?.init === 'function') JE.themer.init();

        window.addEventListener('beforeunload', () => {
            JE._cacheManager.forceSave();
        });

        // Stage 6: Init features
        if (typeof JE.initializeEnhancedScript === 'function') JE.initializeEnhancedScript();
        if (typeof JE.initializeMigration === 'function') JE.initializeMigration();
        if (typeof JE.initializeElsewhereScript === 'function' && JE.pluginConfig?.ElsewhereEnabled) JE.initializeElsewhereScript();
        if (typeof JE.initializeJellyseerrScript === 'function' && JE.pluginConfig?.JellyseerrEnabled) JE.initializeJellyseerrScript();
        if (typeof JE.jellyseerrIssueReporter?.initialize === 'function' && JE.pluginConfig?.JellyseerrEnabled) JE.jellyseerrIssueReporter.initialize();
        if (typeof JE.initializePauseScreen === 'function') JE.initializePauseScreen();
        if (typeof JE.initializeQualityTags === 'function' && JE.currentSettings?.qualityTagsEnabled) JE.initializeQualityTags();
        if (typeof JE.initializeGenreTags === 'function' && JE.currentSettings?.genreTagsEnabled) JE.initializeGenreTags();
        if (typeof JE.initializeRatingTags === 'function' && JE.currentSettings?.ratingTagsEnabled) JE.initializeRatingTags();
        if (typeof JE.initializeArrLinksScript === 'function' && JE.pluginConfig?.ArrLinksEnabled) JE.initializeArrLinksScript();
        if (typeof JE.initializeArrTagLinksScript === 'function' && JE.pluginConfig?.ArrTagsShowAsLinks) JE.initializeArrTagLinksScript();
        if (typeof JE.initializeLetterboxdLinksScript === 'function' && JE.pluginConfig?.LetterboxdEnabled) JE.initializeLetterboxdLinksScript();
        if (typeof JE.initializeReviewsScript === 'function' && JE.pluginConfig?.ShowReviews) JE.initializeReviewsScript();
        if (typeof JE.initializeLanguageTags === 'function' && JE.currentSettings?.languageTagsEnabled) JE.initializeLanguageTags();
        if (typeof JE.initializeOsdRating === 'function') JE.initializeOsdRating();

        if (typeof JE.hideSplashScreen === 'function') JE.hideSplashScreen();

        console.log('[KefinTweaks Component] Jellyfin Enhanced initialized successfully.');

    } catch (error) {
        console.error('Jellyfin Enhanced initialization failed', error);
        if (typeof JE.hideSplashScreen === 'function') JE.hideSplashScreen();
    }
};

const KefinTweaksLoader: React.FC = () => {
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const init = async () => {
            console.log('[KefinTweaks Component] Initializing...');

            // Initialize Jellyfin Enhanced
            initializeJellyfinEnhanced();

            // Load configuration from localStorage
            const storedFullConfig = localStorage.getItem('KefinTweaksConfig');
            let enabledScriptsMap: Record<string, boolean> = { ...DEFAULT_ENABLED_SCRIPTS };

            if (storedFullConfig) {
                try {
                    const config = JSON.parse(storedFullConfig);
                    // Ensure global config is set for legacy scripts
                    window.KefinTweaksConfig = config;

                    if (config.scripts) {
                        enabledScriptsMap = { ...enabledScriptsMap, ...config.scripts };
                    }
                } catch (e) {
                    console.error('Error parsing KefinTweaksConfig from localStorage', e);
                }
            }

            // Auto-enable dependencies
            let hasChanges = true;
            let iterations = 0;
            const maxIterations = 10;

            while (hasChanges && iterations < maxIterations) {
                hasChanges = false;
                SCRIPT_DEFINITIONS.forEach(script => {
                    if (enabledScriptsMap[script.name]) {
                        script.dependencies.forEach(dep => {
                            if (!enabledScriptsMap[dep]) {
                                enabledScriptsMap[dep] = true;
                                hasChanges = true;
                            }
                        });
                    }
                });
                iterations++;
            }

            // Collect enabled scripts
            const enabledScripts = SCRIPT_DEFINITIONS.filter(script => enabledScriptsMap[script.name]);

            // Expose definitions for settings UI
            if (!window.KefinTweaks) {
                window.KefinTweaks = {};
            }
            window.KefinTweaks.ScriptDefinitions = SCRIPT_DEFINITIONS;

            // Helper to collect dependencies
            const collectDependencies = (script: ScriptDefinition, collected = new Set<string>(), visited = new Set<string>()) => {
                if (visited.has(script.name)) return collected;
                visited.add(script.name);

                script.dependencies.forEach(depName => {
                    if (!enabledScriptsMap[depName]) return;
                    const depScript = SCRIPT_DEFINITIONS.find(s => s.name === depName);
                    if (depScript) {
                        if (!collected.has(depName)) {
                            collected.add(depName);
                            collectDependencies(depScript, collected, visited);
                        }
                    }
                });
                return collected;
            };

            const allDependencyNames = new Set<string>();
            for (const script of enabledScripts) {
                const deps = collectDependencies(script);
                deps.forEach(d => allDependencyNames.add(d));
            }

            const dependencyScripts = SCRIPT_DEFINITIONS.filter(script =>
                allDependencyNames.has(script.name) && enabledScriptsMap[script.name]
            );

            const nonDependencyScripts = enabledScripts.filter(script =>
                !allDependencyNames.has(script.name)
            );

            const priorityScripts = nonDependencyScripts.filter(script => script.priority === true);
            const regularScripts = nonDependencyScripts.filter(script => !script.priority);

            const loadScript = async (scriptDef: ScriptDefinition) => {
                try {
                    // Load CSS
                    if (scriptDef.css && cssImports[scriptDef.css]) {
                        await cssImports[scriptDef.css]();
                    }

                    // Load JS
                    if (scriptImports[scriptDef.name]) {
                        await scriptImports[scriptDef.name]();
                        console.log(`[KefinTweaks Component] Loaded ${scriptDef.name}`);
                    } else {
                        console.warn(`[KefinTweaks Component] No import found for ${scriptDef.name}`);
                    }
                } catch (err) {
                    console.error(`[KefinTweaks Component] Failed to load ${scriptDef.name}`, err);
                }
            };

            // Load in order
            // 1. Dependencies
            await Promise.all(dependencyScripts.map(loadScript));

            // 2. Priority
            await Promise.all(priorityScripts.map(loadScript));

            // 3. Regular
            await Promise.all(regularScripts.map(loadScript));

            console.log('[KefinTweaks Component] All scripts loaded');

            // Dispatch event
            const event = new CustomEvent('kefinTweaksLoaded', {
                detail: {
                    loadedScripts: enabledScripts.map(s => s.name),
                    timestamp: new Date().toISOString()
                }
            });
            document.dispatchEvent(event);
        };

        // Wait for idle or timeout to not block main thread too much
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(() => init());
        } else {
            setTimeout(init, 100);
        }
    }, []);

    return null;
};

export default KefinTweaksLoader;
