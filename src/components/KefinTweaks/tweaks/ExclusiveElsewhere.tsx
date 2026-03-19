import React, { useEffect } from 'react';

const ExclusiveElsewhere: React.FC = () => {
    useEffect(() => {
        // Common logging function
        const WARN = (...args: any[]) => console.warn('[KefinTweaks ExclusiveElsewhere]', ...args);
        const ERR = (...args: any[]) => console.error('[KefinTweaks ExclusiveElsewhere]', ...args);

        const observer = new MutationObserver(() => {
            const elsewhereContainer = document.querySelector('.itemDetailPage:not(.hide) .streaming-lookup-container>div');
            if (elsewhereContainer && elsewhereContainer.children && elsewhereContainer.children.length > 2) {
                return;
            }

            // @ts-ignore
            const config = window.KefinTweaksConfig?.exclusiveElsewhere || {
                hideServerName: false // Default fallback
            };

            // @ts-ignore
            const ApiClient = window.ApiClient;
            const serverName = ApiClient && !config.hideServerName ? ApiClient.serverId() : '';

            const link = document.querySelector('.itemDetailPage:not(.hide) .streaming-lookup-container>div>div:first-child a');
            if (link && !link.classList.contains('exclusive')) {
                link.innerHTML = `Only available on ${serverName}`;
                link.classList.add('exclusive');
                // @ts-ignore
                link.title = 'Exclusive';
                // @ts-ignore
                link.disable = true;
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => {
            observer.disconnect();
        };
    }, []);

    return null;
};

export default ExclusiveElsewhere;
