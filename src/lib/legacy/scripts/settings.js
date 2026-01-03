// KefinTweaks Settings
// UI for configuring KefinTweaks components

(function () {
    'use strict';

    const MODAL_ID = 'kefinTweaksSettingsModal';

    // Helper to create modal
    function createSimpleModal(id, title, content, footer) {
        // Check if modal already exists
        let modal = document.getElementById(id);
        if (modal) {
            modal.parentNode.removeChild(modal);
        }

        // Create modal container
        modal = document.createElement('div');
        modal.id = id;
        modal.className = 'dialogContainer';
        modal.style.zIndex = '9999'; // Ensure it's on top

        const backdrop = document.createElement('div');
        backdrop.className = 'dialogBackdrop';
        backdrop.style.opacity = '1'; // Force visible
        backdrop.onclick = () => closeSimpleModal(id);

        const dialog = document.createElement('div');
        dialog.className = 'dialog dialog-fixedSize dialog-medium';
        // Add animation class if available in Emby/Jellyfin
        dialog.classList.add('dialog-open');

        const titleParams = document.createElement('div');
        titleParams.className = 'dialogHeader';
        titleParams.innerHTML = `
            <div class="dialogHeaderTitle">${title}</div>
            <button is="paper-icon-button-light" class="dialogCloseButton paper-icon-button-light emby-button" onclick="closeSimpleModal('${id}')">
                <span class="material-icons close"></span>
            </button>
        `;
        // Fix close button click
        titleParams.querySelector('.dialogCloseButton').onclick = () => closeSimpleModal(id);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'dialogContent';
        contentDiv.style.maxHeight = '70vh';
        contentDiv.style.overflowY = 'auto';
        contentDiv.appendChild(content);

        const footerDiv = document.createElement('div');
        footerDiv.className = 'dialogFooter';
        if (footer) {
            footerDiv.appendChild(footer);
        } else {
            // Default footer with close button
            footerDiv.innerHTML = `
                <button is="emby-button" class="btnSubmit raised emby-button" onclick="closeSimpleModal('${id}')">
                    Close
                </button>
            `;
            footerDiv.querySelector('button').onclick = () => closeSimpleModal(id);
        }

        dialog.appendChild(titleParams);
        dialog.appendChild(contentDiv);
        dialog.appendChild(footerDiv);

        modal.appendChild(backdrop);
        modal.appendChild(dialog);

        document.body.appendChild(modal);
        
        // Trap focus if possible, or just focus the dialog
        dialog.focus();
    }

    function closeSimpleModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.parentNode.removeChild(modal);
        }
    }

    function showAlertModal(title, htmlContent) {
        const content = document.createElement('div');
        content.innerHTML = htmlContent;
        createSimpleModal(title + '_alert', title, content, null);
    }

    // Get config
    function getKefinTweaksConfig() {
        if (window.KefinTweaksConfig) {
            return window.KefinTweaksConfig;
        }
        try {
            const stored = localStorage.getItem('KefinTweaksConfig');
            if (stored) return JSON.parse(stored);
        } catch (e) { console.error(e); }
        return { scripts: {} };
    }

    // Open settings modal
    function openKefinTweaksSettingsModal() {
        const config = getKefinTweaksConfig();
        const currentScripts = config.scripts || {};
        const definitions = window.KefinTweaks?.ScriptDefinitions || [];

        const content = document.createElement('div');
        content.style.padding = '1em';

        // Header
        const header = document.createElement('p');
        header.textContent = 'Enable or disable individual KefinTweaks components below. Changes require a page reload.';
        content.appendChild(header);

        // Group scripts by some category? Or just list them.
        // Let's just list them alphabetically or by priority.
        
        const list = document.createElement('div');
        list.className = 'paperList';

        definitions.forEach(script => {
            // Skip internal scripts if needed, but 'settings' is internal so maybe hide it?
            if (script.name === 'settings' || script.name === 'utils' || script.name === 'cardBuilder') {
                 // Maybe hide core dependencies? Or let user disable them (risky)?
                 // Let's show them but maybe mark as "Core"
            }

            const item = document.createElement('div');
            item.className = 'listItem listItem-border';
            item.style.padding = '10px';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'space-between';

            const textContainer = document.createElement('div');
            textContainer.style.flex = '1';
            
            const title = document.createElement('div');
            title.className = 'listItemBodyText';
            title.textContent = script.name;
            title.style.fontWeight = 'bold';

            const desc = document.createElement('div');
            desc.className = 'listItemBodyText secondary';
            desc.textContent = script.description || 'No description available';

            textContainer.appendChild(title);
            textContainer.appendChild(desc);

            const checkboxContainer = document.createElement('div');
            const label = document.createElement('label');
            label.className = 'emby-checkbox-label';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'emby-checkbox';
            // Default to true if not specified in config (assuming defaults in loader are true)
            // But loader defaults are in loader.
            // We should check if it's explicitly false.
            // Actually, we should probably fetch defaults if config is empty.
            // For now, check if it's true in config or undefined (if default is true)
            // This is tricky without access to DEFAULT_ENABLED_SCRIPTS from loader.
            // But 'currentScripts' comes from config.
            // If currentScripts[name] is defined, use it.
            // If not, we don't know the default.
            // Let's assume true if undefined? Or false?
            // Most scripts are enabled by default.
            
            const isEnabled = currentScripts[script.name] !== false; 
            checkbox.checked = isEnabled;
            
            checkbox.dataset.scriptName = script.name;

            const span = document.createElement('span');
            span.className = 'checkboxLabel';
            span.textContent = isEnabled ? 'Enabled' : 'Disabled';

            checkbox.addEventListener('change', () => {
                span.textContent = checkbox.checked ? 'Enabled' : 'Disabled';
            });

            label.appendChild(checkbox);
            label.appendChild(span);
            checkboxContainer.appendChild(label);

            item.appendChild(textContainer);
            item.appendChild(checkboxContainer);
            list.appendChild(item);
        });

        content.appendChild(list);

        // Footer
        const footer = document.createElement('div');
        footer.style.display = 'flex';
        footer.style.justifyContent = 'flex-end';
        footer.style.gap = '1em';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btnCancel raised emby-button button-cancel';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => closeSimpleModal(MODAL_ID);

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btnSubmit raised emby-button button-submit';
        saveBtn.textContent = 'Save & Reload';
        saveBtn.onclick = async () => {
            const checkboxes = list.querySelectorAll('input[type="checkbox"]');
            const newScripts = {};
            checkboxes.forEach(cb => {
                newScripts[cb.dataset.scriptName] = cb.checked;
            });

            const newConfig = {
                ...config,
                scripts: newScripts
            };

            // Save to localStorage
            localStorage.setItem('KefinTweaksConfig', JSON.stringify(newConfig));
            window.KefinTweaksConfig = newConfig;

            // Reload page
            window.location.reload();
        };

        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);

        createSimpleModal(MODAL_ID, 'KefinTweaks Settings', content, footer);
    }

    // Add plugin card
    function addKefinTweaksPluginCard(container) {
        if (!container) return;
        if (container.querySelector('[data-id="kefinTweaksPlugin"]')) return;

        const card = document.createElement('div');
        card.className = 'card backdropCard scalableCard backdropCard-scalable';
        card.setAttribute('data-id', 'kefinTweaksPlugin');
        
        // Simple card structure mimicking Jellyfin cards
        card.innerHTML = `
            <div class="cardBox visualCardBox">
                <div class="cardScalable visualCardBox-cardScalable">
                    <div class="cardPadder backdropCard-scalable-padder"></div>
                    <div class="cardContent">
                        <div class="cardImageContainer" style="cursor: pointer; background: linear-gradient(to bottom, #202020, #101010); display: flex; align-items: center; justify-content: center;">
                            <div style="font-size: 1.5em; font-weight: bold; color: white;">KefinTweaks</div>
                        </div>
                    </div>
                </div>
                <div class="cardFooter visualCardBox-cardFooter">
                    <div class="cardText">KefinTweaks</div>
                    <div class="cardText cardText-secondary">Settings</div>
                </div>
            </div>
        `;

        // Click handler
        const clickTarget = card.querySelector('.cardImageContainer');
        if (clickTarget) {
            clickTarget.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                openKefinTweaksSettingsModal();
            };
        }

        container.appendChild(card);
    }

    function checkForPluginsPage(view, element, hash) {
        if (hash && hash.includes('dashboard/plugins')) {
            const pluginsPage = document.querySelector('#pluginsPage:not(.hide)');
            if (pluginsPage) {
                // Try different selectors for installed plugins container
                let installedPlugins = pluginsPage.querySelector('.installedPlugins') || 
                                     pluginsPage.querySelector('.sectionTitle + div'); // Fallback
                
                if (installedPlugins) {
                    addKefinTweaksPluginCard(installedPlugins);
                } else {
                    // Retry
                    setTimeout(() => checkForPluginsPage(view, element, hash), 500);
                }
            }
        }
    }

    function init() {
        // Hook into viewshow
        document.addEventListener('viewshow', (e) => {
             checkForPluginsPage(e.target, e.target, window.location.hash);
        }, true);
        
        // Check current view immediately
        checkForPluginsPage(null, null, window.location.hash);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
