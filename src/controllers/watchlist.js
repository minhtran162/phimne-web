import * as userSettings from '../scripts/settings/userSettings';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from '../lib/globalize';

class Watchlist {
    constructor(view, params) {
        this.view = view;
        this.params = params;
        this.apiClient = ServerConnections.currentApiClient();

        // --- Ensure HTML structure exists ---
        if (!view.querySelector('.sections.watchlist')) {
            view.insertAdjacentHTML(
                'beforeend',
                `
                <div class="sections watchlist">
                    <div class="watchlist-movies"></div>
                    <div class="watchlist-series"></div>
                    <div class="watchlist-seasons"></div>
                    <div class="watchlist-episodes"></div>
                </div>
                `
            );
        }

        // ---- INITIALIZE THE WATCHLIST SCRIPT ----
        this.initializeWatchlist();
        this.createJellyfinCardBuilder();
    }

    /* =========================
       Watchlist Implementation
       ========================= */

    initializeWatchlist() {
        const WARN = (...a) => console.warn('[Watchlist]', ...a);
        const ERR = (...a) => console.error('[Watchlist]', ...a);

        // Custom CSS for the watchlist icon
        const style = document.createElement('style');
        style.textContent = `
            .material-icons.watchlist:before {
                content: "\\e866";
            }
        `;
        document.head.appendChild(style);

        /* ---------- Helpers ---------- */
        const fetchLikedItems = async (type) => {
            const apiClient = window.ApiClient;

            const userId = apiClient.getCurrentUserId();
            const serverUrl = apiClient.serverAddress();
            const token = apiClient.accessToken();
            const url = `${serverUrl}/Items?Filters=Likes&IncludeItemTypes=${type}&UserId=${userId}&Recursive=true`;
            try {
                const res = await fetch(url, { headers: { Authorization: `MediaBrowser Token="${token}"` } });
                const data = await res.json();
                return data.Items || [];
            } catch (err) {
                ERR('Failed to fetch liked items for', type, err);
                return [];
            }
        };

        const getTypeDisplayName = (itemType) => {
            const map = {
                Movie: `${globalize.translate('Movies')}`,
                Series: `${globalize.translate('Shows')}`,
                Season: `${globalize.translate('Seasons')}`,
                Episode: `${globalize.translate('Episodes')}`,
                Person: 'People', MusicAlbum: 'Albums', Audio: 'Songs', Artist: 'Artists',
                Playlist: 'Playlists', Book: 'Books', AudioBook: 'Audiobooks', Photo: 'Photos',
                PhotoAlbum: 'Photo Albums', TvChannel: 'TV Channels',
                LiveTvProgram: 'Live TV', BoxSet: 'Collections'
            };
            return map[itemType] || itemType;
        };

        const renderCards = async (selector, type) => {
            const container = this.view.querySelector(selector);
            if (!container) return { type, itemCount: 0 };
            const items = await fetchLikedItems(type);
            if (!items.length) {
                container.style.display = 'none';
                return { type, itemCount: 0 };
            }
            container.style.display = '';
            if (window.cardBuilder?.renderCards) {
                const scroller = window.cardBuilder.renderCards(items, getTypeDisplayName(type));
                container.innerHTML = '';
                container.appendChild(scroller);
            } else {
                ERR('cardBuilder not available');
                container.style.display = 'none';
                return { type, itemCount: 0 };
            }
            return { type, itemCount: items.length };
        };

        const showEmptyMsg = () => {
            let msg = this.view.querySelector('.watchlist-empty-message');
            if (!msg) {
                msg = document.createElement('div');
                msg.className = 'watchlist-empty-message';
                msg.style.cssText =
                    'text-align:center;padding:40px 20px;color:#999;font-size:16px;line-height:1.5;';
                msg.innerHTML = `
                    <div style="margin-bottom:20px;">
                        <span class="material-icons" style="font-size:48px;color:#666;">bookmark_border</span>
                    </div>
                    <h3 style="color:#fff;margin-bottom:16px;font-size:20px;">${globalize.translate('Watchlist')}</h3>
                    <p style="margin:0;max-width:400px;margin-left:auto;margin-right:auto;">
                        ${globalize.translate('WatchlistPress')} <span class="material-icons" style="font-size:18px;vertical-align:middle;color:#00a4dc;">bookmark_border</span>
                        ${globalize.translate('WatchlistAdd')}
                    </p>`;
                this.view.querySelector('.sections.watchlist').appendChild(msg);
            } else {
                msg.style.display = 'block';
            }
        };
        const hideEmptyMsg = () => {
            const msg = this.view.querySelector('.watchlist-empty-message');
            if (msg) msg.style.display = 'none';
        };

        const renderWatchlistContent = async () => {
            const results = await Promise.all([
                renderCards('.watchlist-movies', 'Movie'),
                renderCards('.watchlist-series', 'Series'),
                renderCards('.watchlist-seasons', 'Season'),
                renderCards('.watchlist-episodes', 'Episode')
            ]);
            const total = results.reduce((s, r) => s + r.itemCount, 0);
            total === 0 ? showEmptyMsg() : hideEmptyMsg();
        };

        // Run immediately and set observer
        renderWatchlistContent();
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;

            mutations.forEach((mutation) => {
                // Only trigger on specific changes that would affect liked items
                if (mutation.type === 'attributes'
                    && mutation.attributeName === 'data-isfavorite') {
                    shouldUpdate = true;
                }
                // Or when bookmark buttons are added/removed
                else if (mutation.type === 'childList'
                    && mutation.target.classList?.contains('cardOverlayButton-br')) {
                    shouldUpdate = true;
                }
            });

            if (shouldUpdate) {
                // Debounce the updates to prevent rapid successive calls
                clearTimeout(window.watchlistUpdateTimeout);
                window.watchlistUpdateTimeout = setTimeout(() => {
                    renderWatchlistContent();
                }, 500);
            }
        });

        // Watch more specifically - only the bookmark button areas
        observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ['data-isfavorite']
        });
    }

    createJellyfinCardBuilder() {
        // ======================= Internal helpers ======================= //

        const createJellyfinCardElement = (item) => {
            const serverId = ApiClient.serverId();
            const serverAddress = ApiClient.serverAddress();

            // Determine card type based on item type
            let cardClass; let padderClass; let imageParams;
            if (item.Type === 'Episode' || item.Type === 'TvChannel') {
                cardClass = 'overflowBackdropCard';
                padderClass = 'cardPadder-overflowBackdrop';
                imageParams = 'fillHeight=267&fillWidth=474';
            } else if (['MusicAlbum', 'Audio', 'Artist', 'MusicArtist'].includes(item.Type)) {
                cardClass = 'overflowSquareCard';
                padderClass = 'cardPadder-overflowSquare';
                imageParams = 'fillHeight=297&fillWidth=297';
            } else {
                // Default poster style for Movies, Series, etc.
                cardClass = 'overflowPortraitCard';
                padderClass = 'cardPadder-overflowPortrait';
                imageParams = 'fillHeight=446&fillWidth=297';
            }

            // Create the main card container
            const card = document.createElement('div');
            card.className = `card ${cardClass} card-hoverable card-withuserdata`;
            card.setAttribute('data-index', '0');
            card.setAttribute('data-isfolder', item.Type === 'MusicAlbum' || item.Type === 'Artist' ? 'true' : 'false');
            card.setAttribute('data-serverid', serverId);
            card.setAttribute('data-id', item.Id);
            card.setAttribute('data-type', item.Type);
            card.setAttribute('data-mediatype', item.MediaType || 'Video');
            card.setAttribute('data-prefix', item.Name?.startsWith('The ') ? 'THE' : '');

            // Card box container
            const cardBox = document.createElement('div');
            cardBox.className = 'cardBox cardBox-bottompadded';

            // Card scalable container
            const cardScalable = document.createElement('div');
            cardScalable.className = 'cardScalable';

            // Card padder with icon
            const cardPadder = document.createElement('div');
            cardPadder.className = `cardPadder ${padderClass} lazy-hidden-children`;

            const cardIcon = document.createElement('span');
            cardIcon.className = 'cardImageIcon material-icons';
            cardIcon.setAttribute('aria-hidden', 'true');

            // Set icon based on item type
            if (item.Type === 'Movie') {
                cardIcon.textContent = 'movie';
            } else if (item.Type === 'Series') {
                cardIcon.textContent = 'tv';
            } else if (item.Type === 'Episode') {
                cardIcon.textContent = 'play_circle';
            } else if (item.Type === 'MusicAlbum') {
                cardIcon.textContent = 'album';
            } else if (item.Type === 'Audio') {
                cardIcon.textContent = 'music_note';
            } else if (item.Type === 'Artist') {
                cardIcon.textContent = 'person';
            } else {
                cardIcon.textContent = 'folder';
            }

            cardPadder.appendChild(cardIcon);

            // Blurhash canvas (placeholder)
            const blurhashCanvas = document.createElement('canvas');
            blurhashCanvas.setAttribute('aria-hidden', 'true');
            blurhashCanvas.width = 20;
            blurhashCanvas.height = 20;
            blurhashCanvas.className = 'blurhash-canvas lazy-hidden';

            // Card image container
            const cardImageContainer = document.createElement('a');
            cardImageContainer.href = `#/details?id=${item.Id}&serverId=${serverId}`;
            cardImageContainer.className = 'cardImageContainer coveredImage cardContent itemAction lazy blurhashed lazy-image-fadein-fast';
            cardImageContainer.setAttribute('data-action', 'link');
            cardImageContainer.setAttribute('aria-label', item.Name || 'Unknown');

            // Set background image or icon
            if (item.ImageTags?.Primary) {
                let imageUrl;
                if (item.IsJellyseerr) {
                    // Jellyseerr items use external image URLs
                    imageUrl = item.ImageTags.Primary.startsWith('http') ?
                        item.ImageTags.Primary :
                        `https://image.tmdb.org/t/p/w500${item.ImageTags.Primary}`;
                } else {
                    // Regular Phim Nè items
                    imageUrl = `${serverAddress}/Items/${item.Id}/Images/Primary?${imageParams}&quality=96&tag=${item.ImageTags.Primary}`;
                }
                cardImageContainer.style.backgroundImage = `url("${imageUrl}")`;
            } else {
                // No image - add icon as inner element
                const iconSpan = document.createElement('span');
                iconSpan.className = 'cardImageIcon material-icons';
                iconSpan.setAttribute('aria-hidden', 'true');

                // Set icon based on item type
                if (item.Type === 'Movie') {
                    iconSpan.textContent = 'movie';
                } else if (item.Type === 'Series') {
                    iconSpan.textContent = 'tv';
                } else if (item.Type === 'Episode') {
                    iconSpan.textContent = 'tv';
                } else if (item.Type === 'Person') {
                    iconSpan.textContent = 'person';
                } else if (item.Type === 'MusicAlbum') {
                    iconSpan.textContent = 'album';
                } else if (item.Type === 'Audio') {
                    iconSpan.textContent = 'music_note';
                } else if (item.Type === 'Artist' || item.Type === 'MusicArtist') {
                    iconSpan.textContent = 'person';
                } else {
                    iconSpan.textContent = 'folder';
                }

                cardImageContainer.appendChild(iconSpan);
            }

            // Card overlay container
            const cardOverlayContainer = document.createElement('div');
            cardOverlayContainer.className = 'cardOverlayContainer itemAction';
            cardOverlayContainer.setAttribute('data-action', 'link');

            // Overlay link
            const overlayLink = document.createElement('a');
            overlayLink.href = `#/details?id=${item.Id}&serverId=${serverId}`;
            overlayLink.className = 'cardImageContainer';

            // Assemble overlay
            cardOverlayContainer.appendChild(overlayLink);

            // Card text container - different structure for episodes
            const cardTextContainer = document.createElement('div');
            cardTextContainer.className = 'cardText cardTextCentered cardText-first';

            if (item.Type === 'Episode') {
                // Episodes: Series name as primary, episode title as secondary
                const seriesLink = document.createElement('a');
                seriesLink.href = `#/details?id=${item.SeriesId || item.Id}&serverId=${serverId}`;
                seriesLink.className = 'itemAction textActionButton';
                seriesLink.setAttribute('data-id', item.SeriesId || item.Id);
                seriesLink.setAttribute('data-serverid', serverId);
                seriesLink.setAttribute('data-type', 'Series');
                seriesLink.setAttribute('data-mediatype', 'undefined');
                seriesLink.setAttribute('data-channelid', 'undefined');
                seriesLink.setAttribute('data-isfolder', 'true');
                seriesLink.setAttribute('data-action', 'link');
                seriesLink.title = item.SeriesName || 'Unknown Series';
                seriesLink.textContent = item.SeriesName || 'Unknown Series';

                const seriesBdi = document.createElement('bdi');
                seriesBdi.appendChild(seriesLink);
                cardTextContainer.appendChild(seriesBdi);

                // Episode title as secondary
                const secondaryText = document.createElement('div');
                secondaryText.className = 'cardText cardTextCentered cardText-secondary';
                const episodeLink = document.createElement('a');
                episodeLink.href = `#/details?id=${item.Id}&serverId=${serverId}`;
                episodeLink.className = 'itemAction textActionButton';
                episodeLink.setAttribute('data-id', item.Id);
                episodeLink.setAttribute('data-serverid', serverId);
                episodeLink.setAttribute('data-type', 'Episode');
                episodeLink.setAttribute('data-mediatype', 'undefined');
                episodeLink.setAttribute('data-channelid', 'undefined');
                episodeLink.setAttribute('data-isfolder', 'false');
                episodeLink.setAttribute('data-action', 'link');
                episodeLink.title = item.Name || 'Unknown Episode';
                episodeLink.textContent = item.Name || 'Unknown Episode';

                const episodeBdi = document.createElement('bdi');
                episodeBdi.appendChild(episodeLink);
                secondaryText.appendChild(episodeBdi);
            } else {
                // Default: Item name as primary, year as secondary
                const titleLink = document.createElement('a');
                titleLink.href = `#/details?id=${item.Id}&serverId=${serverId}`;
                titleLink.className = 'itemAction textActionButton';
                titleLink.setAttribute('data-id', item.Id);
                titleLink.setAttribute('data-serverid', serverId);
                titleLink.setAttribute('data-type', item.Type);
                titleLink.setAttribute('data-mediatype', 'undefined');
                titleLink.setAttribute('data-channelid', 'undefined');
                titleLink.setAttribute('data-isfolder', item.Type === 'MusicAlbum' || item.Type === 'Artist' || item.Type === 'MusicArtist' ? 'true' : 'false');
                titleLink.setAttribute('data-action', 'link');
                titleLink.title = item.Name || 'Unknown';
                titleLink.textContent = item.Name || 'Unknown';

                const titleBdi = document.createElement('bdi');
                titleBdi.appendChild(titleLink);
                cardTextContainer.appendChild(titleBdi);

                // Secondary text (year)
                const secondaryText = document.createElement('div');
                secondaryText.className = 'cardText cardTextCentered cardText-secondary';
                const yearBdi = document.createElement('bdi');
                yearBdi.textContent = item.ProductionYear || item.PremiereDate?.substring(0, 4) || '';
                secondaryText.appendChild(yearBdi);
            }

            // Assemble card
            cardScalable.appendChild(cardPadder);
            cardScalable.appendChild(blurhashCanvas);
            cardScalable.appendChild(cardImageContainer);
            cardScalable.appendChild(cardOverlayContainer);

            cardBox.appendChild(cardScalable);
            cardBox.appendChild(cardTextContainer);

            // Add secondary text after primary text
            if (item.Type === 'Episode') {
                const secondaryText = document.createElement('div');
                secondaryText.className = 'cardText cardTextCentered cardText-secondary';
                const episodeLink = document.createElement('a');
                episodeLink.href = `#/details?id=${item.Id}&serverId=${serverId}`;
                episodeLink.className = 'itemAction textActionButton';
                episodeLink.setAttribute('data-id', item.Id);
                episodeLink.setAttribute('data-serverid', serverId);
                episodeLink.setAttribute('data-type', 'Episode');
                episodeLink.setAttribute('data-mediatype', 'undefined');
                episodeLink.setAttribute('data-channelid', 'undefined');
                episodeLink.setAttribute('data-isfolder', 'false');
                episodeLink.setAttribute('data-action', 'link');
                episodeLink.title = item.Name || 'Unknown Episode';
                episodeLink.textContent = item.Name || 'Unknown Episode';

                const episodeBdi = document.createElement('bdi');
                episodeBdi.appendChild(episodeLink);
                secondaryText.appendChild(episodeBdi);
                cardBox.appendChild(secondaryText);
            } else {
                const secondaryText = document.createElement('div');
                secondaryText.className = 'cardText cardTextCentered cardText-secondary';
                const yearBdi = document.createElement('bdi');
                yearBdi.textContent = item.ProductionYear || item.PremiereDate?.substring(0, 4) || '';
                secondaryText.appendChild(yearBdi);
                cardBox.appendChild(secondaryText);
            }

            card.appendChild(cardBox);

            return card;
        };

        const createScrollableContainer = (items, title, viewMoreUrl = null, sectionIndex = 0) => {
            const LOG = (...args) => console.log('[CardBuilder]', ...args);

            // Create the main vertical section container
            const verticalSection = document.createElement('div');
            verticalSection.className = 'verticalSection emby-scroller-container';

            // Create section title
            const sectionContainer = document.createElement('div');
            sectionContainer.className = 'sectionTitleContainer sectionTitleContainer-cards padded-left';

            const sectionTitle = document.createElement('h2');
            sectionTitle.className = 'sectionTitle sectionTitle-cards focuscontainer-x padded-right';
            sectionTitle.style.paddingTop = '0.5em';

            if (viewMoreUrl) {
                // Create clickable title with chevron icon
                const titleLink = document.createElement('a');
                titleLink.href = viewMoreUrl;
                titleLink.className = 'sectionTitle-link sectionTitleTextButton';
                titleLink.style.cssText = 'text-decoration: none; cursor: pointer; display: flex; align-items: center;';

                const titleText = document.createElement('span');
                titleText.textContent = title;

                const chevronIcon = document.createElement('span');
                chevronIcon.className = 'material-icons chevron_right';
                chevronIcon.setAttribute('aria-hidden', 'true');

                titleLink.appendChild(titleText);
                titleLink.appendChild(chevronIcon);
                sectionTitle.appendChild(titleLink);
            } else {
                // Regular non-clickable title
                sectionTitle.textContent = title;
            }

            // Create scroll buttons container
            const scrollButtons = document.createElement('div');
            //scrollButtons.setAttribute('is', 'emby-scrollbuttons');
            scrollButtons.className = 'emby-scrollbuttons custom-scrollbuttons padded-right';

            // Previous button
            const prevButton = document.createElement('button');
            prevButton.type = 'button';
            prevButton.setAttribute('is', 'paper-icon-button-light');
            prevButton.setAttribute('data-ripple', 'false');
            prevButton.setAttribute('data-direction', 'left');
            prevButton.title = 'Previous';
            prevButton.className = 'emby-scrollbuttons-button paper-icon-button-light';
            prevButton.disabled = true;

            const prevIcon = document.createElement('span');
            prevIcon.className = 'material-icons chevron_left';
            prevIcon.setAttribute('aria-hidden', 'true');
            prevButton.appendChild(prevIcon);

            // Next button
            const nextButton = document.createElement('button');
            nextButton.type = 'button';
            nextButton.setAttribute('is', 'paper-icon-button-light');
            nextButton.setAttribute('data-ripple', 'false');
            nextButton.setAttribute('data-direction', 'right');
            nextButton.title = 'Next';
            nextButton.className = 'emby-scrollbuttons-button paper-icon-button-light';

            const nextIcon = document.createElement('span');
            nextIcon.className = 'material-icons chevron_right';
            nextIcon.setAttribute('aria-hidden', 'true');
            nextButton.appendChild(nextIcon);

            scrollButtons.appendChild(prevButton);
            scrollButtons.appendChild(nextButton);

            // Create scroller container
            const scroller = document.createElement('div');
            scroller.setAttribute('is', 'emby-scroller');
            scroller.setAttribute('data-horizontal', 'true');
            scroller.setAttribute('data-centerfocus', 'card');
            scroller.className = 'padded-top-focusscale padded-bottom-focusscale emby-scroller custom-scroller';
            scroller.setAttribute('data-scroll-mode-x', 'custom');
            scroller.style.overflow = 'hidden';

            // Create items container
            const itemsContainer = document.createElement('div');
            itemsContainer.setAttribute('is', 'emby-itemscontainer');
            itemsContainer.className = 'focuscontainer-x itemsContainer scrollSlider animatedScrollX';
            itemsContainer.style.whiteSpace = 'nowrap';
            itemsContainer.style.willChange = 'transform';
            itemsContainer.style.transition = 'transform 270ms ease-out';
            itemsContainer.style.transform = 'translateX(0px)';

            // Add items to container
            items.forEach((item, index) => {
                const card = createJellyfinCardElement(item);
                card.setAttribute('data-index', index);
                itemsContainer.appendChild(card);
            });

            scroller.appendChild(itemsContainer);

            // Scroll functionality - calculate dynamically when needed
            let scrollPosition = 0;

            // Calculate scroll values dynamically based on current DOM state
            const calculateScrollValues = () => {
                const firstCard = itemsContainer.querySelector('.card');
                if (!firstCard) {
                    return { cardWidth: 212, visibleCards: 1, scrollStep: 1, maxScroll: 0 };
                }

                // Wait for layout to complete before calculating
                const cardRect = firstCard.getBoundingClientRect();
                const scrollerRect = scroller.getBoundingClientRect();

                // If dimensions are 0, the elements aren't laid out yet
                if (cardRect.width === 0 || scrollerRect.width === 0) {
                    return { cardWidth: 212, visibleCards: 1, scrollStep: 1, maxScroll: Math.max(0, items.length - 1) };
                }

                const computedStyle = window.getComputedStyle(firstCard);
                const marginRight = parseFloat(computedStyle.marginRight) || 0;
                const cardWidth = cardRect.width + marginRight; // Card width + gap

                const visibleCards = Math.floor(scrollerRect.width / cardWidth);
                const scrollStep = Math.max(1, visibleCards); // Scroll by the number of fully visible cards
                const maxScroll = Math.max(0, items.length - visibleCards);

                return { cardWidth, visibleCards, scrollStep, maxScroll };
            };

            const updateScrollButtons = () => {
                requestAnimationFrame(() => {
                    const { maxScroll } = calculateScrollValues();
                    prevButton.disabled = scrollPosition <= 0;
                    nextButton.disabled = scrollPosition >= maxScroll;
                });
            };

            const scrollTo = (position, smooth = true) => {
                // Use requestAnimationFrame to ensure DOM is ready
                requestAnimationFrame(() => {
                    const { cardWidth, maxScroll } = calculateScrollValues();

                    // If still not ready, try again after a short delay
                    if (cardWidth === 212 && maxScroll === Math.max(0, items.length - 1)) {
                        setTimeout(() => scrollTo(position, smooth), 100);
                        return;
                    }

                    scrollPosition = Math.max(0, Math.min(position, maxScroll));

                    if (smooth) {
                        itemsContainer.style.transition = 'transform 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    } else {
                        itemsContainer.style.transition = 'none';
                    }

                    itemsContainer.style.transform = `translateX(-${scrollPosition * cardWidth}px)`;
                    updateScrollButtons();

                    if (smooth) {
                        setTimeout(() => {
                            itemsContainer.style.transition = 'transform 270ms ease-out';
                        }, 500);
                    }
                });
            };

            setTimeout(() => {
                updateScrollButtons();
            }, 100);

            // Check if buttons already have event listeners (from Phim Nè's default handlers)
            const hasExistingListeners = () => {
                // Check if the buttons have any event listeners attached
                // We'll look for the presence of Phim Nè's default scroll behavior
                const existingButtons = document.querySelectorAll('.emby-scrollbuttons-button.paper-icon-button-light');
                return existingButtons.length > 0 && existingButtons[0].onclick !== null;
            };

            // Native horizontal scrolling with momentum and snap
            let touchStartX = 0;
            let touchStartY = 0;
            let touchCurrentX = 0;
            let isDragging = false;
            let startScrollPosition = 0;
            let currentScrollOffset = 0;
            let lastTouchTime = 0;
            let velocity = 0;
            let lastTouchX = 0;
            const animationFrame = null;
            let momentumAnimation = null;

            const handleTouchStart = (e) => {
                if (e.touches.length !== 1) return;

                // Cancel any ongoing momentum animation
                if (momentumAnimation) {
                    cancelAnimationFrame(momentumAnimation);
                    momentumAnimation = null;
                }

                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                lastTouchX = touchStartX;
                lastTouchTime = Date.now();
                isDragging = true;
                startScrollPosition = scrollPosition;
                currentScrollOffset = 0;
                velocity = 0;

                // Disable smooth transitions during drag
                itemsContainer.style.transition = 'none';

                // Don't prevent default here - let touch move determine if we should handle it
            };

            const handleTouchMove = (e) => {
                if (!isDragging || e.touches.length !== 1) return;

                touchCurrentX = e.touches[0].clientX;
                const deltaX = touchStartX - touchCurrentX;
                const deltaY = touchStartY - e.touches[0].clientY;

                // Only process horizontal swipes
                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
                    e.preventDefault(); // Prevent default scrolling behavior

                    // Calculate velocity for momentum
                    const currentTime = Date.now();
                    const timeDelta = currentTime - lastTouchTime;
                    if (timeDelta > 0) {
                        velocity = (lastTouchX - touchCurrentX) / timeDelta;
                    }
                    lastTouchX = touchCurrentX;
                    lastTouchTime = currentTime;

                    // Update scroll position in real-time
                    const { cardWidth } = calculateScrollValues();
                    currentScrollOffset = deltaX / cardWidth;
                    const newPosition = startScrollPosition + currentScrollOffset;

                    // Apply the transform immediately
                    itemsContainer.style.transform = `translateX(-${newPosition * cardWidth}px)`;
                }
            };

            const handleTouchEnd = (e) => {
                if (!isDragging) return;

                isDragging = false;

                // Calculate final position with momentum
                const { cardWidth, maxScroll } = calculateScrollValues();
                let finalPosition = startScrollPosition + currentScrollOffset;

                // Apply momentum if velocity is significant
                if (Math.abs(velocity) > 0.1) {
                    const momentumDistance = velocity * 200; // Adjust multiplier for momentum strength
                    finalPosition += momentumDistance / cardWidth;
                }

                // Clamp to bounds
                finalPosition = Math.max(0, Math.min(finalPosition, maxScroll));

                // Snap to nearest card
                const snapPosition = Math.round(finalPosition);
                finalPosition = Math.max(0, Math.min(snapPosition, maxScroll));

                // Update scroll position and animate to final position
                scrollPosition = finalPosition;

                // Re-enable smooth transitions
                itemsContainer.style.transition = 'transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                itemsContainer.style.transform = `translateX(-${scrollPosition * cardWidth}px)`;

                // Update button states
                updateScrollButtons();

                // Reset velocity
                velocity = 0;
                currentScrollOffset = 0;
            };

            // Add touch event listeners to the scroller
            scroller.addEventListener('touchstart', handleTouchStart, { passive: false });
            scroller.addEventListener('touchmove', handleTouchMove, { passive: false });
            scroller.addEventListener('touchend', handleTouchEnd, { passive: false });
            scroller.addEventListener('touchcancel', handleTouchEnd, { passive: false });

            // Only attach our event listeners if there are no existing ones
            if (true) {
                prevButton.addEventListener('click', () => {
                    const { scrollStep, maxScroll } = calculateScrollValues();
                    const newPosition = Math.max(0, scrollPosition - scrollStep);
                    scrollTo(newPosition, true);
                });

                nextButton.addEventListener('click', () => {
                    const { scrollStep, maxScroll } = calculateScrollValues();
                    const newPosition = Math.min(maxScroll, scrollPosition + scrollStep);
                    scrollTo(newPosition, true);
                });
            }

            // Initial state
            updateScrollButtons();

            // Assemble the section
            verticalSection.appendChild(sectionContainer);
            sectionContainer.appendChild(sectionTitle);
            verticalSection.appendChild(scrollButtons);
            verticalSection.appendChild(scroller);

            return verticalSection;
        };

        // Add CSS to hide emby-scrollbuttons that aren't custom-scrollbuttons and improve touch experience
        const style = document.createElement('style');
        style.textContent = `
        .smart-search-results .emby-scrollbuttons {
            display: none;
        }
        .layout-desktop .smart-search-results .emby-scrollbuttons:not(.custom-scrollbuttons) {
            display: block !important;
        }
        
        /* Native horizontal scrolling experience - ONLY for our custom scrollers */
        .emby-scroller.custom-scroller {
            -webkit-overflow-scrolling: touch !important;
            touch-action: pan-x !important;
            overscroll-behavior-x: contain !important;
        }
        
        /* Improve touch responsiveness */
        .emby-scroller.custom-scroller .scrollSlider {
            touch-action: pan-x !important;
            -webkit-user-select: none !important;
            user-select: none !important;
        }
        
        /* Ensure smooth scrolling on mobile */
        @media (max-width: 768px) {
            .emby-scroller.custom-scroller {
                scroll-behavior: smooth !important;
            }
        }
    `;
        document.head.appendChild(style);
        window.cardBuilder = {
            buildCard: (item) => createJellyfinCardElement(item),

            renderCards: (items, title, viewMoreUrl = null, sectionIndex = 0) =>
                createScrollableContainer(items, title, viewMoreUrl, sectionIndex),

            renderCardsFromIds: async (
                itemIds,
                title,
                viewMoreUrl = null,
                sectionIndex = 0
            ) => {
                const ApiClient = window.ApiClient;
                if (!itemIds || itemIds.length === 0) {
                    return createScrollableContainer([], title, viewMoreUrl, sectionIndex);
                }

                try {
                    const items = await Promise.all(
                        itemIds.map((id) => ApiClient.getItem(ApiClient.getCurrentUserId(), id))
                    );
                    return createScrollableContainer(items, title, viewMoreUrl, sectionIndex);
                } catch (err) {
                    console.error('[CardBuilder] Error fetching items:', err);
                    return createScrollableContainer([], title, viewMoreUrl, sectionIndex);
                }
            }
        };

        return window.cardBuilder;
    }

    /* ---- Optional lifecycle methods to match old interface ---- */
    onResume() { /* no-op, content is auto-rendered */ }
    onPause() { /* no-op */ }
    destroy() { this.view = null; this.params = null; }
}

export default Watchlist;
