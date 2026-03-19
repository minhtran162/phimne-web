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
    
    // Layout and browser detection
    const layoutManager = {
        mobile: browser.mobile,
        tv: document.documentElement.classList.contains('layout-tv'),
        desktop: document.documentElement.classList.contains('layout-desktop')
    };
    
    const enableFocusTransform = !browser.slow && !browser.edge;

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
     * Determines if an item can be marked as played
     * @param {Object} item - Item object
     * @returns {boolean} - True if item can be marked as played
     */
    function canMarkPlayed(item) {
        // Check if the item type supports marking as played
        const playableTypes = [
            'Movie',
            'Episode', 
            'MusicVideo',
            'Audio',
            'Video'
        ];
        
        return playableTypes.includes(item.Type) && item.MediaType === 'Video' || item.MediaType === 'Audio';
    }

    /**
     * Determines if an item can be rated
     * @param {Object} item - Item object
     * @returns {boolean} - True if item can be rated
     */
    function canRate(item) {
        // Check if the item type supports rating
        const rateableTypes = [
            'Movie',
            'Series',
            'Episode',
            'MusicAlbum',
            'MusicArtist',
            'Audio',
            'Program',
            'Trailer',
            'Book',
            'Recording'
        ];
        
        return rateableTypes.includes(item.Type);
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

        // Calculate dimensions based on Device Pixel Ratio (DPR)
        const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

        // Build the final URL using ApiClient's scaled image method
        const buildUrl = (itemId, imageType, tag, fillWidth, fillHeight) => {
            const urlParams = new URLSearchParams();

            // Base quality params
            urlParams.set('tag', tag);
            urlParams.set('quality', options.quality || 96);

            // Calculate physical pixels requested from server
            // Scale dimensions by DPR for sharp images on high-DPI screens
            if (fillWidth) {
                urlParams.set('fillWidth', Math.round(fillWidth * dpr));
            }
            if (fillHeight) {
                urlParams.set('fillHeight', Math.round(fillHeight * dpr));
            }

            return `${serverAddress}/Items/${itemId}/Images/${imageType}?${urlParams.toString()}`;
        };

        // Destructure item properties for easier access
        const {
            Id,
            ImageTags = {},
            PrimaryImageTag,
            PrimaryImageItemId,
            SeriesPrimaryImageTag,
            SeriesId,
            AlbumPrimaryImageTag,
            AlbumId,
            ParentPrimaryImageTag,
            ParentPrimaryImageItemId,
            ParentThumbImageTag,
            ParentThumbItemId,
            BackdropImageTags = [],
            ParentBackdropImageTags = [],
            ParentBackdropItemId,
            SeriesThumbImageTag,
            SeriesId: itemSeriesId
        } = item;

        // Modern image selection logic adapted from new cardBuilder
        if (options.preferThumb && ImageTags.Thumb) {
            return buildUrl(Id, 'Thumb', ImageTags.Thumb, options.fillWidth, options.fillHeight);
        } else if ((options.preferBanner || type === 'banner') && ImageTags.Banner) {
            return buildUrl(Id, 'Banner', ImageTags.Banner, options.fillWidth, options.fillHeight);
        } else if (options.preferDisc && ImageTags.Disc) {
            return buildUrl(Id, 'Disc', ImageTags.Disc, options.fillWidth, options.fillHeight);
        } else if (options.preferLogo && ImageTags.Logo) {
            return buildUrl(Id, 'Logo', ImageTags.Logo, options.fillWidth, options.fillHeight);
        } else if (options.preferLogo && item.ParentLogoImageTag && item.ParentLogoItemId) {
            return buildUrl(item.ParentLogoItemId, 'Logo', item.ParentLogoImageTag, options.fillWidth, options.fillHeight);
        } else if (options.preferThumb && SeriesThumbImageTag && options.inheritThumb !== false) {
            return buildUrl(itemSeriesId, 'Thumb', SeriesThumbImageTag, options.fillWidth, options.fillHeight);
        } else if (options.preferThumb && ParentThumbItemId && options.inheritThumb !== false && item.MediaType !== 'Photo') {
            return buildUrl(ParentThumbItemId, 'Thumb', ParentThumbImageTag, options.fillWidth, options.fillHeight);
        } else if (options.preferThumb && BackdropImageTags?.length) {
            return buildUrl(Id, 'Backdrop', BackdropImageTags[0], options.fillWidth, options.fillHeight);
        } else if (options.preferThumb && ParentBackdropImageTags?.length && options.inheritThumb !== false && item.Type === 'Episode') {
            return buildUrl(ParentBackdropItemId, 'Backdrop', ParentBackdropImageTags[0], options.fillWidth, options.fillHeight);
        } else if (ImageTags.Primary && (item.Type !== 'Episode' || item.ChildCount !== 0)) {
            return buildUrl(Id, 'Primary', ImageTags.Primary, options.fillWidth, options.fillHeight);
        } else if (SeriesPrimaryImageTag) {
            return buildUrl(SeriesId, 'Primary', SeriesPrimaryImageTag, options.fillWidth, options.fillHeight);
        } else if (PrimaryImageTag) {
            return buildUrl(PrimaryImageItemId, 'Primary', PrimaryImageTag, options.fillWidth, options.fillHeight);
        } else if (ParentPrimaryImageTag) {
            return buildUrl(ParentPrimaryImageItemId, 'Primary', ParentPrimaryImageTag, options.fillWidth, options.fillHeight);
        } else if (AlbumId && AlbumPrimaryImageTag) {
            return buildUrl(AlbumId, 'Primary', AlbumPrimaryImageTag, options.fillWidth, options.fillHeight);
        } else if (item.Type === 'Season' && ImageTags?.Thumb) {
            return buildUrl(Id, 'Thumb', ImageTags.Thumb, options.fillWidth, options.fillHeight);
        } else if (BackdropImageTags?.length) {
            return buildUrl(Id, 'Backdrop', BackdropImageTags[0], options.fillWidth, options.fillHeight);
        } else if (ImageTags?.Thumb) {
            return buildUrl(Id, 'Thumb', ImageTags.Thumb, options.fillWidth, options.fillHeight);
        } else if (SeriesThumbImageTag && options.inheritThumb !== false) {
            return buildUrl(itemSeriesId, 'Thumb', SeriesThumbImageTag, options.fillWidth, options.fillHeight);
        } else if (ParentThumbItemId && options.inheritThumb !== false) {
            return buildUrl(ParentThumbItemId, 'Thumb', ParentThumbImageTag, options.fillWidth, options.fillHeight);
        } else if (ParentBackdropImageTags?.length && options.inheritThumb !== false) {
            return buildUrl(ParentBackdropItemId, 'Backdrop', ParentBackdropImageTags[0], options.fillWidth, options.fillHeight);
        }

        return '';
    }

    // Shared helper: Get card format configuration with modern aspect ratio logic
    function getCardFormatConfig(cardFormat, itemType, overflowCard, isMobile = false, primaryImageAspectRatio = null) {
        // Modern aspect ratio logic from cardBuilderUtils
        const format = determineCardFormat(cardFormat, itemType, primaryImageAspectRatio, overflowCard);
        
        // Determine appropriate card classes based on format
        const baseFormat = format.replace('overflow', '').toLowerCase();
        const overflowSuffix = overflowCard ? 'overflow' : '';
        
        // Calculate image parameters based on modern approach
        const imageParams = calculateImageParams(format, isMobile);
        
        return {
            cardClass: `${overflowSuffix}${baseFormat}Card`,
            padderClass: `cardPadder-${overflowSuffix}${baseFormat}`,
            imageParams: imageParams
        };
    }
    
    // Determine card format based on modern logic
    function determineCardFormat(cardFormat, itemType, primaryImageAspectRatio, overflowCard) {
        // If format is explicitly provided, use it
        if (cardFormat) {
            if (overflowCard && !cardFormat.startsWith('overflow')) {
                return 'overflow' + cardFormat.charAt(0).toUpperCase() + cardFormat.slice(1);
            }
            return cardFormat;
        }
        
        // Modern logic to determine format based on aspect ratio
        if (primaryImageAspectRatio !== null && primaryImageAspectRatio !== undefined) {
            if (primaryImageAspectRatio >= 3) {
                return overflowCard ? 'overflowBanner' : 'banner';
            } else if (primaryImageAspectRatio >= 1.33) {
                return overflowCard ? 'overflowBackdrop' : 'backdrop';
            } else if (primaryImageAspectRatio > 0.8) {
                return overflowCard ? 'overflowSquare' : 'square';
            } else {
                return overflowCard ? 'overflowPortrait' : 'portrait';
            }
        }
        
        // Fallback to original logic
        if (itemType === 'Episode' || itemType === 'TvChannel') {
            return overflowCard ? 'overflowBackdrop' : 'backdrop';
        }
        
        if (['MusicAlbum', 'Audio', 'Artist', 'MusicArtist'].includes(itemType)) {
            return overflowCard ? 'overflowSquare' : 'square';
        }
        
        return overflowCard ? 'overflowPortrait' : 'portrait';
    }
    
    // Calculate image parameters based on format and device
    function calculateImageParams(format, isMobile = false) {
        const baseParams = {
            quality: 96
        };
        
        if (format.includes('backdrop') || format.includes('thumb')) {
            // Backdrop cards typically have wider aspect ratios
            baseParams.fillWidth = isMobile ? 300 : 474;
            baseParams.fillHeight = isMobile ? 169 : 267;
        } else if (format.includes('square')) {
            // Square cards
            baseParams.fillWidth = isMobile ? 200 : 297;
            baseParams.fillHeight = isMobile ? 200 : 297;
        } else if (format.includes('banner')) {
            // Banner cards are wide and thin
            baseParams.fillWidth = isMobile ? 400 : 1000;
            baseParams.fillHeight = isMobile ? 74 : 185;
        } else {
            // Portrait cards (default)
            baseParams.fillWidth = isMobile ? 130 : 185;
            baseParams.fillHeight = isMobile ? 200 : 278;
        }
        
        return baseParams;
    }

    // Shared helper: Create text element with modern logic
    function createCardText(item, serverId, serverAddress, className = 'cardText cardTextCentered cardText-first') {
        const textContainer = document.createElement('div');
        textContainer.className = className;

        const bdi = document.createElement('bdi');
        const link = document.createElement('a');
        link.href = `${serverAddress}/web/index.html#!/details?id=${item.Id}&serverId=${serverId}`;
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

    // Create Mobile Card with modern enhancements
    function createMobileCard(item, overflowCard, cardFormat, serverId, serverAddress) {
        const card = document.createElement('div');
        const isFolderItem = isFolder(item);

        // Use enhanced cardFormatConfig with aspect ratio detection
        const config = getCardFormatConfig(cardFormat, item.Type, overflowCard, true, item.PrimaryImageAspectRatio); // isMobile=true for optimization

        // Modern card class determination logic
        const cardClasses = ['card', config.cardClass, 'card-withuserdata'];
        
        // Add classes for desktop, TV, and focus behaviors
        if (!layoutManager.mobile) {
            cardClasses.push('card-hoverable');
        }
        if (layoutManager.tv) {
            cardClasses.push('show-focus');
            if (enableFocusTransform) {
                cardClasses.push('show-animation');
            }
        }
        
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
        card.setAttribute('data-mediatype', item.MediaType || 'Video'); // Use Video as default instead of Unknown
        if (item.Path) card.setAttribute('data-path', item.Path);
        card.setAttribute('data-context', 'home');
        if (item.EndDate) card.setAttribute('data-enddate', item.EndDate);
        
        // Set prefix for sorting
        const nameWithPrefix = (item.SortName || item.Name || '');
        let prefix = nameWithPrefix.substring(0, Math.min(3, nameWithPrefix.length));
        if (prefix) {
            prefix = prefix.toUpperCase();
        }
        card.setAttribute('data-prefix', prefix);

        // Create cardBox
        const cardBox = document.createElement('div');
        cardBox.className = 'cardBox cardBox-bottompadded';

        // Create cardScalable
        const cardScalable = document.createElement('div');
        cardScalable.className = 'cardScalable';

        // Create cardPadder
        const cardPadder = document.createElement('div');
        cardPadder.className = `cardPadder ${config.padderClass} lazy-hidden-children`;
        
        // Add default icon/text with proper logic
        if (getImageUrl(item, cardFormat, config.imageParams, serverAddress)) {
            cardPadder.appendChild(createIcon(item.Type));
        }

        // Create blurhash canvas
        const canvas = createBlurhashCanvas();

        // Create cardImageContainer with modern class determination
        const cardImageContainer = document.createElement('a');
        cardImageContainer.href = `#/details?id=${item.Id}&serverId=${serverId}`;
        cardImageContainer.setAttribute('data-action', 'link');
        
        // Modern class determination
        let cardImageClasses = ['cardImageContainer', 'coveredImage', 'cardContent', 'itemAction', 'lazy', 'blurhashed', 'lazy-image-fadein-fast'];
        cardImageContainer.className = cardImageClasses.join(' ');
        
        cardImageContainer.setAttribute('aria-label', item.Name || 'Unknown');

        // Set background image
        const imageUrl = getImageUrl(item, cardFormat, config.imageParams, serverAddress);
        if (imageUrl) {
            cardImageContainer.style.backgroundImage = `url("${imageUrl}")`;
            
            // Add blurhash data attribute if available
            if (item.ImageBlurHashes && item.ImageBlurHashes.Primary) {
                cardImageContainer.setAttribute('data-blurhash', item.ImageBlurHashes.Primary);
            }
        } else {
            // If no image, add default icon/text directly to container
            cardImageContainer.appendChild(createIcon(item.Type));
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
            episodeLink.setAttribute('data-mediatype', 'Video'); // Updated default
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

    // Create Desktop Card with modern enhancements
    function createDesktopCard(item, overflowCard, cardFormat, serverId, serverAddress) {
        // Use enhanced cardFormatConfig with aspect ratio detection
        const config = getCardFormatConfig(cardFormat, item.Type, overflowCard, false, item.PrimaryImageAspectRatio);

        const card = document.createElement('div');
        
        // Modern card class determination logic
        const cardClasses = ['card', config.cardClass, 'card-withuserdata'];
        
        // Add classes for desktop, TV, and focus behaviors
        if (!layoutManager.mobile) {
            cardClasses.push('card-hoverable');
        }
        if (layoutManager.tv) {
            cardClasses.push('show-focus');
            if (enableFocusTransform) {
                cardClasses.push('show-animation');
            }
        }
        
        cardClasses.push('itemAction');
        card.className = cardClasses.join(' ');

        card.setAttribute('data-index', '0');
        card.setAttribute('data-isfolder', isFolder(item).toString());
        card.setAttribute('data-serverid', serverId);
        card.setAttribute('data-id', item.Id);
        card.setAttribute('data-type', item.Type);
        card.setAttribute('data-mediatype', item.MediaType || 'Video');
        if (item.Path) card.setAttribute('data-path', item.Path);
        card.setAttribute('data-context', 'home');
        
        // Set prefix for sorting
        const nameWithPrefix = (item.SortName || item.Name || '');
        let prefix = nameWithPrefix.substring(0, Math.min(3, nameWithPrefix.length));
        if (prefix) {
            prefix = prefix.toUpperCase();
        }
        card.setAttribute('data-prefix', prefix);

        const cardBox = document.createElement('div');
        cardBox.className = 'cardBox cardBox-bottompadded';

        const cardScalable = document.createElement('div');
        cardScalable.className = 'cardScalable';

        const cardPadder = document.createElement('div');
        cardPadder.className = `cardPadder ${config.padderClass} lazy-hidden-children`;
        
        // Add default icon/text with proper logic
        if (getImageUrl(item, cardFormat, config.imageParams, serverAddress)) {
            cardPadder.appendChild(createIcon(item.Type));
        }

        const cardImageContainer = document.createElement('a');
        cardImageContainer.href = `${serverAddress}/web/index.html#!/details?id=${item.Id}&serverId=${serverId}`;
        
        // Modern class determination
        let cardImageClasses = ['cardImageContainer', 'coveredImage', 'cardContent', 'itemAction', 'lazy', 'blurhashed', 'lazy-image-fadein-fast'];
        cardImageContainer.className = cardImageClasses.join(' ');
        
        cardImageContainer.setAttribute('data-action', 'link');
        cardImageContainer.setAttribute('aria-label', item.Name || 'Unknown');

        const imageUrl = getImageUrl(item, cardFormat, config.imageParams, serverAddress);
        if (imageUrl) {
            cardImageContainer.style.backgroundImage = `url("${imageUrl}")`;
            
            // Add blurhash data attribute if available
            if (item.ImageBlurHashes && item.ImageBlurHashes.Primary) {
                cardImageContainer.setAttribute('data-blurhash', item.ImageBlurHashes.Primary);
            }
        } else {
            // If no image, add default icon/text directly to container
            cardImageContainer.appendChild(createIcon(item.Type));
        }

        // Add indicators for played status or child count
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

        // Watched button
        if (canMarkPlayed(item)) {
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
        }

        // Favorite button
        if (canRate(item)) {
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
        }

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

    // Create TV Card with modern enhancements
    function createTVCard(item, overflowCard, cardFormat, customFooterText, serverId, serverAddress) {
        // Use enhanced cardFormatConfig with aspect ratio detection
        const config = getCardFormatConfig(cardFormat, item.Type, overflowCard, false, item.PrimaryImageAspectRatio);

        const card = document.createElement('button');
        card.type = 'button';
        card.setAttribute('is', 'emby-button');       

        // Modern card class determination logic for TV layout
        const cardClasses = ['card', config.cardClass, 'card-withuserdata', 'itemAction'];
        
        // Add TV-specific classes
        cardClasses.push('show-focus');
        if (enableFocusTransform) {
            cardClasses.push('show-animation');
        }
        
        card.className = cardClasses.join(' ');
        
        card.setAttribute('data-index', '0');
        card.setAttribute('data-isfolder', (item.IsFolder || ['Series', 'MusicAlbum', 'Artist'].includes(item.Type)).toString());
        card.setAttribute('data-serverid', serverId);
        card.setAttribute('data-id', item.Id || item.ItemId);
        card.setAttribute('data-type', item.Type);
        card.setAttribute('data-mediatype', item.MediaType || 'Video');

        // Set prefix for sorting
        const nameWithPrefix = (item.SortName || item.Name || '');
        let prefix = nameWithPrefix.substring(0, Math.min(3, nameWithPrefix.length));
        if (prefix) {
            prefix = prefix.toUpperCase();
        }
        card.setAttribute('data-prefix', prefix);

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
        
        // Add default icon/text with proper logic
        if (getImageUrl(item, cardFormat, config.imageParams, serverAddress)) {
            cardPadder.appendChild(createIcon(item.Type));
        }

        const cardImageContainer = document.createElement('div');
        
        // Modern class determination for TV layout
        let cardImageClasses = ['cardImageContainer', 'cardContent', 'lazy', 'blurhashed', 'lazy-image-fadein-fast'];
        if (item.Type !== 'Episode' || config.cardClass !== 'overflowBackdropCard') {
            cardImageClasses.splice(1, 0, 'coveredImage');
        }
        cardImageContainer.className = cardImageClasses.join(' ');

        const imageUrl = getImageUrl(item, cardFormat, config.imageParams, serverAddress);
        if (imageUrl) {
            cardImageContainer.style.backgroundImage = `url("${imageUrl}")`;
            
            // Add blurhash data attribute if available
            if (item.ImageBlurHashes && item.ImageBlurHashes.Primary) {
                cardImageContainer.setAttribute('data-blurhash', item.ImageBlurHashes.Primary);
            }
        } else {
            // If no image, add default icon/text directly to container
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
            // For Series/Movie, show name and year (plain text, no nested <a>)
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

            let yearText = getYearText(item);
            if (item.Type === 'Series') {
                const startYear = item.ProductionYear || '';
                const endYear = item.EndDate ? new Date(item.EndDate).getFullYear() : '';
                if (startYear && endYear) {
                    yearText = `${startYear} - ${endYear}`;
                } else if (startYear) {
                    yearText = `${startYear} - Hiện tại`;
                }
            }

            secondaryText.innerHTML = `<bdi>${yearText}</bdi>`;
            cardBox.appendChild(secondaryText);
        }

        card.appendChild(cardBox);
        return card;
    }

    // Main card creation function (router) with modern layout handling
    function createJellyfinCardElement(item, overflowCard = false, cardFormat = null, customFooterText = null) {
        const { serverId, serverAddress } = getCachedApiData();

        // Detect layout once with modern approach
        const isTVLayout = layoutManager.tv;
        const isMobileLayout = layoutManager.mobile;
        const isHomepage = document.querySelector && document.querySelector('.page.homePage');

        if (isTVLayout) {
            return createTVCard(item, overflowCard, cardFormat, customFooterText, serverId, serverAddress);
        }

        if (isMobileLayout && isHomepage) {
            return createMobileCard(item, overflowCard, cardFormat, serverId, serverAddress); // Pass original overflowCard value
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
        container.className = 'verticalSection';

        // Create section header
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'sectionHeaderContainer sectionTitleContainer-cards padded-left';

        if (title) {
            if (viewMoreUrl) {
                const titleLink = document.createElement('a');
                titleLink.className = 'sectionTitle sectionTitleButton';
                titleLink.href = typeof viewMoreUrl === 'string' ? viewMoreUrl : '#';
                
                if (typeof viewMoreUrl === 'function') {
                    titleLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        viewMoreUrl();
                    });
                }
                
                titleLink.innerHTML = `${title}<span class="material-icons chevron_right" style="font-size:inherit;">chevron_right</span>`;
                sectionHeader.appendChild(titleLink);
            } else {
                // Regular non-clickable title
                const titleElement = document.createElement('h2');
                titleElement.className = 'sectionTitle';
                titleElement.textContent = title;
                sectionHeader.appendChild(titleElement);
            }
        }

        const bannerContainer = document.createElement('div');
        bannerContainer.className = 'emby-scroller';

        // Create slider container
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'scrollSlider';

        const itemsContainer = document.createElement('div');
        itemsContainer.className = layoutManager.tv ? 'itemsContainer focuscontainer-x' : 'itemsContainer scrollSlider focuscontainer-x';
        itemsContainer.setAttribute('is', 'emby-itemscontainer');

        items.forEach((item, index) => {
            const card = createJellyfinCardElement(item, false, 'backdrop'); // Use backdrop format for spotlight
            card.classList.add('hero-card'); // Add special class for spotlight cards
            card.setAttribute('data-index', index);
            itemsContainer.appendChild(card);
        });

        sliderContainer.appendChild(itemsContainer);
        bannerContainer.appendChild(sliderContainer);

        // Add scroll buttons for non-TV layouts
        if (!layoutManager.tv) {
            const scrollButtons = document.createElement('div');
            scrollButtons.className = 'emby-scroller-buttons emby-scrollbuttons-hide';
            
            const leftBtn = document.createElement('button');
            leftBtn.className = 'emby-scrollerbutton emby-scrollerbutton-left';
            leftBtn.innerHTML = '<span class="material-icons navigate_before" aria-hidden="true"></span>';
            leftBtn.setAttribute('is', 'paper-icon-button-light');
            
            const rightBtn = document.createElement('button');
            rightBtn.className = 'emby-scrollerbutton emby-scrollerbutton-right';
            rightBtn.innerHTML = '<span class="material-icons navigate_next" aria-hidden="true"></span>';
            rightBtn.setAttribute('is', 'paper-icon-button-light');
            
            scrollButtons.appendChild(leftBtn);
            scrollButtons.appendChild(rightBtn);
            bannerContainer.appendChild(scrollButtons);
        }

        container.appendChild(sectionHeader);
        container.appendChild(bannerContainer);

        // Register action handlers for TV remote support
        if (window.itemShortcuts) {
            window.itemShortcuts.off(itemsContainer);
            window.itemShortcuts.on(itemsContainer);
        }

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
        verticalSection.className = 'verticalSection';

        // Create section header container
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'sectionHeaderContainer sectionTitleContainer-cards padded-left';

        if (title) {
            if (viewMoreUrl) {
                // Create clickable title with chevron icon
                const titleLink = document.createElement('a');
                titleLink.className = 'sectionTitle sectionTitleButton';
                titleLink.href = typeof viewMoreUrl === 'string' ? viewMoreUrl : '#';
                
                if (typeof viewMoreUrl === 'function') {
                    titleLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        viewMoreUrl();
                    });
                }
                
                titleLink.innerHTML = `${title}<span class="material-icons chevron_right" style="font-size:inherit;">chevron_right</span>`;
                sectionHeader.appendChild(titleLink);
            } else {
                // Regular non-clickable title
                const titleElement = document.createElement('h2');
                titleElement.className = 'sectionTitle';
                titleElement.textContent = title;
                sectionHeader.appendChild(titleElement);
            }
        }

        const scroller = document.createElement('div');
        scroller.setAttribute('is', 'emby-scroller');
        scroller.setAttribute('data-horizontal', 'true');
        scroller.setAttribute('data-centerfocus', layoutManager.tv ? 'card' : 'true');
        scroller.setAttribute('data-scrollbuttons', 'false');
        scroller.setAttribute('data-mousewheel', 'false');
        scroller.setAttribute('data-overscroll', 'true');
        scroller.className = 'emby-scroller';

        // Create scroller inner container
        const scrollSlider = document.createElement('div');
        scrollSlider.className = 'scrollSlider';
        
        // Create items container
        const itemsContainer = document.createElement('div');
        itemsContainer.setAttribute('is', 'emby-itemscontainer');
        itemsContainer.className = layoutManager.tv ? 'itemsContainer focuscontainer-x' : 'itemsContainer scrollSlider focuscontainer-x';
        
        // Add items to container
        items.forEach((item, index) => {
            const card = createJellyfinCardElement(item, overflowCard, cardFormat);
            card.setAttribute('data-index', index);
            itemsContainer.appendChild(card);
        });

        scrollSlider.appendChild(itemsContainer);
        scroller.appendChild(scrollSlider);

        // Add scroll buttons for non-TV layouts
        if (!layoutManager.tv) {
            const scrollButtons = document.createElement('div');
            scrollButtons.className = 'emby-scroller-buttons emby-scrollbuttons-hide';
            
            const leftBtn = document.createElement('button');
            leftBtn.className = 'emby-scrollerbutton emby-scrollerbutton-left';
            leftBtn.innerHTML = '<span class="material-icons navigate_before" aria-hidden="true"></span>';
            leftBtn.setAttribute('is', 'paper-icon-button-light');
            
            const rightBtn = document.createElement('button');
            rightBtn.className = 'emby-scrollerbutton emby-scrollerbutton-right';
            rightBtn.innerHTML = '<span class="material-icons navigate_next" aria-hidden="true"></span>';
            rightBtn.setAttribute('is', 'paper-icon-button-light');
            
            scrollButtons.appendChild(leftBtn);
            scrollButtons.appendChild(rightBtn);
            scroller.appendChild(scrollButtons);
        }

        // Register action handlers for TV remote support
        if (window.itemShortcuts) {
            window.itemShortcuts.off(itemsContainer);
            window.itemShortcuts.on(itemsContainer);
        }

        // Add the section to the page
        verticalSection.appendChild(sectionHeader);
        verticalSection.appendChild(scroller);

        return verticalSection;
    }

    // Expose the cardBuilder to the global window object
    window.cardBuilder = cardBuilder;

    console.log('[KefinTweaks CardBuilder] Module loaded and available at window.cardBuilder');
})();
