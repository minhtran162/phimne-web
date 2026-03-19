import React, { useEffect } from 'react';

const SubtitleSearch: React.FC = () => {
    useEffect(() => {
        let cleanup: (() => void) | undefined;

        const loadScript = async () => {
            try {
                // The script contains complex DOM manipulation and Emby global object integration
                // that's better loaded directly for now to maintain full functionality
                // @ts-ignore
                await import('../../../lib/legacy/scripts/subtitleSearch.js');
                
                // @ts-ignore
                if (window.subtitleSearchCleanup) {
                    // @ts-ignore
                    cleanup = window.subtitleSearchCleanup;
                }
            } catch (error) {
                console.error('Failed to load SubtitleSearch tweak', error);
            }
        };

        loadScript();

        return () => {
            if (cleanup) {
                cleanup();
            }
        };
    }, []);

    return null;
};

export default SubtitleSearch;
