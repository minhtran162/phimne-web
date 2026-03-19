import React, { useEffect } from 'react';

const InfiniteScroll: React.FC = () => {
    useEffect(() => {
        const loadScript = async () => {
            try {
                // @ts-ignore
                await import('../../../lib/legacy/scripts/infiniteScroll.js');
            } catch (error) {
                console.error('Failed to load InfiniteScroll tweak', error);
            }
        };

        loadScript();
    }, []);

    return null;
};

export default InfiniteScroll;
