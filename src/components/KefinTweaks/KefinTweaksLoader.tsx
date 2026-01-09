import React, { useEffect, useRef, useState } from 'react';
import browser from '../../scripts/browser';
import { loadCoreDictionary } from 'lib/globalize/loader';
import { currentSettings as userSettings } from 'scripts/settings/userSettings';

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

// [jeScriptImports mapping]
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
    config: true,
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
    settings: true,
    skinManager: !browser.tizen ? true : false,
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
    tier?: 'critical' | 'high' | 'medium' | 'low'; // New: loading priority
    lazyLoad?: boolean; // New: load on demand
}

// Script definitions from injector.js
const SCRIPT_DEFINITIONS: ScriptDefinition[] = [
    {
        name: 'config', script: 'config.js', css: null, dependencies: [], tier: 'critical',
        description: 'Default configuration values'
    },
    {
        name: 'utils', script: 'utils.js', css: null, dependencies: [], tier: 'critical',
        description: 'Common utilities for page view management'
    },
    {
        name: 'apiHelper', script: 'apiHelper.js', css: null, dependencies: [], tier: 'critical',
        description: 'API helper functions'
    },
    {
        name: 'localStorageCache', script: 'localStorageCache.js', css: null, dependencies: [], tier: 'critical',
        description: 'localStorage caching layer'
    },
    {
        name: 'modal', script: 'modal.js', css: 'modal.css', dependencies: [], tier: 'high',
        description: 'Generic modal system'
    },
    {
        name: 'cardBuilder', script: 'cardBuilder.js', css: 'cardBuilder.css', dependencies: ['apiHelper'], tier: 'high',
        description: 'Core card building functionality'
    },
    {
        name: 'settings', script: 'settings.js', css: null, dependencies: ['utils'], tier: 'high',
        description: 'KefinTweaks Settings UI'
    },
    {
        name: 'indexedDBCache', script: 'indexedDBCache.js', css: null, dependencies: [], tier: 'high',
        description: 'IndexedDB caching for large datasets'
    },

    // Medium priority - load after initial render
    {
        name: 'homeScreen', script: 'homeScreen.js', css: 'homeScreen.css',
        dependencies: ['cardBuilder', 'localStorageCache', 'utils'], tier: 'medium',
        description: 'Custom home screen sections'
    },
    {
        name: 'skinConfig', script: 'skinConfig.js', css: null, dependencies: [], tier: 'medium',
        description: 'Default skin configuration'
    },
    {
        name: 'skinManager', script: 'skinManager.js', css: 'defaultSkin.css',
        dependencies: ['utils', 'skinConfigLegacyDefaults', 'skinConfig', 'modal'], priority: true, tier: 'medium',
        description: 'Skin selection and management'
    },
    {
        name: 'infiniteScroll', script: 'infiniteScroll.js', css: null, dependencies: ['cardBuilder'], tier: 'medium',
        description: 'Infinite scroll functionality'
    },

    // Low priority - lazy load
    {
        name: 'search', script: 'search.js', css: 'search.css',
        dependencies: ['cardBuilder', 'utils'], tier: 'low', lazyLoad: true,
        description: 'Enhanced search functionality'
    },
    {
        name: 'toaster', script: 'toaster.js', css: null, dependencies: [], tier: 'low', lazyLoad: true,
        description: 'Toast notification system'
    },
    {
        name: 'watchlist', script: 'watchlist.js', css: 'watchlist.css',
        dependencies: ['cardBuilder', 'localStorageCache', 'modal', 'utils', 'watchlistTabInjector'], tier: 'low', lazyLoad: true,
        description: 'Watchlist functionality'
    },
    {
        name: 'subtitleSearch', script: 'subtitleSearch.js', css: 'subtitleSearch.css',
        dependencies: ['toaster'], tier: 'low', lazyLoad: true,
        description: 'Subtitle search functionality'
    },
    {
        name: 'playlist', script: 'playlist.js', css: null,
        dependencies: ['cardBuilder', 'utils', 'modal'], tier: 'low', lazyLoad: true,
        description: 'Playlist enhancements'
    },

    // Additional scripts with tier assignments
    {
        name: 'watchlistTabInjector', script: 'watchlistTabInjector.js', css: null, dependencies: ['utils'], tier: 'low',
        description: 'Injects Watchlist tab'
    },
    {
        name: 'headerTabs', script: 'headerTabs.js', css: null, dependencies: [], tier: 'low',
        description: 'Header tab improvements'
    },
    {
        name: 'customMenuLinks', script: 'customMenuLinks.js', css: null, dependencies: ['utils'], tier: 'low', lazyLoad: true,
        description: 'Custom menu links'
    },
    {
        name: 'exclusiveElsewhere', script: 'exclusiveElsewhere.js', css: null, dependencies: [], tier: 'low', lazyLoad: true,
        description: 'Elsewhere functionality modifications'
    },
    {
        name: 'backdropLeakFix', script: 'backdropLeakFix.js', css: null, dependencies: [], tier: 'low', lazyLoad: true,
        description: 'Fixes backdrop image leak'
    },
    {
        name: 'updoot', script: 'updoot.js', css: null, dependencies: [], tier: 'low', lazyLoad: true,
        description: 'Upvote functionality'
    },
    {
        name: 'dashboardButtonFix', script: 'dashboardButtonFix.js', css: null, dependencies: [], tier: 'low', lazyLoad: true,
        description: 'Dashboard button fix'
    },
    {
        name: 'removeContinue', script: 'removeContinue.js', css: null, dependencies: [], tier: 'low', lazyLoad: true,
        description: 'Remove from continue watching'
    },
    {
        name: 'breadcrumbs', script: 'breadcrumbs.js', css: 'breadcrumbNav.css', dependencies: ['utils'], tier: 'medium',
        description: 'Breadcrumb navigation'
    },
    {
        name: 'itemDetailsCollections', script: 'itemDetailsCollections.js', css: null,
        dependencies: ['indexedDBCache', 'utils', 'cardBuilder'], tier: 'low', lazyLoad: true,
        description: 'Related collections on item details'
    },
    {
        name: 'flattenSingleSeasonShows', script: 'seriesEpisodes.js', css: 'seriesEpisodes.css',
        dependencies: ['cardBuilder', 'utils'], tier: 'low', lazyLoad: true,
        description: 'Display episodes on series page'
    },
    {
        name: 'seriesInfo', script: 'seriesInfo.js', css: null, dependencies: ['utils'], tier: 'medium',
        description: 'Series and season information'
    },
    {
        name: 'collections', script: 'collections.js', css: null, dependencies: ['utils', 'modal'], tier: 'low', lazyLoad: true,
        description: 'Collection sorting functionality'
    },
    {
        name: 'skinConfigLegacyDefaults', script: 'skinConfig-0.3.5-defaults.js', css: null, dependencies: [], tier: 'low', lazyLoad: true,
        description: 'Legacy skin defaults'
    },
];

