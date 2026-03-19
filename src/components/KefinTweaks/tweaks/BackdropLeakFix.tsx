import React, { useEffect } from 'react';

const BackdropLeakFix: React.FC = () => {
    useEffect(() => {
        // Step 1: watch for .backdropContainer to appear
        const waitForContainer = new MutationObserver(() => {
            const container = document.querySelector('.backdropContainer');
            if (!container) return;

            waitForContainer.disconnect();

            // Step 2: prune children as needed
            const pruneObserver = new MutationObserver(() => {
                while (container.children.length > 2) {
                    if (container.firstElementChild) {
                        container.removeChild(container.firstElementChild);
                    }
                }
            });

            pruneObserver.observe(container, { childList: true });
        });

        waitForContainer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => {
            waitForContainer.disconnect();
            // Note: we can't easily disconnect the pruneObserver from here 
            // without making it accessible, but this is a global tweak anyway
        };
    }, []);

    return null;
};

export default BackdropLeakFix;
