import React, { useEffect } from 'react';

const CustomMenuLinks: React.FC = () => {
    useEffect(() => {
        // Common logging function
        const WARN = (...args: any[]) => console.warn('[KefinTweaks CustomMenuLinks]', ...args);
        const ERR = (...args: any[]) => console.error('[KefinTweaks CustomMenuLinks]', ...args);

        // Get custom menu links configuration
        function getCustomMenuLinksConfig() {
            // @ts-ignore
            return window.KefinTweaksConfig?.customMenuLinks || [];
        }

        // Initialize custom menu links
        async function initializeCustomMenuLinks() {
            const customMenuLinks = getCustomMenuLinksConfig();

            if (!Array.isArray(customMenuLinks) || customMenuLinks.length === 0) {
                return;
            }

            // Check if utils is available
            // @ts-ignore
            if (!window.KefinTweaksUtils || !window.KefinTweaksUtils.addCustomMenuLink) {
                ERR('KefinTweaksUtils.addCustomMenuLink not available');
                return;
            }

            // Add each custom menu link
            const addPromises = customMenuLinks.map(async (linkConfig: any, index: number) => {
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

                    // @ts-ignore
                    const success = await window.KefinTweaksUtils.addCustomMenuLink(
                        name,
                        icon,
                        url,
                        openInNewTab
                    );

                    if (!success) {
                        WARN(`Failed to add custom menu link: ${name}`);
                    }

                    return success;
                } catch (error) {
                    ERR(`Error adding custom menu link at index ${index}:`, error);
                    return false;
                }
            });

            // Wait for all links to be processed
            await Promise.all(addPromises);
        }

        let checkInterval: NodeJS.Timeout;

        // Wait for utils to be available and then initialize
        function waitForUtilsAndInitialize() {
            // @ts-ignore
            if (window.KefinTweaksUtils && window.KefinTweaksUtils.addCustomMenuLink) {
                initializeCustomMenuLinks();
                return;
            }

            // Poll for utils availability
            checkInterval = setInterval(() => {
                // @ts-ignore
                if (window.KefinTweaksUtils && window.KefinTweaksUtils.addCustomMenuLink) {
                    clearInterval(checkInterval);
                    initializeCustomMenuLinks();
                }
            }, 100);

            // Fallback timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                // @ts-ignore
                if (!window.KefinTweaksUtils || !window.KefinTweaksUtils.addCustomMenuLink) {
                    WARN('KefinTweaksUtils not available after 10 seconds');
                }
            }, 10000);
        }

        // Start initialization
        waitForUtilsAndInitialize();

        return () => {
            if (checkInterval) {
                clearInterval(checkInterval);
            }
        };
    }, []);

    return null;
};

export default CustomMenuLinks;