// Map for script imports
const scriptImports: Record<string, () => Promise<any>> = {
    // @ts-ignore
    'config': () => import('../../lib/legacy/config.js'),
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

// ===== TRANSLATION: Load Core Dictionary =====
const ensureTranslationsLoaded = async () => {
    try {
        if (userSettings.language() === null) return
        await loadCoreDictionary();
        console.log('[KefinTweaks] Core translations loaded');
        return true;
    } catch (error) {
        console.warn('[KefinTweaks] Translation loading failed, using fallbacks', error);
        // Even if it fails, we can continue with fallback strings
        return false;
    }
};

// ===== SAFARI/MOBILE COMPATIBILITY: requestIdleCallback Polyfill =====
const safeRequestIdleCallback = (
    callback: IdleRequestCallback,
    options?: { timeout?: number }
): number => {
    if (typeof requestIdleCallback !== 'undefined') {
        return requestIdleCallback(callback, options);
    }
    // Fallback for Safari and mobile browsers
    const timeout = options?.timeout || 1000;
    return setTimeout(() => {
        const start = Date.now();
        callback({
            didTimeout: false,
            timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
        });
    }, 1) as any;
};

// ===== OPTIMIZATION: Loading Manager =====
class LoadingManager {
    private loadedScripts = new Set<string>();
    private pendingLoads = new Map<string, Promise<void>>();
    private loadQueue: Array<{ script: ScriptDefinition; priority: number }> = [];
    private isProcessing = false;

    async loadScript(scriptDef: ScriptDefinition): Promise<void> {
        // Avoid duplicate loads
        if (this.loadedScripts.has(scriptDef.name)) {
            return Promise.resolve();
        }

        // Return existing promise if already loading
        if (this.pendingLoads.has(scriptDef.name)) {
            return this.pendingLoads.get(scriptDef.name)!;
        }

        const loadPromise = this._doLoad(scriptDef);
        this.pendingLoads.set(scriptDef.name, loadPromise);

        try {
            await loadPromise;
            this.loadedScripts.add(scriptDef.name);
        } finally {
            this.pendingLoads.delete(scriptDef.name);
        }
    }

    private async _doLoad(scriptDef: ScriptDefinition): Promise<void> {
        try {
            // Load CSS first (non-blocking)
            if (scriptDef.css && cssImports[scriptDef.css]) {
                cssImports[scriptDef.css]().catch(err =>
                    console.warn(`[KefinTweaks] CSS load failed: ${scriptDef.css}`, err)
                );
            }

            // Load script
            if (scriptImports[scriptDef.name]) {
                await scriptImports[scriptDef.name]();
                console.log(`[KefinTweaks] ✓ ${scriptDef.name}`);
            }
        } catch (err) {
            console.error(`[KefinTweaks] ✗ ${scriptDef.name}`, err);
            throw err; // Re-throw to mark as failed
        }
    }

    // Load scripts by tier with throttling
    async loadTier(tier: string, scripts: ScriptDefinition[], maxConcurrent = 3): Promise<void> {
        console.log(`[KefinTweaks] Loading ${tier} tier (${scripts.length} scripts)`);

        // Process in batches to avoid overwhelming slow devices
        for (let i = 0; i < scripts.length; i += maxConcurrent) {
            const batch = scripts.slice(i, i + maxConcurrent);
            await Promise.allSettled(batch.map(s => this.loadScript(s)));

            // Yield to main thread between batches
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    isLoaded(scriptName: string): boolean {
        return this.loadedScripts.has(scriptName);
    }
}

const loadingManager = new LoadingManager();

// ===== OPTIMIZATION: Simplified Jellyfin Enhanced Init =====
const initializeJellyfinEnhanced = async () => {
    await loadCoreDictionary();

    const ApiClient = (window as any).ApiClient;
    if (!ApiClient) {
        console.warn('[KefinTweaks] ApiClient not found, retrying...');
        setTimeout(initializeJellyfinEnhanced, 1000);
        return;
    }

    console.log('[KefinTweaks] Initializing Jellyfin Enhanced (optimized)...');
    
    const loadTranslations = async () => {
        const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        try {
            // Get plugin version first
            let pluginVersion = window.JellyfinEnhanced?.pluginVersion;
            if (!pluginVersion || pluginVersion === 'unknown') {
                // Fetch version if not loaded yet
                try {
                    const versionResponse = await fetch(ApiClient.getUrl('/JellyfinEnhanced/version'));
                    if (versionResponse.ok) {
                        pluginVersion = await versionResponse.text();
                        if (window.JellyfinEnhanced) {
                            window.JellyfinEnhanced.pluginVersion = pluginVersion;
                        }
                    }
                } catch (e) {
                    console.warn('🪼 Jellyfin Enhanced: Failed to fetch plugin version', e);
                    pluginVersion = 'unknown';
                }
            }

            // Wait briefly for ApiClient user to potentially become available
            let user = ApiClient.getCurrentUser ? ApiClient.getCurrentUser() : null;
            if (user instanceof Promise) {
                user = await user;
            }

            const userId = user?.Id;
            let lang = 'en'; // Default to English

            if (userId) {
                const storageKey = `${userId}-language`;
                const storedLang = localStorage.getItem(storageKey);
                if (storedLang) {
                    lang = storedLang.split('-')[0]; // Use base language code
                }
            }

            // Clean up old translation caches from previous versions
            try {
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith('JE_translation_') || key.startsWith('JE_translation_ts_'))) {
                        // Remove if it doesn't match current version
                        if (!key.includes(`_${pluginVersion}`)) {
                            localStorage.removeItem(key);
                        }
                    }
                }
            } catch (e) {
                console.warn('🪼 Jellyfin Enhanced: Failed to clean up old translation caches', e);
            }

            // Check if we have a cached version
            const cacheKey = `JE_translation_${lang}_${pluginVersion}`;
            const timestampKey = `JE_translation_ts_${lang}_${pluginVersion}`;
            const cachedTranslations = localStorage.getItem(cacheKey);
            const cachedTimestamp = localStorage.getItem(timestampKey);

            if (cachedTranslations && cachedTimestamp) {
                const age = Date.now() - parseInt(cachedTimestamp, 10);
                if (age < CACHE_DURATION) {
                    try {
                        return JSON.parse(cachedTranslations);
                    } catch (e) {
                        console.warn('🪼 Jellyfin Enhanced: Failed to parse cached translations, will fetch fresh', e);
                    }
                }
            }

            // Fallback to bundled translations served by the plugin
            const protocol = window.location.protocol;
            const host = window.location.hostname;

            console.log(host)

            let response = await fetch(`${protocol}//${protocol === 'https:' ? host : `${host}:${window.location.port}`}/${protocol === 'https:' ? 'web/' : ''}assets/locales/${lang}.json`);

            if (response.ok) {
                const translations = await response.json();
                // Cache the bundled version too
                try {
                    localStorage.setItem(cacheKey, JSON.stringify(translations));
                    localStorage.setItem(timestampKey, Date.now().toString());
                } catch (e) { /* ignore */ }
                return translations;
            } else {
                // Last resort: English bundled
                console.warn(`🪼 Jellyfin Enhanced: Bundled ${lang} not found, falling back to bundled English`);
                response = await fetch(ApiClient.getUrl('/JellyfinEnhanced/locales/en.json'));
                if (response.ok) {
                    return await response.json();
                } else {
                    throw new Error("Failed to load English fallback translations");
                }
            }
        } catch (error) {
            console.error('🪼 Jellyfin Enhanced: Failed to load translations:', error);
            return {}; // Return empty object on catastrophic failure
        }
    }

    // Setup minimal global namespace
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
                register(cb: any) { this.callbacks.add(cb); },
                unregister(cb: any) { this.callbacks.delete(cb); },
                markDirty() {
                    this.dirty = true;
                    if (!this.scheduleId) {
                        this.scheduleId = setTimeout(() => this._flush(), 2000); // Increased delay
                    }
                },
                _flush() {
                    if (this.dirty) {
                        this.callbacks.forEach((cb: any) => {
                            try { cb(); } catch (e) { console.error('Cache save error:', e); }
                        });
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
            loadSettings: () => { return {}; },
            initializeShortcuts: () => { },
            saveUserSettings: async () => { }
        };
    }

    const JE = window.JellyfinEnhanced;

    try {
        // Load only essential config (use defaults, skip network requests)
        JE.pluginConfig = DEFAULT_ENABLED_JELLYFIN_ENHANCED_SETTINGS;
        JE.pluginVersion = 'optimized';
        JE.translations = await loadTranslations();

        // Skip private config loading (optimization)

        // Load splash screen only
        if (jeScriptImports['splashscreen.js']) {
            await jeScriptImports['splashscreen.js']();
            if (typeof JE.initializeSplashScreen === 'function') {
                JE.initializeSplashScreen();
            }
        }

        // Defer loading other JE scripts
        safeRequestIdleCallback(() => {
            const loadJEScripts = async () => {
                const scriptsToLoad = JE_SCRIPTS.filter(s => s !== 'splashscreen.js');

                // Load in smaller batches
                for (let i = 0; i < scriptsToLoad.length; i += 2) {
                    const batch = scriptsToLoad.slice(i, i + 2);
                    await Promise.allSettled(
                        batch.map(name => jeScriptImports[name] ? jeScriptImports[name]() : Promise.resolve())
                    );
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                // Initialize core features
                if (typeof JE.loadSettings === 'function') JE.currentSettings = JE.loadSettings();
                if (typeof JE.initializeShortcuts === 'function') JE.initializeShortcuts();
                if (typeof JE.themer?.init === 'function') JE.themer.init();
                if (typeof JE.initializeEnhancedScript === 'function') JE.initializeEnhancedScript();

                // Hide splash after core init
                if (typeof JE.hideSplashScreen === 'function') JE.hideSplashScreen();

                console.log('[KefinTweaks] JE core initialized');
            };

            loadJEScripts();
        }, { timeout: 3000 });

    } catch (error) {
        console.error('[KefinTweaks] JE init failed', error);
        if (typeof JE.hideSplashScreen === 'function') JE.hideSplashScreen();
    }
};

// ===== OPTIMIZATION: Dependency Resolution (optimized) =====
const resolveDependencies = (
    enabledScripts: Record<string, boolean>
): Record<string, boolean> => {
    const resolved = { ...enabledScripts };
    const toProcess = Object.keys(resolved).filter(k => resolved[k]);
    const processed = new Set<string>();

    // Simple breadth-first resolution (faster than while loop)
    while (toProcess.length > 0) {
        const current = toProcess.shift()!;
        if (processed.has(current)) continue;
        processed.add(current);

        const script = SCRIPT_DEFINITIONS.find(s => s.name === current);
        if (script) {
            for (const dep of script.dependencies) {
                if (!resolved[dep]) {
                    resolved[dep] = true;
                    toProcess.push(dep);
                }
            }
        }
    }

    return resolved;
};

// ===== MAIN COMPONENT =====
const KefinTweaksLoader: React.FC = () => {
    const initialized = useRef(false);
    const lazyLoadScheduled = useRef(false);
    const [userLanguage, setUserLanguage] = useState<string | null>(null);
    const [languageReady, setLanguageReady] = useState(false);

    // Listen for language changes
    useEffect(() => {
        let stopped = false;
        const tryDetectLanguage = () => {
            if (stopped) return;
            try {
                const lang = userSettings.language();
                // Check if lang is present
                if (lang !== null) {
                    console.log('[KefinTweaks] Language detected:', lang);
                    setUserLanguage(lang);
                    setLanguageReady(true);
                    stopped = true;
                }
            } catch (e) {
                console.warn('[KefinTweaks] error reading userSettings.language()', e);
            }
        };

        // 1. Immediate check
        tryDetectLanguage();

        // 2. Poll every 200ms
        const intervalId = setInterval(() => {
            if (stopped) {
                clearInterval(intervalId);
                return;
            }
            tryDetectLanguage();
        }, 200);

        // This fixes the Android Webview deadlock
        const timeoutId = setTimeout(() => {
            if (!stopped && !languageReady) {
                console.warn('[KefinTweaks] Language detection timed out or is null (System Default). Forcing start.');
                setUserLanguage('en'); // Default fallback
                setLanguageReady(true);
                stopped = true;
                clearInterval(intervalId);
            }
        }, 1500);

        return () => {
            stopped = true;
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, []);

    useEffect(() => {
        if (!languageReady || initialized.current) return;
        initialized.current = true;

        const init = async () => {
            console.log('[KefinTweaks] Initializing (optimized for slow devices)...');

            // FIRST: Ensure translations are loaded
            await ensureTranslationsLoaded();

            // Start JE initialization (non-blocking)
            initializeJellyfinEnhanced();

            // Load configuration
            const storedFullConfig = localStorage.getItem('KefinTweaksConfig');
            let enabledScriptsMap = { ...DEFAULT_ENABLED_SCRIPTS };

            if (storedFullConfig) {
                try {
                    const config = JSON.parse(storedFullConfig);
                    window.KefinTweaksConfig = config;
                    if (config.scripts) {
                        enabledScriptsMap = { ...enabledScriptsMap, ...config.scripts };
                    }
                } catch (e) {
                    console.error('[KefinTweaks] Config parse error', e);
                }
            }

            // Resolve dependencies
            enabledScriptsMap = resolveDependencies(enabledScriptsMap);

            // Filter and categorize scripts
            const enabledScripts = SCRIPT_DEFINITIONS.filter(s => enabledScriptsMap[s.name]);

            const criticalScripts = enabledScripts.filter(s => s.tier === 'critical');
            const highScripts = enabledScripts.filter(s => s.tier === 'high');
            const mediumScripts = enabledScripts.filter(s => s.tier === 'medium');
            const lowScripts = enabledScripts.filter(s => s.tier === 'low' && !s.lazyLoad);
            const lazyScripts = enabledScripts.filter(s => s.lazyLoad);

            // Expose to global
            if (!window.KefinTweaks) window.KefinTweaks = {};
            window.KefinTweaks.ScriptDefinitions = SCRIPT_DEFINITIONS;
            window.KefinTweaks.LoadingManager = loadingManager;

            try {
                // TIER 1: Critical scripts (load immediately)
                await loadingManager.loadTier('critical', criticalScripts, 2);

                // Dispatch early event for critical features
                document.dispatchEvent(new CustomEvent('kefinTweaksCriticalLoaded'));

                // TIER 2: High priority (load with small delay)
                await new Promise(resolve => setTimeout(resolve, 100));
                await loadingManager.loadTier('high', highScripts, 2);

                // TIER 3: Medium priority (load after idle)
                safeRequestIdleCallback(async () => {
                    await loadingManager.loadTier('medium', mediumScripts, 2);

                    // TIER 4: Low priority (load last)
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await loadingManager.loadTier('low', lowScripts, 1);

                    console.log('[KefinTweaks] Core loading complete');

                    document.dispatchEvent(new CustomEvent('kefinTweaksLoaded', {
                        detail: {
                            loadedScripts: Array.from(loadingManager['loadedScripts']),
                            timestamp: new Date().toISOString()
                        }
                    }));
                }, { timeout: 2000 });

                // TIER 5: Lazy scripts (load on interaction or after 5s)
                if (!lazyLoadScheduled.current && lazyScripts.length > 0) {
                    lazyLoadScheduled.current = true;

                    const loadLazyScripts = async () => {
                        console.log('[KefinTweaks] Loading lazy scripts...');
                        await loadingManager.loadTier('lazy', lazyScripts, 1);
                    };

                    // Load on user interaction
                    const interactionEvents = ['click', 'scroll', 'keydown', 'touchstart'];
                    const loadOnInteraction = () => {
                        interactionEvents.forEach(event =>
                            document.removeEventListener(event, loadOnInteraction)
                        );
                        safeRequestIdleCallback(loadLazyScripts, { timeout: 5000 });
                    };

                    interactionEvents.forEach(event =>
                        document.addEventListener(event, loadOnInteraction, { once: true, passive: true })
                    );

                    // Fallback: load after 5 seconds
                    setTimeout(loadOnInteraction, 5000);
                }

            } catch (error) {
                console.error('[KefinTweaks] Initialization error', error);
            }
        };

        const start = async () => {
            try {
                console.log('[KefinTweaks] Starting init because user Language is loaded');
                await init();
            } catch (err) {
                console.error('[KefinTweaks] init failed', err);
                initialized.current = false;
            }
        };

        if (typeof safeRequestIdleCallback === 'function') {
            safeRequestIdleCallback(() => start(), { timeout: 1000 });
        } else {
            setTimeout(() => start(), 0);
        }
    }, [userLanguage, languageReady]);

    return null;
};

export default KefinTweaksLoader;