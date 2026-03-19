import React, { useEffect } from 'react';

const Playlist: React.FC = () => {
    useEffect(() => {
        const loadScript = async () => {
            try {
                // The script contains complex DOM manipulation and Emby global object integration
                // that's better loaded directly for now to maintain full functionality
                // @ts-ignore
                await import('../../../lib/legacy/scripts/playlist.js');
            } catch (error) {
                console.error('Failed to load Playlist tweak', error);
            }
        };

        loadScript();
    }, []);

    return null;
};

export default Playlist;
