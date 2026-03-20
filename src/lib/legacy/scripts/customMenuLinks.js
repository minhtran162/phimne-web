// Custom Menu Links Script
// Loads custom menu links from configuration and adds them to the custom menu
// Uses utils.addCustomMenuLink to add each configured link
// Requires: utils.js module to be loaded before this script

(function() {
    'use strict';

    // Common logging function

    const WARN = (...args) => console.warn('[KefinTweaks CustomMenuLinks]', ...args);
    const ERR = (...args) => console.error('[KefinTweaks CustomMenuLinks]', ...args);

    ;

    // Get custom menu links configuration
    function getCustomMenuLinksConfig() {
        return window.KefinTweaksConfig?.customMenuLinks || [];
    }

    // Initialize custom menu links
    async function initializeCustomMenuLinks() {
        const customMenuLinks = getCustomMenuLinksConfig();

        if (!Array.isArray(customMenuLinks) || customMenuLinks.length === 0) {
            ;
            return;
        }

        ;

        // Check if utils is available
        if (!window.KefinTweaksUtils || !window.KefinTweaksUtils.addCustomMenuLink) {
            ERR('KefinTweaksUtils.addCustomMenuLink not available');
            return;
        }

        // Add each custom menu link
        const addPromises = customMenuLinks.map(async (linkConfig, index) => {
            try {
                // Validate link configuration
                if (!linkConfig.name || !linkConfig.url) {
                    WARN(`Custom menu link at index ${index} is missing required properties (name, url)`);
                    return false;
                }

                const {
                    name,
                    icon = 'link', // Default icon
                    url,
                    openInNewTab = false
                } = linkConfig;

                ;

                const success = await window.KefinTweaksUtils.addCustomMenuLink(
                    name,
                    icon,
                    url,
                    openInNewTab
                );

                if (success) {
                    ;
                } else {
                    WARN(`Failed to add custom menu link: ${name}`);
                }

                return success;
            } catch (error) {
                ERR(`Error adding custom menu link at index ${index}:`, error);
                return false;
            }
        });

        // Wait for all links to be processed
        const results = await Promise.all(addPromises);
        let successCount = 0;
        for (let i = 0, len = results.length; i < len; i++) {
            if (results[i]) {
                successCount++;
            }
        }

        ;
    }

    // Wait for utils to be available and then initialize
    function waitForUtilsAndInitialize() {
        if (window.KefinTweaksUtils && window.KefinTweaksUtils.addCustomMenuLink) {
            ;
            initializeCustomMenuLinks();
            return;
        }

        ;

        // Poll for utils availability
        const checkInterval = setInterval(() => {
            if (window.KefinTweaksUtils && window.KefinTweaksUtils.addCustomMenuLink) {
                clearInterval(checkInterval);
                ;
                initializeCustomMenuLinks();
            }
        }, 100);

        // Fallback timeout after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            WARN('KefinTweaksUtils not available after 10 seconds');
        }, 10000);
    }

    // Start initialization
    waitForUtilsAndInitialize();

    ;
})();
