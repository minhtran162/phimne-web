import React, { useEffect } from 'react';

const DashboardButtonFix: React.FC = () => {
    useEffect(() => {
        const attachHandler = () => {
            const btn = document.querySelector('button.MuiButtonBase-root');
            if (!btn) return;

            // @ts-ignore
            if (btn._backCheckAttached) return;
            // @ts-ignore
            btn._backCheckAttached = true;

            btn.addEventListener('click', function (e) {
                if (window.history.state?.idx === 0) {
                    // Stop normal handlers
                    e.stopImmediatePropagation();
                    e.preventDefault();

                    // @ts-ignore
                    const ApiClient = window.ApiClient;
                    // @ts-ignore
                    const Dashboard = window.Dashboard;

                    if (ApiClient && Dashboard) {
                        // Changes this to the page you'd like to return to by default
                        const serverVersion = ApiClient.serverVersion();
                        const homeUrl = serverVersion && parseInt(serverVersion.split('.')[1], 10) > 10 ? 'home' : 'home.html';
                        Dashboard.navigate(`/${homeUrl}`);
                    }
                }
            }, true);
        };

        // Observe DOM in case button is recreated
        const observer = new MutationObserver(attachHandler);
        observer.observe(document.body, { childList: true, subtree: true });

        // Initial run
        attachHandler();

        return () => {
            observer.disconnect();
        };
    }, []);

    return null;
};

export default DashboardButtonFix;
