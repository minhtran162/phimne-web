import React, { useEffect } from 'react';

const Breadcrumbs: React.FC = () => {
    useEffect(() => {
        const loadScript = async () => {
            try {
                // @ts-ignore
                await import('../../../lib/legacy/scripts/breadcrumbs.js');
            } catch (error) {
                console.error('Failed to load Breadcrumbs tweak', error);
            }
        };

        loadScript();
    }, []);

    return null;
};

export default Breadcrumbs;
