import React, { useEffect } from 'react';

const SeriesInfo: React.FC = () => {
    useEffect(() => {
        const loadScript = async () => {
            try {
                // @ts-ignore
                await import('../../../lib/legacy/scripts/seriesInfo.js');
            } catch (error) {
                console.error('Failed to load SeriesInfo tweak', error);
            }
        };

        loadScript();
    }, []);

    return null;
};

export default SeriesInfo;
