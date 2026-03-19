import React, { useEffect } from 'react';

const Updoot: React.FC = () => {
    useEffect(() => {
        const loadScript = async () => {
            try {
                // @ts-ignore
                await import('../../../lib/legacy/scripts/updoot.js');
            } catch (error) {
                console.error('Failed to load Updoot tweak', error);
            }
        };

        loadScript();
    }, []);

    return null;
};

export default Updoot;
