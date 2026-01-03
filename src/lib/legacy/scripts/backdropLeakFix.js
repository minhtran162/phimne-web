// Backdrop Leak Fix Script
// Fixes issue that causes backdrop images to be continuously added to the page if the tab isn't focused

(function() {
    'use strict';

    // Step 1: watch for .backdropContainer to appear
    const waitForContainer = new MutationObserver(() => {
        const container = document.querySelector('.backdropContainer');
        if (!container) return;

        waitForContainer.disconnect();

        // Step 2: prune children as needed
        const pruneObserver = new MutationObserver(() => {
            while (container.children.length > 2) {
                container.removeChild(container.firstElementChild);
            }
        });

        pruneObserver.observe(container, { childList: true });
    });

    waitForContainer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
