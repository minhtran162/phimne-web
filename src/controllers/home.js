import TabbedView from '../components/tabbedview/tabbedview';
import globalize from '../lib/globalize';
import '../elements/emby-tabs/emby-tabs';
import '../elements/emby-button/emby-button';
import '../elements/emby-scroller/emby-scroller';
import LibraryMenu from '../scripts/libraryMenu';
import JellyfinSlideshow from '../elements/jellyfin-slide/JellyfinSpotlight.jsx';
import React from 'react';
import { createRoot } from 'react-dom/client';
import browser from '../scripts/browser';

class HomeView extends TabbedView {
    constructor(view, params) {
        super(view, params);
        this.hideObserver = null;
        this.setupHideDetection();
    }

    setTitle() {
        LibraryMenu.setTitle(null);
    }

    onPause() {
        super.onPause(this);
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    }

    onResume(options) {
        super.onResume(this, options);
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
        this.setupHideDetection();
    }

    setupHideDetection() {
        if (this.hideObserver) {
            this.hideObserver.disconnect();
        }

        // Create a MutationObserver to watch for class changes
        this.hideObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    this.checkForHideClass();
                    this.checkForNonHideClass();
                }
            });
        });

        this.startObserving();
        this.checkForHideClass();
    }

    startObserving() {
        const targetSelectors = [
            '.page.homePage'
        ];

        targetSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                this.hideObserver.observe(element, {
                    attributes: true,
                    attributeFilter: ['class']
                });
            });
        });
    }

    checkForNonHideClass() {
        const targetElements = document.querySelectorAll('.page.homePage');

        for (const element of targetElements) {
            if (!element.classList.contains('hide') && (!browser.web0s)) {
                this.createSlideshow();
                break;
            }
        }
    }

    checkForHideClass() {
        const targetElements = document.querySelectorAll('.page.homePage');

        for (const element of targetElements) {
            if (element.classList.contains('hide')) {
                this.destroySlideshow();
                break;
            }
        }
    }

    createSlideshow() {
        const instance = this;

        const slideshowContainer = document.createElement('div');
        slideshowContainer.className = 'slides-container';
        slideshowContainer.style.position = 'relative';
        slideshowContainer.style.zIndex = 10;

        const tabContent = instance.view.querySelector(".tabContent[data-index='0']");
        tabContent.insertBefore(slideshowContainer, tabContent.firstChild);

        const root = createRoot(slideshowContainer);
        root.render(React.createElement(JellyfinSlideshow));
        instance.slideshowRoot = root; // Store the root reference
    }

    destroySlideshow() {
        if (this.slideshowRoot) {
            this.slideshowRoot.unmount();
            this.slideshowRoot = null;

            const slideshowContainer = document.querySelector('.slides-container');
            if (slideshowContainer) {
                slideshowContainer.remove();
            }
        }
    }

    getDefaultTabIndex() {
        return 0;
    }

    getTabs() {
        return [{
            name: globalize.translate('Home')
        }, {
            name: globalize.translate('Favorites')
        }, {
            name: globalize.translate('Watchlist')
        }];
    }

    getTabController(index) {
        if (index == null) {
            throw new Error('index cannot be null');
        }

        let depends = '';

        switch (index) {
            case 0:
                depends = 'hometab';
                break;

            case 1:
                depends = 'favorites';

            case 2:
                depends = 'watchlist';
                break;
        }

        const instance = this;
        return import(/* webpackChunkName: "[request]" */ `../controllers/${depends}`).then(({ default: ControllerFactory }) => {
            let controller = instance.tabControllers[index];

            if (!controller) {
                controller = new ControllerFactory(instance.view.querySelector(".tabContent[data-index='" + index + "']"), instance.params);
                instance.tabControllers[index] = controller;
            }

            return controller;
        });
    }

    // Clean up observer when view is destroyed
    destroy() {
        if (this.hideObserver) {
            this.hideObserver.disconnect();
            this.hideObserver = null;
        }
        this.destroySlideshow();
        if (super.destroy) {
            super.destroy();
        }
    }
}

export default HomeView;
