import datetime from 'scripts/datetime';
import globalize from 'lib/globalize';
import browser from 'scripts/browser';

// Jellyfin Card Builder
// This module provides a main entry point function to build Jellyfin cards
// Usage: window.cardBuilder.buildCard(jellyfinItem)

(function () {
    'use strict';

    // Cache DOM queries and frequently used values
    const cache = {
        serverId: null,
        serverAddress: null,
        userId: null
    };

    function getCachedApiData() {
        if (!cache.serverId) {
            cache.serverId = ApiClient.serverId();
            cache.serverAddress = ApiClient.serverAddress();
            cache.userId = ApiClient.getCurrentUserId();
        }
        return cache;
    }

    // Helper: Fisher-Yates shuffle
    function shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // Helper function to check if item is a folder
    function isFolder(item) {
        return ['Series', 'Folder', 'MusicAlbum', 'Artist', 'CollectionFolder', 'Playlist'].includes(item.Type);
    }

    /**
     * Sorts items based on sort order and direction
     * @param {Array} items - Array of Jellyfin items
     * @param {string} sortOrder - Sort order: Random, ReleaseDate, CriticRating, CommunityRating, SortTitle, DateAdded
     * @param {string} sortOrderDirection - Direction: Ascending or Descending
     * @returns {Array} - Sorted array
     */
    function sortItems(items, sortOrder = 'Random', sortOrderDirection = 'Ascending') {
        if (!items || items.length === 0) return items;

        const ascending = sortOrderDirection === 'Ascending';
        const sorted = [...items];

        switch (sortOrder) {
            case 'Random':
                return shuffle(sorted);
            case 'ReleaseDate':
                return sorted.sort((a, b) => {
                    const dateA = new Date(a.PremiereDate || a.ProductionYear || 0);
                    const dateB = new Date(b.PremiereDate || b.ProductionYear || 0);
                    return ascending ? dateA - dateB : dateB - dateA;
                });
            case 'CriticRating':
                return sorted.sort((a, b) => {
                    const ratingA = a.CriticRating || 0;
                    const ratingB = b.CriticRating || 0;
                    return ascending ? ratingA - ratingB : ratingB - ratingA;
                });
            case 'CommunityRating':
                return sorted.sort((a, b) => {
                    const ratingA = a.CommunityRating || 0;
                    const ratingB = b.CommunityRating || 0;
                    return ascending ? ratingA - ratingB : ratingB - ratingA;
                });
            case 'SortTitle':
                return sorted.sort((a, b) => {
                    const titleA = (a.SortTitle || a.Name || '').toLowerCase();
                    const titleB = (b.SortTitle || b.Name || '').toLowerCase();
                    return ascending ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
                });
            case 'DateAdded':
                return sorted.sort((a, b) => {
                    const dateA = new Date(a.DateCreated || 0);
                    const dateB = new Date(b.DateCreated || 0);
                    return ascending ? dateA - dateB : dateB - dateA;
                });
            default:
                return sorted;
        }
    }

    /**
     * Picks a random card format for a section
     * @returns {string} - Random card format: 'portrait', 'thumb'
     */
    function getRandomCardFormat() {
        return ['portrait', 'thumb'][Math.floor(Math.random() * 2)];
    }

    /**
     * Creates a DOM element with specified tag, class, and attributes
     * @param {string} tagName - HTML tag name
     * @param {string} className - CSS class name(s)
     * @param {Object} attributes - Key-value pairs of attributes
     * @param {string} textContent - Optional text content
     * @returns {HTMLElement} - Created element
     */
    function createElement(tagName, className = '', attributes = {}, textContent = '') {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        if (textContent) element.textContent = textContent;
        return element;
    }

    /**
     * Creates a link element with common Jellyfin styling
     * @param {Object} options - Link configuration
     * @param {string} options.href - Link URL
     * @param {string} options.className - Additional CSS classes
     * @param {string} options.title - Link title
     * @param {Object} options.attributes - Additional attributes
     * @param {string} options.textContent - Link text content
     * @returns {HTMLElement} - Created link
     */
    function createLinkElement(options = {}) {
        const {
            href = '#',
            className = 'itemAction textActionButton',
            title = '',
            attributes = {},
            textContent = ''
        } = options;

        return createElement('a', className, {
            href,
            title,
            ...attributes
        }, textContent);
    }

    /**
     * Creates a text container with BDI wrapper for proper text direction
     * @param {string} text - Text content
     * @param {string} className - Container class name
     * @returns {HTMLElement} - Text container
     */
    function createTextContainer(text, className = 'cardText cardTextCentered') {
        const container = createElement('div', className);
        const bdi = createElement('bdi');
        bdi.textContent = text || 'Unknown';
        container.appendChild(bdi);
        return container;
    }

    /**
     * Creates a card indicators container
     * @param {Array} indicators - Array of indicator HTML strings
     * @returns {HTMLElement} - Card indicators container
     */
    function createCardIndicators(indicators = []) {
        if (indicators.length === 0) return null;

        const container = createElement('div', 'cardIndicators');
        indicators.forEach(html => {
            const temp = document.createElement('div');
            temp.innerHTML = html;
            container.appendChild(temp.firstChild);
        });
        return container;
    }

    /**
     * Creates a blurhash canvas element
     * @returns {HTMLCanvasElement} - Blurhash canvas element
     */
    function createBlurhashCanvas() {
        if (cache.blurhashCanvas) {
            return cache.blurhashCanvas.cloneNode();
        }

        const canvas = createElement('canvas', 'blurhash-canvas lazy-hidden', {
            'aria-hidden': 'true'
        });
        canvas.width = 20;
        canvas.height = 20;

        cache.blurhashCanvas = canvas;
        return canvas.cloneNode();
    }

    /**
     * Creates a card overlay button
     * @param {Object} options - Button configuration
     * @param {string} options.className - Additional CSS classes
     * @param {string} options.title - Button title/tooltip
     * @param {string} options.icon - Material icon name
     * @param {string} options.action - Data-action attribute
     * @param {Object} options.attributes - Additional attributes
     * @returns {HTMLElement} - Created button
     */
    function createOverlayButton(options = {}) {
        const {
            className = '',
            title = '',
            icon = 'play_arrow',
            action = 'play',
            attributes = {}
        } = options;

        const button = createElement('button',
            `cardOverlayButton cardOverlayButton-br itemAction paper-icon-button-light ${className}`,
            {
                'is': 'paper-icon-button-light',
                'data-action': action,
                'title': title,
                ...attributes
            }
        );

        button.innerHTML = `<span class="material-icons cardOverlayButtonIcon ${icon}" aria-hidden="true"></span>`;
        return button;
    }

    /**
     * Creates an icon element based on item type
     * @param {string} itemType - Type of item (Movie, Series, Episode, etc.)
     * @returns {HTMLElement} - Icon element
     */
    function createIcon(itemType) {
        const iconMap = {
            'Movie': 'movie',
            'Series': 'tv',
            'Episode': 'tv',
            'MusicAlbum': 'album',
            'MusicArtist': 'person',
            'Folder': 'folder',
            'default': 'videocam'
        };

        const iconType = iconMap[itemType] || iconMap.default;

        const icon = createElement('span', 'cardImageIcon material-icons ' + iconType, {
            'aria-hidden': 'true'
        });
        icon.textContent = iconType;
        return icon;
    }

    // Shared helper: Create blurhash canvas
    function createBlurhashCanvas() {
        const canvas = document.createElement('canvas');
        canvas.setAttribute('aria-hidden', 'true');
        canvas.width = 20;
        canvas.height = 20;
        canvas.className = 'blurhash-canvas lazy-hidden';
        return canvas;
    }

    /**
     * Determines if item is a folder
     * @param {Object} item - Item object
     * @returns {boolean} - True if item is a folder
     */
    function isFolder(item) {
        return item.IsFolder || ['Series', 'Season', 'BoxSet', 'MusicAlbum'].includes(item.Type);
    }

    /**
     * Optimized Image Fetcher for Jellyfin
     * @param {Object} item - The Jellyfin item object
     * @param {String} type - 'backdrop', 'thumb', 'square', or 'portrait'
     * @param {Object} options - { width, height, quality, fillWidth, fillHeight } (CSS pixels)
     * @param {String} serverAddress - Base URL of the server
     */
    function getImageUrl(item, type, options = {}, serverAddress) {
        if (!item) return '';

        // 1. Calculate dimensions based on Device Pixel Ratio (DPR)
        const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

        // Helper to build the final URL
        const buildUrl = (itemId, imageType, tag) => {
            const urlParams = new URLSearchParams();

            // Base quality params
            urlParams.set('tag', tag);
            urlParams.set('quality', options.quality || 90); // 90 is usually indistinguishable from 96 but smaller

            // Calculate physical pixels requested from server
            // If width is provided, scale it by DPR. Jellyfin will resize server-side.
            if (options.width) {
                urlParams.set('maxWidth', Math.round(options.width * dpr));
            }
            if (options.height) {
                urlParams.set('maxHeight', Math.round(options.height * dpr));
            }

            // Handle specific "Fill" logic (cropping) if needed
            if (options.fillWidth && options.fillHeight) {
                urlParams.set('fillWidth', Math.round(options.fillWidth * dpr));
                urlParams.set('fillHeight', Math.round(options.fillHeight * dpr));
            }

            return `${serverAddress}/Items/${itemId}/Images/${imageType}?${urlParams.toString()}`;
        };

        // Destructure item properties for easier access
        const {
            Id,
            ImageTags = {},
            ParentThumbImageTag,
            ParentThumbItemId,
            BackdropImageTags = [],
            ParentBackdropImageTags = [],
            ParentBackdropItemId,
            SeriesPrimaryImageTag,
            SeriesId
        } = item;

        // 2. Fallback Logic Chain
        switch (type) {
            case 'backdrop':
            case 'thumb':
                // Priority: Thumb -> Backdrop -> Parent Backdrop
                if (ImageTags.Thumb)
                    return buildUrl(Id, 'Thumb', ImageTags.Thumb);

                if (BackdropImageTags[0])
                    return buildUrl(Id, 'Backdrop', BackdropImageTags[0]);

                if (ParentBackdropImageTags?.[0] && ParentBackdropItemId)
                    return buildUrl(ParentBackdropItemId, 'Backdrop', ParentBackdropImageTags[0]);
                break;

            case 'square':
                // Priority: Primary -> Thumb
                if (ImageTags.Primary)
                    return buildUrl(Id, 'Primary', ImageTags.Primary);

                if (ImageTags.Thumb)
                    return buildUrl(Id, 'Thumb', ImageTags.Thumb);
                break;

            case 'portrait':
            default: // Default covers 'portrait' logic
                // Priority: Primary -> Thumb -> Parent Thumb -> Series Primary
                if (ImageTags.Primary)
                    return buildUrl(Id, 'Primary', ImageTags.Primary);

                if (ImageTags.Thumb)
                    return buildUrl(Id, 'Thumb', ImageTags.Thumb);

                if (ParentThumbImageTag && ParentThumbItemId)
                    return buildUrl(ParentThumbItemId, 'Thumb', ParentThumbImageTag);

                if (SeriesPrimaryImageTag && SeriesId)
                    return buildUrl(SeriesId, 'Primary', SeriesPrimaryImageTag);
                break;
        }
        return '';
    }

    // Shared helper: Get card format configuration
    function getCardFormatConfig(cardFormat, itemType, overflowCard, isMobile = false) {
        const format = cardFormat?.toLowerCase();

        if (['Series', 'Movie'].includes(itemType) && format !== 'square') {
            return {
                cardClass: overflowCard ? 'overflowPortraitCard' : 'portraitCard',
                padderClass: overflowCard ? 'cardPadder-overflowPortrait' : 'cardPadder-portrait',
                imageParams: isMobile ? { fillHeight: 200, fillWidth: 130, quality: 80 } : { fillHeight: 278, fillWidth: 185, quality: 96 }
            };
        }

        if (format === 'backdrop' || format === 'thumb' || itemType === 'Episode' || itemType === 'TvChannel') {
            return {
                cardClass: overflowCard ? 'overflowBackdropCard' : 'backdropCard',
                padderClass: overflowCard ? 'cardPadder-overflowBackdrop' : 'cardPadder-backdrop',
                imageParams: { fillHeight: 267, fillWidth: 474, quality: 90 }
            };
        }

        if (format === 'square' || ['MusicAlbum', 'Audio', 'Artist', 'MusicArtist'].includes(itemType)) {
            return {
                cardClass: overflowCard ? 'overflowSquareCard' : 'squareCard',
                padderClass: overflowCard ? 'cardPadder-overflowSquare' : 'cardPadder-square',
                imageParams: { fillHeight: 297, fillWidth: 297, quality: 90 }
            };
        }

        return {
            cardClass: overflowCard ? 'overflowPortraitCard' : 'portraitCard',
            padderClass: overflowCard ? 'cardPadder-overflowPortrait' : 'cardPadder-portrait',
            imageParams: isMobile ? { fillHeight: 200, fillWidth: 130, quality: 80 } : { fillHeight: 278, fillWidth: 185, quality: 96 }
        };
    }

    // Shared helper: Create text element
    function createCardText(item, serverId, serverAddress, className = 'cardText cardTextCentered cardText-first') {
        const textContainer = document.createElement('div');
        textContainer.className = className;

        const bdi = document.createElement('bdi');
        const link = document.createElement('a');
        link.href = `${serverAddress}/web/#/details?id=${item.Id}&serverId=${serverId}`;
        link.className = 'itemAction textActionButton';
        link.setAttribute('data-id', item.Id);
        link.setAttribute('data-serverid', serverId);
        link.setAttribute('data-type', item.Type);
        link.setAttribute('data-action', 'link');
        link.title = item.Name || 'Unknown';
        link.textContent = item.Name || 'Unknown';

        bdi.appendChild(link);
        textContainer.appendChild(bdi);

        return textContainer;
    }

    // Shared helper: Get year text
    function getYearText(item) {
        let yearText = '';
        if (item.Type === 'Series') {
            const startYear = item.PremiereDate?.substring(0, 4) || item.ProductionYear || '';
            if (item.Status === 'Continuing') {
                yearText = globalize.translate('SeriesYearToPresent', startYear);
            } else if (item.EndDate && item.ProductionYear) {
                const endYear = datetime.toLocaleString(datetime.parseISO8601Date(item.EndDate).getFullYear(), { useGrouping: false });
                yearText = `${startYear} - ${endYear}`;
            } else {
                yearText = startYear;
            }
        } else {
            yearText = item.ProductionYear || '';
        }
        return yearText;
    }

    // Create Mobile Card
    function createMobileCard(item, overflowCard, cardFormat, serverId, serverAddress) {
        const card = document.createElement('div');
        const isFolderItem = isFolder(item);

        const config = getCardFormatConfig(cardFormat, item.Type, true, true); // isMobile=true for optimization

        // Set card classes
        const cardClasses = ['card', config.cardClass, 'card-withuserdata'];
        if (isFolderItem) {
            cardClasses.push('groupedCard');
        }
        card.className = cardClasses.join(' ');

        // Set card attributes
        card.setAttribute('data-index', '0');
        card.setAttribute('data-isfolder', isFolderItem.toString());
        card.setAttribute('data-serverid', serverId);
        card.setAttribute('data-id', item.Id);
        card.setAttribute('data-type', item.Type);
        card.setAttribute('data-mediatype', item.MediaType || 'Unknown');
        if (item.Path) card.setAttribute('data-path', item.Path);
        card.setAttribute('data-context', 'home');
        if (item.EndDate) card.setAttribute('data-enddate', item.EndDate);
        if (item.Name?.startsWith('The ')) card.setAttribute('data-prefix', 'THE');

        // Create cardBox
        const cardBox = document.createElement('div');
        cardBox.className = 'cardBox cardBox-bottompadded';

        // Create cardScalable
        const cardScalable = document.createElement('div');
        cardScalable.className = 'cardScalable';

        // Create cardPadder
        const cardPadder = document.createElement('div');
        cardPadder.className = `cardPadder ${config.padderClass} lazy-hidden-children`;
        cardPadder.appendChild(createIcon(item.Type));

        // Create blurhash canvas
        const canvas = createBlurhashCanvas();

        // Create cardImageContainer
        const cardImageContainer = document.createElement('a');
        cardImageContainer.href = `#/details?id=${item.Id}&serverId=${serverId}`;
        cardImageContainer.setAttribute('data-action', 'link');
        cardImageContainer.className = 'cardImageContainer coveredImage cardContent itemAction lazy blurhashed lazy-image-fadein-fast';
        cardImageContainer.setAttribute('aria-label', item.Name || 'Unknown');

        // Set background image
        const imageUrl = getImageUrl(item, cardFormat, config.imageParams, serverAddress);
        if (imageUrl) {
            cardImageContainer.style.backgroundImage = `url("${imageUrl}")`;
        }

        // Add indicators for folders (ChildCount) or played status
        if (isFolderItem && item.ChildCount !== undefined) {
            const cardIndicators = document.createElement('div');
            cardIndicators.className = 'cardIndicators';

            const countIndicator = document.createElement('div');
            countIndicator.className = 'countIndicator indicator';
            countIndicator.textContent = item.ChildCount;
            cardIndicators.appendChild(countIndicator);

            cardImageContainer.appendChild(cardIndicators);
        }

        // Create play button
        const playButton = document.createElement('button');
        playButton.setAttribute('is', 'paper-icon-button-light');
        playButton.className = 'cardOverlayButton cardOverlayButton-br itemAction paper-icon-button-light';
        playButton.setAttribute('data-action', 'play');
        playButton.title = 'Phát';
        playButton.innerHTML = '<span class="material-icons cardOverlayButtonIcon play_arrow" aria-hidden="true"></span>';

        // Assemble cardScalable
        cardScalable.appendChild(cardPadder);
        cardScalable.appendChild(canvas);
        cardScalable.appendChild(cardImageContainer);
        cardScalable.appendChild(playButton);

        // Add cardScalable to cardBox
        cardBox.appendChild(cardScalable);

        // Create card text based on item type
        if (item.Type === 'Episode') {
            // Episode: First line is Series name, second line is episode info
            const seriesText = createCardText({ ...item, Id: item.SeriesId || item.Id, Name: item.SeriesName || 'Unknown Series', Type: 'Series' }, serverId, serverAddress);
            cardBox.appendChild(seriesText);

            // Episode info
            const episodeText = document.createElement('div');
            episodeText.className = 'cardText cardTextCentered cardText-secondary';

            const episodeBdi = document.createElement('bdi');
            const episodeLink = document.createElement('a');
            episodeLink.href = `#/details?id=${item.Id}&serverId=${serverId}`;
            episodeLink.setAttribute('data-id', item.Id);
            episodeLink.setAttribute('data-serverid', serverId);
            episodeLink.setAttribute('data-type', 'Episode');
            episodeLink.setAttribute('data-mediatype', 'undefined');
            episodeLink.setAttribute('data-channelid', 'undefined');
            episodeLink.setAttribute('data-isfolder', 'false');
            episodeLink.className = 'itemAction textActionButton';

            const episodeTitle = item.IndexNumber && item.ParentIndexNumber
                ? `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`
                : item.Name;
            episodeLink.title = episodeTitle;
            episodeLink.setAttribute('data-action', 'link');
            episodeLink.textContent = episodeTitle;

            episodeBdi.appendChild(episodeLink);
            episodeText.appendChild(episodeBdi);
            cardBox.appendChild(episodeText);
        } else {
            // Movie or Series: First line is title
            cardBox.appendChild(createCardText(item, serverId, serverAddress));

            // Second line: Year info
            const secondaryText = document.createElement('div');
            secondaryText.className = 'cardText cardTextCentered cardText-secondary';
            secondaryText.innerHTML = `<bdi>${getYearText(item)}</bdi>`;
            cardBox.appendChild(secondaryText);
        }

        // Add cardBox to card
        card.appendChild(cardBox);
        return card;
    }

    // Create Desktop Card
    function createDesktopCard(item, overflowCard, cardFormat, serverId, serverAddress) {
        const config = getCardFormatConfig(cardFormat, item.Type, overflowCard, false);

        const card = document.createElement('div');
        card.className = `card ${config.cardClass} card-hoverable card-withuserdata itemAction`;
        card.setAttribute('data-index', '0');
        card.setAttribute('data-isfolder', isFolder(item).toString());
        card.setAttribute('data-serverid', serverId);
        card.setAttribute('data-id', item.Id);
        card.setAttribute('data-type', item.Type);
        card.setAttribute('data-mediatype', item.MediaType || 'Video');
        if (item.Path) card.setAttribute('data-path', item.Path);
        card.setAttribute('data-context', 'home');
        if (item.Name?.startsWith('The ')) card.setAttribute('data-prefix', 'THE');

        const cardBox = document.createElement('div');
        cardBox.className = 'cardBox cardBox-bottompadded';

        const cardScalable = document.createElement('div');
        cardScalable.className = 'cardScalable';

        const cardPadder = document.createElement('div');
        cardPadder.className = `cardPadder ${config.padderClass} lazy-hidden-children`;
        cardPadder.appendChild(createIcon(item.Type));

        const cardImageContainer = document.createElement('a');
        cardImageContainer.href = `${serverAddress}/web/#/details?id=${item.Id}&serverId=${serverId}`;
        cardImageContainer.className = 'cardImageContainer coveredImage cardContent itemAction lazy blurhashed lazy-image-fadein-fast';
        cardImageContainer.setAttribute('data-action', 'link');
        cardImageContainer.setAttribute('aria-label', item.Name || 'Unknown');

        const imageUrl = getImageUrl(item, cardFormat, config.imageParams, serverAddress);
        if (imageUrl) {
            cardImageContainer.style.backgroundImage = `url("${imageUrl}")`;
        } else {
            cardImageContainer.appendChild(createIcon(item.Type));
        }

        // Overlay with buttons
        const cardOverlayContainer = document.createElement('div');
        cardOverlayContainer.className = 'cardOverlayContainer itemAction';
        cardOverlayContainer.setAttribute('data-action', 'link');

        const overlayLink = document.createElement('a');
        overlayLink.href = cardImageContainer.href;
        overlayLink.className = 'cardImageContainer';
        cardOverlayContainer.appendChild(overlayLink);

        // Play button
        const playButton = document.createElement('button');
        playButton.setAttribute('is', 'paper-icon-button-light');
        playButton.className = 'cardOverlayButton cardOverlayButton-hover itemAction paper-icon-button-light cardOverlayFab-primary';
        playButton.setAttribute('data-action', 'resume');
        playButton.innerHTML = '<span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover play_arrow" aria-hidden="true"></span>';
        cardOverlayContainer.appendChild(playButton);

        // Button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'cardOverlayButton-br flex';

        // Watchlist button
        const watchlistButton = document.createElement('button');
        watchlistButton.type = 'button';
        watchlistButton.className = 'watchlist-button cardOverlayButton cardOverlayButton-hover itemAction paper-icon-button-light emby-button button-flat';
        watchlistButton.setAttribute('data-action', 'none');
        watchlistButton.setAttribute('data-id', item.Id);
        watchlistButton.setAttribute('data-active', 'false');
        watchlistButton.title = 'Add to Watchlist';
        watchlistButton.innerHTML = '<span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover watchlist" aria-hidden="true"></span>';
        buttonContainer.appendChild(watchlistButton);

        // Watched button
        const watchedButton = document.createElement('button');
        watchedButton.setAttribute('is', 'emby-playstatebutton');
        watchedButton.type = 'button';
        watchedButton.className = 'cardOverlayButton cardOverlayButton-hover itemAction paper-icon-button-light emby-button';
        watchedButton.setAttribute('data-action', 'none');
        watchedButton.setAttribute('data-id', item.Id);
        watchedButton.setAttribute('data-serverid', serverId);
        watchedButton.setAttribute('data-itemtype', item.Type);
        watchedButton.setAttribute('data-played', item.UserData?.Played || 'false');
        watchedButton.title = 'Mark played';
        watchedButton.innerHTML = '<span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover check playstatebutton-icon-unplayed" aria-hidden="true"></span>';
        buttonContainer.appendChild(watchedButton);

        // Favorite button
        const favoriteButton = document.createElement('button');
        favoriteButton.setAttribute('is', 'emby-ratingbutton');
        favoriteButton.type = 'button';
        favoriteButton.className = 'cardOverlayButton cardOverlayButton-hover itemAction paper-icon-button-light emby-button';
        favoriteButton.setAttribute('data-action', 'none');
        favoriteButton.setAttribute('data-id', item.Id);
        favoriteButton.setAttribute('data-serverid', serverId);
        favoriteButton.setAttribute('data-itemtype', item.Type);
        favoriteButton.setAttribute('data-isfavorite', item.UserData?.IsFavorite || 'false');
        favoriteButton.title = 'Add to favorites';
        favoriteButton.innerHTML = '<span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover favorite" aria-hidden="true"></span>';
        buttonContainer.appendChild(favoriteButton);

        // More button
        const moreButton = document.createElement('button');
        moreButton.setAttribute('is', 'paper-icon-button-light');
        moreButton.className = 'cardOverlayButton cardOverlayButton-hover itemAction paper-icon-button-light';
        moreButton.setAttribute('data-action', 'menu');
        moreButton.title = 'More';
        moreButton.innerHTML = '<span class="material-icons cardOverlayButtonIcon cardOverlayButtonIcon-hover more_vert" aria-hidden="true"></span>';
        buttonContainer.appendChild(moreButton);

        cardOverlayContainer.appendChild(buttonContainer);

        cardScalable.appendChild(cardPadder);
        cardScalable.appendChild(createBlurhashCanvas());
        cardScalable.appendChild(cardImageContainer);
        cardScalable.appendChild(cardOverlayContainer);

        cardBox.appendChild(cardScalable);
        cardBox.appendChild(createCardText(item, serverId, serverAddress));

        const secondaryText = document.createElement('div');
        secondaryText.className = 'cardText cardTextCentered cardText-secondary';
        secondaryText.innerHTML = `<bdi>${getYearText(item)}</bdi>`;
        cardBox.appendChild(secondaryText);

        card.appendChild(cardBox);
        return card;
    }

    // Create TV Card
    function createTVCard(item, overflowCard, cardFormat, customFooterText, serverId, serverAddress) {
        const config = getCardFormatConfig(cardFormat, item.Type, overflowCard, false);

        const card = document.createElement('button');
        card.type = 'button';

        card.className = `card ${config.cardClass} show-focus show-animation card-withuserdata itemAction`;
        card.setAttribute('data-index', '0');
        card.setAttribute('data-isfolder', ['Series', 'MusicAlbum', 'Artist'].includes(item.Type).toString());
        card.setAttribute('data-serverid', serverId);
        card.setAttribute('data-id', item.Id);
        card.setAttribute('data-type', item.Type);
        card.setAttribute('data-mediatype', item.MediaType || 'Video');
        if (item.Name?.startsWith('The ')) card.setAttribute('data-prefix', 'THE');
        card.setAttribute('data-action', 'link');
        card.setAttribute('data-context', 'home');
        card.setAttribute('aria-label', item.Name || 'Unknown');

        // Add path if available
        if (item.Path) {
            card.setAttribute('data-path', item.Path);
        }

        // Add endDate for Series
        if (item.Type === 'Series' && item.EndDate) {
            card.setAttribute('data-enddate', item.EndDate);
        }

        // Add positionticks for in-progress items
        if (item.UserData?.PlaybackPositionTicks) {
            card.setAttribute('data-positionticks', item.UserData.PlaybackPositionTicks);
        }

        // Add groupedCard class for Series
        if (item.Type === 'Series') {
            card.classList.add('groupedCard');
        }

        const cardBox = document.createElement('div');
        cardBox.className = 'cardBox cardBox-bottompadded';

        const cardScalable = document.createElement('div');
        cardScalable.className = 'cardScalable';

        const cardPadder = document.createElement('div');
        cardPadder.className = `cardPadder ${config.padderClass} lazy-hidden-children`;
        cardPadder.appendChild(createIcon(item.Type));

        const cardImageContainer = document.createElement('div');
        // Remove data-src attribute as it's not in target examples

        // Conditionally add coveredImage class
        let imageContainerClass = 'cardImageContainer cardContent lazy blurhashed lazy-image-fadein-fast';
        if (item.Type !== 'Episode' || config.cardClass !== 'overflowBackdropCard') {
            imageContainerClass = 'cardImageContainer coveredImage cardContent lazy blurhashed lazy-image-fadein-fast';
        }
        cardImageContainer.className = imageContainerClass;

        const imageUrl = getImageUrl(item, cardFormat, config.imageParams, serverAddress);
        if (imageUrl) {
            cardImageContainer.style.backgroundImage = `url("${imageUrl}")`;
        } else {
            cardImageContainer.appendChild(createIcon(item.Type));
        }

        // Add indicators container only if needed
        const hasIndicators = item.UserData?.Played || item.ChildCount || item.SeriesCount;
        if (hasIndicators) {
            const cardIndicators = document.createElement('div');
            cardIndicators.className = 'cardIndicators';

            if (item.UserData?.Played) {
                cardIndicators.innerHTML = '<div class="playedIndicator indicator"><span class="material-icons indicatorIcon check" aria-hidden="true"></span></div>';
            } else if (item.ChildCount || item.SeriesCount) {
                // For Series, show count indicator
                const count = item.ChildCount || item.SeriesCount;
                cardIndicators.innerHTML = `<div class="countIndicator indicator">${count}</div>`;
            }
            cardImageContainer.appendChild(cardIndicators);
        }

        // Add progress bar for in-progress items
        if (item.UserData?.PlaybackPositionTicks && item.RunTimeTicks) {
            const progressPercentage = (item.UserData.PlaybackPositionTicks / item.RunTimeTicks) * 100;
            const innerCardFooter = document.createElement('div');
            innerCardFooter.className = 'innerCardFooter fullInnerCardFooter innerCardFooterClear';

            const progressBar = document.createElement('div');
            progressBar.className = 'itemProgressBar';

            const progressBarForeground = document.createElement('div');
            progressBarForeground.className = 'itemProgressBarForeground';
            progressBarForeground.style.width = `${progressPercentage}%`;

            progressBar.appendChild(progressBarForeground);
            innerCardFooter.appendChild(progressBar);
            cardImageContainer.appendChild(innerCardFooter);
        }

        cardScalable.appendChild(cardPadder);
        cardScalable.appendChild(createBlurhashCanvas());
        cardScalable.appendChild(cardImageContainer);

        cardBox.appendChild(cardScalable);

        if (item.Type === 'Episode') {
            // For Episode, show Series name first
            const seriesText = createCardText({
                ...item,
                Id: item.SeriesId || item.Id,
                Name: item.SeriesName || 'Unknown Series',
                Type: 'Series'
            }, serverId, serverAddress);
            cardBox.appendChild(seriesText);

            // Episode number and name
            const episodeName = item.IndexNumber && item.ParentIndexNumber
                ? `S${item.ParentIndexNumber}:E${item.IndexNumber} - ${item.Name}`
                : item.Name;
            const secondaryText = document.createElement('div');
            secondaryText.className = 'cardText cardTextCentered cardText-secondary';
            secondaryText.innerHTML = `<bdi>${episodeName}</bdi>`;
            cardBox.appendChild(secondaryText);

            if (customFooterText) {
                const footerText = document.createElement('div');
                footerText.className = 'cardText cardTextCentered cardText-secondary';
                footerText.innerHTML = `<bdi>${customFooterText}</bdi>`;
                cardBox.appendChild(footerText);
            }
        } else {
            // For Series/Movie, show name and year
            const titleText = document.createElement('div');
            titleText.className = 'cardText cardTextCentered cardText-first';

            // For Series, include year in title if available
            let displayName = item.Name || 'Unknown';
            if (item.Type === 'Series' && item.ProductionYear) {
                displayName = `${item.Name} (${item.ProductionYear})`;
            }

            titleText.innerHTML = `<bdi>${displayName}</bdi>`;
            cardBox.appendChild(titleText);

            // Secondary text - year or date range
            const secondaryText = document.createElement('div');
            secondaryText.className = 'cardText cardTextCentered cardText-secondary';
            secondaryText.innerHTML = `<bdi>${getYearText(item)}</bdi>`;
            cardBox.appendChild(secondaryText);
        }
        card.appendChild(cardBox);
        return card;
    }

    // Main card creation function (router)
    function createJellyfinCardElement(item, overflowCard = false, cardFormat = null, customFooterText = null) {
        const { serverId, serverAddress } = getCachedApiData();

        // Detect layout once
        const isTVLayout = document.documentElement.classList.contains('layout-tv');
        const isMobileLayout = document.documentElement.classList.contains('layout-mobile');
        const isHomepage = document.querySelector('.page.homePage');

        if (isMobileLayout && isHomepage) {
            return createMobileCard(item, true, cardFormat, serverId, serverAddress);
        }

        if (isTVLayout) {
            return createTVCard(item, overflowCard, cardFormat, customFooterText, serverId, serverAddress);
        }

        return createDesktopCard(item, overflowCard, cardFormat, serverId, serverAddress);
    }

    // Main card builder object
    const cardBuilder = {
        buildCard: function (item, overflowCard = false, cardFormat = null, customFooterText = null) {
            return createJellyfinCardElement(item, overflowCard, cardFormat, customFooterText);
        },

        renderCards: function (items, title, viewMoreUrl = null, overflowCard = false, cardFormat = null, sortOrder = null, sortOrderDirection = 'Ascending') {
            let finalCardFormat = cardFormat === 'random' || cardFormat === 'Random'
                ? getRandomCardFormat()
                : cardFormat;

            let sortedItems = items;
            if (sortOrder && sortOrder !== 'Random') {
                sortedItems = sortItems(items, sortOrder, sortOrderDirection);
            } else if (sortOrder === 'Random') {
                sortedItems = shuffle([...items]);
            }

            return createScrollableContainer(sortedItems, title, viewMoreUrl, overflowCard, finalCardFormat);
        },

        renderCardsFromIds: async function (itemIds, title, viewMoreUrl = null, overflowCard = false, cardFormat = null, sortOrder = null, sortOrderDirection = 'Ascending') {
            if (!itemIds || itemIds.length === 0) {
                return createScrollableContainer([], title, viewMoreUrl, overflowCard, cardFormat);
            }

            try {
                const response = await ApiClient.getItems(ApiClient.getCurrentUserId(), {
                    Ids: itemIds.join(','),
                    Recursive: false
                });
                const items = response.Items;

                let finalCardFormat = cardFormat === 'random' || cardFormat === 'Random'
                    ? getRandomCardFormat()
                    : cardFormat;

                let sortedItems = items;
                if (sortOrder && sortOrder !== 'Random') {
                    sortedItems = sortItems(items, sortOrder, sortOrderDirection);
                } else if (sortOrder === 'Random') {
                    sortedItems = shuffle([...items]);
                }

                return createScrollableContainer(sortedItems, title, viewMoreUrl, overflowCard, finalCardFormat);
            } catch (error) {
                console.error('[KefinTweaks CardBuilder] Error fetching items:', error);
                return createScrollableContainer([], title, viewMoreUrl, overflowCard, cardFormat);
            }
        },

        renderSpotlightSection: function (items, title, options = {}) {
            return createSpotlightSection(items, title, options);
        },

        sortItems: function (items, sortOrder, sortOrderDirection) {
            return sortItems(items, sortOrder, sortOrderDirection);
        }
    };

    /**
     * Renders a spotlight section (Netflix-style slim banner carousel)
     * @param {Array} items - Array of Jellyfin item objects
     * @param {string} title - Title for the spotlight section
     * @param {Object} options - Options for the spotlight carousel
     * @param {boolean} options.autoPlay - Auto-cycle through items (default: true)
     * @param {number} options.interval - Auto-play interval in ms (default: 5000)
     * @param {boolean} options.showDots - Show dot indicators (default: true)
     * @param {boolean} options.showNavButtons - Show prev/next buttons (default: true)
     * @returns {HTMLElement} - The constructed spotlight container
     */
    function createSpotlightSection(items, title, options = {}) {
        if (!items || items.length === 0) {
            return document.createElement('div');
        }

        const {
            autoPlay = true,
            interval = 5000,
            showDots = true,
            showNavButtons = true,
            showClearArt = false,
            viewMoreUrl = null
        } = options;

        const { serverId, serverAddress } = getCachedApiData();
        let currentIndex = 0;
        let autoPlayTimer = null;
        let isPaused = false;

        const container = document.createElement('div');
        container.className = 'spotlight-section padded-left';

        const bannerContainer = document.createElement('div');
        bannerContainer.className = 'spotlight-banner-container';

        if (title) {
            let sectionTitleEl;

            if (viewMoreUrl) {
                const titleLink = document.createElement('a');
                titleLink.className = 'spotlight-section-title spotlight-title-link';
                titleLink.textContent = title;
                titleLink.title = 'See All';
                titleLink.style.textDecoration = 'none';

                const cssStyle = document.createElement('style');
                cssStyle.textContent = `.spotlight-title-link:hover { text-decoration: underline !important; }`;
                titleLink.appendChild(cssStyle);

                if (typeof viewMoreUrl === 'function') {
                    titleLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        viewMoreUrl();
                    });
                } else {
                    titleLink.href = viewMoreUrl;
                    titleLink.addEventListener('click', (e) => e.stopPropagation());
                }

                sectionTitleEl = titleLink;
            } else {
                sectionTitleEl = document.createElement('div');
                sectionTitleEl.className = 'spotlight-section-title';
                sectionTitleEl.textContent = title;
            }

            bannerContainer.appendChild(sectionTitleEl);
        }

        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'spotlight-items-container';

        items.forEach((item, index) => {
            const itemType = item.Type || 'Movie';
            const itemDiv = document.createElement('div');
            itemDiv.className = 'spotlight-item';
            itemDiv.setAttribute('data-index', index);
            itemDiv.style.opacity = index === 0 ? '1' : '0';

            let imageUrl = '';
            if (item.Type === 'Episode' && item.ParentBackdropImageTags?.[0]) {
                imageUrl = `${serverAddress}/Items/${item.ParentBackdropItemId}/Images/Backdrop?fillHeight=450&fillWidth=1920&quality=96&tag=${item.ParentBackdropImageTags[0]}`;
            } else if (item.BackdropImageTags?.[0]) {
                imageUrl = `${serverAddress}/Items/${item.Id}/Images/Backdrop?fillHeight=450&fillWidth=1920&quality=96&tag=${item.BackdropImageTags[0]}`;
            } else if (item.ImageTags?.Primary) {
                imageUrl = `${serverAddress}/Items/${item.Id}/Images/Primary?fillHeight=450&fillWidth=1920&quality=96&tag=${item.ImageTags.Primary}`;
            }

            if (imageUrl) {
                itemDiv.style.backgroundImage = `url("${imageUrl}")`;
            }

            const overlay = document.createElement('div');
            overlay.className = 'spotlight-overlay' + (title ? ' has-title' : '');

            let titleEl = null;
            const hasLogo = item.ImageTags?.Logo;

            if (hasLogo) {
                const logoUrl = `${serverAddress}/Items/${item.Id}/Images/Logo?fillHeight=200&quality=96&tag=${item.ImageTags.Logo}`;
                titleEl = document.createElement('img');
                titleEl.className = 'spotlight-item-logo';
                titleEl.src = logoUrl;
                titleEl.alt = item.Name || 'Unknown';
            } else {
                titleEl = document.createElement('h3');
                titleEl.className = 'spotlight-item-title';
                titleEl.textContent = item.Name || 'Unknown';
            }

            overlay.appendChild(titleEl);
            itemDiv.appendChild(overlay);

            if (showClearArt && item.ImageTags?.Art) {
                const clearArtUrl = `${serverAddress}/Items/${item.Id}/Images/Art?fillHeight=300&quality=96&tag=${item.ImageTags.Art}`;
                const clearArtEl = document.createElement('img');
                clearArtEl.className = 'spotlight-clearart';
                clearArtEl.src = clearArtUrl;
                clearArtEl.alt = item.Name || 'Unknown';
                itemDiv.appendChild(clearArtEl);
            }

            itemsContainer.appendChild(itemDiv);
        });

        bannerContainer.appendChild(itemsContainer);

        if (showNavButtons && items.length > 1) {
            const navContainer = document.createElement('div');
            navContainer.className = 'spotlight-nav-container';

            const prevButton = document.createElement('button');
            prevButton.className = 'spotlight-nav-button spotlight-nav-prev emby-button';
            prevButton.innerHTML = '<span class="material-icons">chevron_left</span>';
            prevButton.addEventListener('click', (e) => {
                e.stopPropagation();
                goToItem((currentIndex - 1 + items.length) % items.length, true);
            });

            const nextButton = document.createElement('button');
            nextButton.className = 'spotlight-nav-button spotlight-nav-next emby-button';
            nextButton.innerHTML = '<span class="material-icons">chevron_right</span>';
            nextButton.addEventListener('click', (e) => {
                e.stopPropagation();
                goToItem((currentIndex + 1) % items.length, true);
            });

            navContainer.appendChild(prevButton);
            navContainer.appendChild(nextButton);
            bannerContainer.appendChild(navContainer);
        }

        if (showDots && items.length > 1) {
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'spotlight-dots';

            items.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.className = 'spotlight-dot' + (index === 0 ? ' active' : '');
                dot.setAttribute('data-index', index);
                dot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    goToItem(index, true);
                });
                dotsContainer.appendChild(dot);
            });

            bannerContainer.appendChild(dotsContainer);
        }

        function goToItem(index, resetTimer = true) {
            if (index === currentIndex) return;

            const currentItem = bannerContainer.querySelector(`.spotlight-item[data-index="${currentIndex}"]`);
            const nextItem = bannerContainer.querySelector(`.spotlight-item[data-index="${index}"]`);

            if (currentItem && nextItem) {
                currentItem.style.opacity = '0';
                nextItem.style.opacity = '1';
            }

            currentIndex = index;

            if (showDots) {
                const dots = bannerContainer.querySelectorAll('.spotlight-dot');
                dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === index);
                });
            }

            if (resetTimer && autoPlay && !isPaused) {
                clearInterval(autoPlayTimer);
                autoPlayTimer = null;
                startAutoPlay();
            }
        }

        function startAutoPlay() {
            if (autoPlayTimer) {
                clearInterval(autoPlayTimer);
                autoPlayTimer = null;
            }

            if (!autoPlay || items.length <= 1 || isPaused) return;

            autoPlayTimer = setInterval(() => {
                goToItem((currentIndex + 1) % items.length, false);
            }, interval);
        }

        let isHovering = false;
        bannerContainer.addEventListener('mouseenter', () => {
            isHovering = true;
            if (autoPlayTimer) {
                clearInterval(autoPlayTimer);
                autoPlayTimer = null;
            }
        });

        bannerContainer.addEventListener('mouseleave', () => {
            isHovering = false;
            if (autoPlay && !isPaused && !isHovering) {
                startAutoPlay();
            }
        });

        if (autoPlay) {
            startAutoPlay();
        }

        let touchStartX = 0;
        let touchStartY = 0;

        bannerContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        bannerContainer.addEventListener('touchmove', (e) => {
            if (!e.touches[0]) return;

            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = touchX - touchStartX;
            const deltaY = touchY - touchStartY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (e.cancelable) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        }, { passive: false });

        bannerContainer.addEventListener('touchend', (e) => {
            if (!e.changedTouches[0]) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
                // Stop propagation to prevent parent handlers (like tab switching)
                e.stopPropagation();

                if (deltaX > 0) {
                    // Swipe right (previous)
                    goToItem((currentIndex - 1 + items.length) % items.length, true);
                } else {
                    // Swipe left (next)
                    goToItem((currentIndex + 1) % items.length, true);
                }
            }
        }, { passive: true });

        container.appendChild(bannerContainer);

        return container;
    }

    /**
     * Creates a scrollable container with horizontal scrolling functionality
     * @param {Array} items - Array of Jellyfin item objects
     * @param {string} title - Title for the scrollable container
     * @param {string} viewMoreUrl - Optional URL to make title clickable
     * @param {boolean} overflowCard - Use overflow card classes instead of normal card classes
     * @param {string} cardFormat - Override card format: 'portrait', 'backdrop', or 'square'
     * @returns {HTMLElement} - The constructed scrollable container
     */
    function createScrollableContainer(items, title, viewMoreUrl = null, overflowCard = false, cardFormat = null) {
        // Create the main vertical section container
        const verticalSection = document.createElement('div');
        // Conditionally set container classes based on platform
        verticalSection.className = browser.tizen
            ? 'verticalSection'
            : 'verticalSection emby-scroller-container custom-scroller-container';

        // Create section title
        const sectionTitleContainer = document.createElement('div');
        sectionTitleContainer.className = 'sectionTitleContainer sectionTitleContainer-cards padded-left';

        if (viewMoreUrl) {
            // Create clickable title with chevron icon
            const titleLink = document.createElement('a');
            titleLink.className = 'sectionTitle-link sectionTitleTextButton';
            titleLink.style.cssText = 'text-decoration: none; cursor: pointer; display: flex; align-items: center;';

            // Handle both URL and function
            if (typeof viewMoreUrl === 'function') {
                titleLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    viewMoreUrl();
                });
            } else {
                titleLink.href = viewMoreUrl;
            }

            const titleText = document.createElement('h2');
            titleText.className = 'sectionTitle sectionTitle-cards';
            titleText.textContent = title;

            const chevronIcon = document.createElement('span');
            chevronIcon.className = 'material-icons chevron_right';
            chevronIcon.setAttribute('aria-hidden', 'true');

            titleLink.appendChild(titleText);
            titleLink.appendChild(chevronIcon);
            sectionTitleContainer.appendChild(titleLink);
        } else {
            // Regular non-clickable title
            const titleText = document.createElement('h2');
            titleText.className = 'sectionTitle sectionTitle-cards';
            titleText.textContent = title;
            sectionTitleContainer.appendChild(titleText);
        }

        // Create "Show All" button
        const showAllButton = document.createElement('button');
        showAllButton.type = 'button';
        showAllButton.className = 'show-all-button';
        showAllButton.style.cssText = 'margin-left: 10px; font-size: 12px; padding: 4px 8px; min-width: auto; background: transparent; border: 1px solid rgba(255, 255, 255, 0.3) !important; border-radius: 4px; cursor: pointer; color: var(--main-text, #fff) !important; margin-bottom: .35em; align-self: center;';
        showAllButton.textContent = 'Expand';
        showAllButton.title = 'Show all items';


        const scroller = document.createElement('div');
        scroller.setAttribute('is', 'emby-scroller');

        if (browser.tizen) {
            // Tizen TV optimized settings (keep as-is)
            scroller.className = 'padded-top-focusscale padded-bottom-focusscale emby-scroller';
            scroller.setAttribute('data-centerfocus', 'true');
            scroller.setAttribute('data-scroll-mode-x', 'custom');
            scroller.style.overflow = 'hidden';
        } else {
            scroller.setAttribute('data-horizontal', 'true');  // Critical for horizontal swipe
            scroller.setAttribute('data-centerfocus', 'card'); // Proper focus handling
            scroller.setAttribute('data-scroll-mode-x', 'custom');
            scroller.style.overflow = '';
            scroller.className = '';
        }

        // Create items container
        const itemsContainer = document.createElement('div');
        itemsContainer.setAttribute('is', 'emby-itemscontainer');
        itemsContainer.className = 'itemsContainer scrollSlider focuscontainer-x animatedScrollX';
        itemsContainer.style.whiteSpace = 'nowrap';

        // Add items to container
        items.forEach((item, index) => {
            const card = createJellyfinCardElement(item, overflowCard, cardFormat);
            card.setAttribute('data-index', index);
            itemsContainer.appendChild(card);
        });

        scroller.appendChild(itemsContainer);

        // Add "Show All" button to title if there are more than 20 items
        if (items.length > 20) {
            sectionTitleContainer.appendChild(showAllButton);
        }

        // Toggle between scroll and grid view
        let isShowingAll = false;
        let originalTransform = 'translateX(0px)';
        let originalStyle = itemsContainer.style.cssText;
        let originalScrollerStyle = scroller.style.cssText;

        // Store the original transition for restoration
        const storeOriginalStyles = () => {
            originalTransform = itemsContainer.style.transform || 'translateX(0px)';
            originalStyle = itemsContainer.style.cssText;
            originalScrollerStyle = scroller.style.cssText;
        };

        // Initial store
        setTimeout(() => storeOriginalStyles(), 100);

        showAllButton.addEventListener('click', () => {
            if (isShowingAll) {
                // Switch back to scroll view
                itemsContainer.style.cssText = originalStyle;
                scroller.style.cssText = originalScrollerStyle;
                showAllButton.textContent = 'Expand';
                showAllButton.title = 'Show all items in a grid layout';
                isShowingAll = false;

                // Restore Jellyfin's scrolling functionality
                itemsContainer.style.transform = originalTransform;
                itemsContainer.style.transition = 'transform 270ms ease-out';

                // Re-enable Jellyfin's scroller
                scroller.style.overflow = 'hidden';

                // Reset individual card styles
                const cards = itemsContainer.querySelectorAll('.card');
                cards.forEach(card => {
                    card.style.width = '';
                    card.style.flexShrink = '';
                    card.style.marginRight = '';
                });
            } else {
                // Switch to grid view
                storeOriginalStyles();

                // Calculate appropriate card size based on format
                const isBackdrop = cardFormat === 'backdrop' ||
                    (items.length > 0 && items[0].MediaType === 'Video' &&
                        itemsContainer.querySelector('.overflowBackdropCard'));

                const cardWidth = isBackdrop ?
                    'calc((100% - 24px) / 3)' :  // 3 backdrop cards per row
                    'calc((100% - 30px) / 6)';   // 6 portrait cards per row

                const cardMargin = isBackdrop ? '8px' : '6px';

                // Apply grid layout
                itemsContainer.style.cssText = `
                display: flex;
                flex-wrap: wrap;
                gap: ${cardMargin};
                white-space: normal;
                transform: none !important;
                transition: none !important;
                will-change: auto;
                padding: 0;
                margin: 0;
            `;

                scroller.style.cssText = `
                overflow: visible !important;
                height: auto !important;
            `;

                // Adjust each card for grid view
                const cards = itemsContainer.querySelectorAll('.card');
                cards.forEach(card => {
                    card.style.width = cardWidth;
                    card.style.flexShrink = '0';
                    card.style.marginRight = '0';
                });

                showAllButton.textContent = 'Collapse';
                showAllButton.title = 'Show items in scrollable layout';
                isShowingAll = true;
            }
        });

        // Add scroll animation handling for Jellyfin's system
        let scrollPosition = 0;
        const containerWidth = itemsContainer.offsetWidth;
        const cardCount = items.length;

        // This function would be called by Jellyfin's navigation system
        const scrollToPosition = (position) => {
            scrollPosition = position;
            itemsContainer.style.transform = `translateX(${-position}px)`;
        };

        // Add the section to the page
        verticalSection.appendChild(sectionTitleContainer);
        verticalSection.appendChild(scroller);

        return verticalSection;
    }

    // Expose the cardBuilder to the global window object
    window.cardBuilder = cardBuilder;

    // console.log('[KefinTweaks CardBuilder] Module loaded and available at window.cardBuilder');
})();
