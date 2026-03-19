import React, { useEffect } from 'react';

const FlattenSingleSeasonShows: React.FC = () => {
    useEffect(() => {
        const loadScript = async () => {
            try {
                // The script contains complex DOM manipulation and Emby global object integration
                // that's better loaded directly for now to maintain full functionality
                // @ts-ignore
                await import('../../../lib/legacy/scripts/flattenSingleSeasonShows.js');
            } catch (error) {
                console.error('Failed to load FlattenSingleSeasonShows tweak', error);
            }
        };

        loadScript();
    }, []);

    return null;
};

export default FlattenSingleSeasonShows;
