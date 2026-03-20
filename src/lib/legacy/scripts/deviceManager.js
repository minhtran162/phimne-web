// Device Manager
// Adds a "Remove Device" button to active device sessions on the dashboard page
// Allows users to remove devices via a custom endpoint

(function() {
    'use strict';

    // Logging functions

    const WARN = (...args) => console.warn('[DeviceManager]', ...args);
    const ERR = (...args) => console.error('[DeviceManager]', ...args);

    ;

    // Polling interval references
    let pollingInterval = null;
    let continuousPollingInterval = null;

    // Wait for KefinTweaksUtils to become available
    async function waitForUtils(maxWaitTime = 30000, checkInterval = 100) {
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            if (window.KefinTweaksUtils && window.KefinTweaksUtils.onViewPage) {
                ;
                return true;
            }

            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }

        ERR('KefinTweaksUtils not available after waiting. Device Manager requires utils.js');
        return false;
    }

    // Initialize the device manager after utils are available
    async function initializeDeviceManager() {
        // Wait for utils to be available
        const utilsAvailable = await waitForUtils();
        if (!utilsAvailable) {
            return;
        }

        // Register handler for dashboard page
        window.KefinTweaksUtils.onViewPage((view, element) => {
            // Check if we're on the dashboard page
            const isDashboardPage = view === 'dashboard'
                                   || view === 'dashboardPage'
                                   || window.location.hash.includes('dashboard')
                                   || document.querySelector('#dashboardPage:not(.hide)');

            if (!isDashboardPage) {
                // Not on dashboard, clear polling intervals
                if (pollingInterval) {
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                }
                if (continuousPollingInterval) {
                    clearInterval(continuousPollingInterval);
                    continuousPollingInterval = null;
                }
                return;
            }

            ;

            // Start polling for activeDevicesContainer
            initializeDashboard();
        }, {
            pages: ['dashboard', 'dashboardPage']
        });

        ;
    }

    // Check if ApiClient is available
    function isApiClientAvailable() {
        return window.ApiClient
               && typeof window.ApiClient.accessToken === 'function'
               && typeof window.ApiClient.serverAddress === 'function'
               && typeof window.ApiClient.getSessions === 'function';
    }

    // Get session data by session ID
    async function getSessionData(sessionId, sessions) {
        try {
            if (!isApiClientAvailable()) {
                throw new Error('ApiClient not available or getSessions method not found');
            }

            if (!sessions || !Array.isArray(sessions)) {
                throw new Error('Failed to get sessions or sessions is not an array');
            }

            ;

            // Filter sessions to find the one matching our session ID
            const sessionData = sessions.find(session => session.Id === sessionId);

            if (!sessionData) {
                WARN(`Session with ID ${sessionId} not found in sessions list`);
                return null;
            }

            return sessionData;
        } catch (error) {
            ERR('Error fetching session data:', error);
            return null;
        }
    }

    // Remove device via custom endpoint
    async function removeDevice(deviceId) {
        try {
            if (!isApiClientAvailable()) {
                throw new Error('ApiClient not available');
            }

            const token = window.ApiClient.accessToken();
            if (!token) {
                throw new Error('Access token not available');
            }

            ;

            const serverAddress = window.ApiClient.serverAddress();
            if (!serverAddress) {
                throw new Error('Server address not available');
            }

            const response = await fetch(`${serverAddress}/Devices?Id=${encodeURIComponent(deviceId)}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `MediaBrowser Token="${token}"`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            ;
            return true;
        } catch (error) {
            ERR('Error removing device:', error);
            return false;
        }
    }

    // Create remove device button
    function createRemoveDeviceButton(deviceId) {
        const button = document.createElement('button');
        button.setAttribute('is', 'paper-icon-button-light');
        button.className = 'sessionCardButton btnSessionRemoveDevice paper-icon-button-light';
        button.setAttribute('title', 'Remove Device');

        const iconSpan = document.createElement('span');
        iconSpan.className = 'material-icons';
        iconSpan.setAttribute('aria-hidden', 'true');
        iconSpan.textContent = 'delete';

        button.appendChild(iconSpan);

        // Add click handler
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!confirm('Are you sure you want to remove this device?')) {
                return;
            }

            button.disabled = true;
            const originalTitle = button.getAttribute('title');
            button.setAttribute('title', 'Removing...');

            const success = await removeDevice(deviceId);

            if (success) {
                // Remove the session container from the DOM
                const sessionContainer = button.closest('.activeSession');
                if (sessionContainer) {
                    sessionContainer.style.transition = 'opacity 0.3s';
                    sessionContainer.style.opacity = '0';
                    setTimeout(() => {
                        sessionContainer.remove();
                    }, 300);
                }

                // Show success message if toaster is available
                if (window.KefinTweaksToaster) {
                    window.KefinTweaksToaster.show('Device removed successfully', 'success');
                }
            } else {
                button.disabled = false;
                button.setAttribute('title', originalTitle);

                // Show error message if toaster is available
                if (window.KefinTweaksToaster) {
                    window.KefinTweaksToaster.show('Failed to remove device', 'error');
                }
            }
        });

        return button;
    }

    // Process a single session container
    async function processSessionContainer(container, sessions) {
        // Check if button already exists
        const existingButton = container.querySelector('.btnSessionRemoveDevice');
        if (existingButton) {
            ;
            return;
        }

        // Get session ID from container ID
        const containerId = container.id;
        if (!containerId || !containerId.startsWith('session')) {
            WARN('Container ID does not match expected format:', containerId);
            return;
        }

        const sessionId = containerId.substring(7); // Remove "session" prefix
        if (!sessionId) {
            WARN('Could not extract session ID from container ID:', containerId);
            return;
        }

        ;

        // Find the sessionCardButtons container
        const buttonsContainer = container.querySelector('.sessionCardButtons');
        if (!buttonsContainer) {
            WARN('sessionCardButtons container not found');
            return;
        }

        // Fetch session data to get device ID
        const sessionData = await getSessionData(sessionId, sessions);
        if (!sessionData || !sessionData.DeviceId) {
            WARN('Could not get device ID from session data');
            return;
        }

        const deviceId = sessionData.DeviceId;
        ;

        // Create and add remove device button
        const removeButton = createRemoveDeviceButton(deviceId);
        buttonsContainer.appendChild(removeButton);

        ;
    }

    // Process all active session containers on the dashboard
    async function processActiveSessions() {
        const dashboardPage = document.querySelector('#dashboardPage:not(.hide)');
        if (!dashboardPage) {
            return;
        }

        const activeDevicesContainer = dashboardPage.querySelector('.activeDevices');
        if (!activeDevicesContainer) {
            return;
        }

        const activeSessions = activeDevicesContainer.querySelectorAll('.activeSession');
        ;

        if (activeSessions.length === 0) {
            return;
        }

        let sessions = null;

        if (window.ApiClient && window.ApiClient.getSessions) {
            sessions = await window.ApiClient.getSessions();
        }

        if (!sessions) {
            WARN('Failed to get sessions');
            return;
        }

        // Process each session container
        for (const sessionContainer of activeSessions) {
            await processSessionContainer(sessionContainer, sessions);
        }
    }

    // Poll for activeDevicesContainer and process sessions
    function pollForActiveDevicesContainer(maxAttempts = 50, interval = 500) {
        // Clear any existing intervals
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
        if (continuousPollingInterval) {
            clearInterval(continuousPollingInterval);
        }

        let attempts = 0;

        pollingInterval = setInterval(async () => {
            attempts++;

            const dashboardPage = document.querySelector('#dashboardPage:not(.hide)');
            if (!dashboardPage) {
                if (attempts >= maxAttempts) {
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                    ;
                }
                return;
            }

            const activeDevicesContainer = dashboardPage.querySelector('.activeDevices');
            if (!activeDevicesContainer) {
                if (attempts >= maxAttempts) {
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                    ;
                }
                return;
            }

            // Found the container, check for active sessions
            clearInterval(pollingInterval);
            pollingInterval = null;
            ;

            // Check if there are any active session containers
            const activeSessions = activeDevicesContainer.querySelectorAll('.activeSession');

            if (activeSessions.length > 0) {
                ;

                // Process all existing sessions
                await processActiveSessions();

                // Stop polling once we've found and processed sessions
                ;
                return;
            }

            // No sessions found yet, continue polling periodically
            if (!continuousPollingInterval) {
                continuousPollingInterval = setInterval(async () => {
                    const currentDashboardPage = document.querySelector('#dashboardPage:not(.hide)');
                    if (!currentDashboardPage) {
                        // Dashboard page no longer visible, stop continuous polling
                        clearInterval(continuousPollingInterval);
                        continuousPollingInterval = null;
                        // Restart initial polling
                        pollForActiveDevicesContainer();
                        return;
                    }

                    const currentActiveDevicesContainer = currentDashboardPage.querySelector('.activeDevices');
                    if (!currentActiveDevicesContainer) {
                        return;
                    }

                    const currentActiveSessions = currentActiveDevicesContainer.querySelectorAll('.activeSession');
                    if (currentActiveSessions.length > 0) {
                        ;

                        // Stop continuous polling
                        clearInterval(continuousPollingInterval);
                        continuousPollingInterval = null;

                        // Process all sessions
                        await processActiveSessions();

                        ;
                    }
                }, interval * 2); // Poll less frequently after initial find
            }
        }, interval);
    }

    // Main initialization
    function initializeDashboard() {
        // Start polling for activeDevicesContainer
        pollForActiveDevicesContainer();
    }

    // Start initialization
    initializeDeviceManager();
})();

