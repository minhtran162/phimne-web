(function() {
    try {
        ;

        if (!document.querySelector('link[href*="material-icons"]')) {
            ;
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
            document.head.appendChild(link);
        }

        const jellyfinCredentials = JSON.parse(localStorage.getItem('jellyfin_credentials') || '{}');
        const server = jellyfinCredentials.Servers && jellyfinCredentials.Servers[0];
        const apiKey = server ? server.AccessToken : '';
        const serverUrl = server ? server.ManualAddress || server.LocalAddress : window.location.origin;
        const userId = server ? server.UserId : '';
        const backendUrl = `${window.location.origin}/updoot`;
        const adminUserIds = ['ee8996be37aa4da0912a08b410940d3e'];

        ;

        let recommendButton = null;
        let recommendationsButton = null;
        let adminButton = null;
        let overlay = null;
        let adminOverlay = null;

        async function fetchItemDetails(itemId) {
            ;
            try {
                const url = `${serverUrl}/Items/${itemId}?api_key=${apiKey}`; // Fixed typo from original: 'melalui' to 'apiKey'
                ;
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'X-Emby-Token': apiKey }
                });
                if (!response.ok) {
                    console.error('Fetch item details failed:', `HTTP ${response.status}`);
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }
                const data = await response.json();
                ;
                return data;
            } catch (error) {
                console.error('Error fetching item details:', error.message);
                return null;
            }
        }

        function createRecommendButton(playButton) {
            ;
            if (!playButton || !playButton.parentNode) {
                ;
                return;
            }
            if (document.querySelector('.itemDetailPage:not(.hide) .btnRecommend')) {
                ;
                return;
            }

            ;
            recommendButton = document.createElement('button');
            recommendButton.setAttribute('is', 'paper-icon-button-light');
            recommendButton.className = 'btnRecommend detailButton emby-button paper-icon-button-light';
            recommendButton.title = 'Recommend';
            recommendButton.innerHTML = '<span class="material-icons thumb_up" aria-hidden="true"></span>';
            recommendButton.style.width = '43.64px';
            recommendButton.style.height = '43.64px';

            ApiClient.getCurrentUser().then((user) => {
                const usersRecommended = document.querySelector('.flyout-user-list');

                if (usersRecommended && usersRecommended.innerText.includes(user.name)) {
                    recommendButton.dataset.active = 'true';
                } else {
                    recommendButton.dataset.active = 'false';
                }
            });

            try {
                playButton.parentNode.insertBefore(recommendButton, playButton.nextSibling || null);
                ;
            } catch (error) {
                console.error('Error inserting Recommend button:', error.message);
                const targetContainer = document.querySelector('.detailPagePrimaryContainer, .detailButton-container');
                if (targetContainer) {
                    targetContainer.appendChild(recommendButton);
                    ;
                }
            }

            const displayArea = document.createElement('div');
            displayArea.className = 'recommendationArea';
            displayArea.style.padding = '0 10px';
            const targetContainer = playButton.closest('.mainDetailButtons, .detailButton-container, .detailPagePrimaryContainer');
            if (targetContainer) {
                targetContainer.appendChild(displayArea);
                ;
            } else {
                ;
            }

            createCommentsSection(targetContainer);

            recommendButton.addEventListener('click', () => {
                ;
                toggleRecommendation();
                recommendButton.dataset.active = recommendButton.dataset.active === 'true' ? 'false' : 'true';
            });

            updateRecommendationDisplay();
        }

        function createCommentsSection(targetContainer) {
            ;
            if (!targetContainer) {
                ;
                return;
            }
            if (document.querySelector('.commentsSection')) {
                ;
                return;
            }

            ;
            const commentsSection = document.createElement('div');
            commentsSection.className = 'commentsSection';
            commentsSection.style.cssText = `
                margin-top: 20px;
                padding: 10px;
                background: transparent;
                border-radius: 8px;
                position: relative;
                z-index: 100;
                height: auto;
            `;

            const addCommentButton = document.createElement('button');
            addCommentButton.textContent = '+ Add Comment';
            addCommentButton.className = 'btnAddComment button-submit emby-button button-flat show-focus';
            addCommentButton.addEventListener('click', () => {
                ;
                if (!userId) {
                    ;
                    alert('Please log in to add a comment');
                    return;
                }
                commentForm.style.display = commentForm.style.display === 'none' ? 'block' : 'none';
            });

            const commentForm = document.createElement('div');
            commentForm.style.display = 'none';
            commentForm.innerHTML = `
                <textarea style="width: 100%; height: 60px; margin-bottom: 10px; border-radius: 4px; padding: 8px;" placeholder="Write your comment..."></textarea>
                <button style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Send</button>
            `;
            const sendButton = commentForm.querySelector('button');
            sendButton.addEventListener('click', () => {
                ;
                const textarea = commentForm.querySelector('textarea');
                const comment = textarea.value.trim();
                if (comment) {
                    submitComment(comment).then(() => {
                        textarea.value = '';
                        commentForm.style.display = 'none';
                        updateCommentsDisplay();
                    });
                } else {
                    ;
                    alert('Comment cannot be empty');
                }
            });

            const commentsDisplay = document.createElement('div');
            commentsDisplay.className = 'commentsDisplay';
            commentsDisplay.style.cssText = `
                margin-top: 10px;
                height: auto;
                overflow-y: visible;
            `;

            commentsSection.appendChild(addCommentButton);
            commentsSection.appendChild(commentForm);
            commentsSection.appendChild(commentsDisplay);

            const primaryContent = document.querySelector('.detailPagePrimaryContent.padded-right');
            if (primaryContent && primaryContent.parentNode) {
                primaryContent.parentNode.insertBefore(commentsSection, primaryContent.nextSibling);
                ;
            } else {
                ;
                targetContainer.appendChild(commentsSection);
            }

            updateCommentsDisplay();
        }

        async function submitComment(comment) {
            ;
            const itemId = getItemId();
            if (!itemId) {
                ;
                alert('Cannot add comment: Item not found');
                return;
            }
            if (!userId) {
                ;
                alert('Please log in to add a comment');
                return;
            }

            try {
                const url = `${backendUrl}/comments`;
                ;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, itemId, comment })
                });
                if (!response.ok) {
                    console.error('Comment submission failed:', `HTTP ${response.status}`);
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }
                ;
            } catch (error) {
                console.error('Error submitting comment:', error.message);
                alert('Failed to submit comment: ' + error.message);
            }
        }

        async function editComment(commentId, newComment) {
            ;
            if (!userId) {
                ;
                alert('Please log in to edit comment');
                return;
            }

            try {
                const url = `${backendUrl}/comments/${commentId}`;
                ;
                const response = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, comment: newComment })
                });
                if (!response.ok) {
                    console.error('Comment edit failed:', `HTTP ${response.status}`);
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }
                ;
                updateCommentsDisplay();
            } catch (error) {
                console.error('Error editing comment:', error.message);
                alert('Failed to edit comment: ' + error.message);
            }
        }

        async function deleteComment(commentId) {
            ;
            if (!userId) {
                ;
                alert('Please log in to delete comment');
                return;
            }

            try {
                const url = `${backendUrl}/comments/${commentId}`;
                ;
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId })
                });
                if (!response.ok) {
                    console.error('Comment deletion failed:', `HTTP ${response.status}`);
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }
                ;
                updateCommentsDisplay();
            } catch (error) {
                console.error('Error deleting comment:', error.message);
                alert('Failed to delete comment: ' + error.message);
            }
        }

        async function updateCommentsDisplay() {
            ;
            const itemId = getItemId();
            const commentsDisplay = document.querySelector('.commentsDisplay');
            if (!itemId || !commentsDisplay) {
                ;
                return;
            }

            try {
                const url = `${backendUrl}/comments/${itemId}`;
                ;
                const response = await fetch(url);
                if (!response.ok) {
                    console.error('Fetch comments failed:', `HTTP ${response.status}`);
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }
                const comments = await response.json();
                ;
                commentsDisplay.innerHTML = '';
                if (comments.length > 0) {
                    comments.forEach(comment => {
                        const commentDiv = document.createElement('div');
                        commentDiv.style.cssText = 'margin-bottom: 8px; display: flex; align-items: flex-start;';
                        commentDiv.innerHTML = `
                            <div style="flex: 1;">
                                <strong style="display: block; margin-bottom: 4px;">${comment.username}</strong>
                                <p>${comment.comment}</p>
                            </div>
                        `;
                        if (comment.userId === userId || adminUserIds.includes(userId)) {
                            const buttonGroup = document.createElement('div');
                            buttonGroup.style.cssText = 'margin-left: 10px; display: flex; flex-direction: column; gap: 4px;';
                            const editButton = document.createElement('button');
                            editButton.textContent = 'Edit';
                            editButton.style.cssText = `
                                background: #2196F3;
                                color: white;
                                border: none;
                                padding: 4px 8px;
                                border-radius: 4px;
                                cursor: pointer;
                            `;
                            editButton.addEventListener('click', () => {
                                ;
                                const newComment = prompt('Edit your comment:', comment.comment);
                                if (newComment && newComment.trim()) {
                                    editComment(comment.id, newComment.trim());
                                }
                            });
                            const deleteButton = document.createElement('button');
                            deleteButton.textContent = 'Delete';
                            deleteButton.style.cssText = `
                                background: #ff4444;
                                color: white;
                                border: none;
                                padding: 4px 8px;
                                border-radius: 4px;
                                cursor: pointer;
                            `;
                            deleteButton.addEventListener('click', () => {
                                ;
                                if (confirm('Are you sure you want to delete this comment?')) {
                                    deleteComment(comment.id);
                                }
                            });
                            buttonGroup.appendChild(editButton);
                            buttonGroup.appendChild(deleteButton);
                            commentDiv.appendChild(buttonGroup);
                        }
                        commentsDisplay.appendChild(commentDiv);
                    });
                } else {
                    ;
                    commentsDisplay.innerHTML = '<p>No comments yet.</p>';
                }
            } catch (error) {
                console.error('Error fetching comments:', error.message);
                commentsDisplay.innerHTML = '<p>Failed to load comments: ' + error.message + '</p>';
            }
        }

        async function toggleRecommendation() {
            ;
            const itemId = getItemId();
            if (!itemId) {
                ;
                alert('Cannot recommend: Item not found');
                return;
            }
            if (!userId) {
                ;
                alert('Please log in to recommend');
                return;
            }

            try {
                const url = `${backendUrl}/recommend`;
                ;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, itemId })
                });
                if (!response.ok) {
                    console.error('Recommendation toggle failed:', `HTTP ${response.status}`);
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }
                const result = await response.json();
                ;
                updateRecommendationDisplay();
            } catch (error) {
                console.error('Error toggling recommendation:', error.message);
                alert('Failed to toggle recommendation: ' + error.message);
            }
        }

        async function updateRecommendationDisplay() {
            ;
            const itemId = getItemId();
            const displayArea = document.querySelector('.recommendationArea');
            if (!itemId || !displayArea) {
                ;
                return;
            }

            try {
                const url = `${backendUrl}/recommendations/${itemId}`;
                ;
                const response = await fetch(url);
                if (!response.ok) {
                    console.error('Fetch recommendations failed:', `HTTP ${response.status}`);
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }
                const recommendations = await response.json();
                ;

                displayArea.innerHTML = '';

                displayArea.innerHTML = '';

                if (recommendations.length > 0) {
                    // Create the "Recommendations" tag element
                    const recommendationTag = document.createElement('button');
                    recommendationTag.className = 'recommendation-tag';
                    recommendationTag.innerHTML = `
						<span class="material-icons thumb_up recommendation icon" aria-hidden="true"></span>
						<span class="recommendation-count">${recommendations.length} ${recommendations.length > 1 ? 'Recommendations' : 'Recommendation'}</span>
					`;

                    // Create the flyout element
                    const flyout = document.createElement('div');
                    flyout.className = 'recommendation-flyout hidden';

                    // Add the "Recommended by:" heading to the flyout
                    const flyoutHeading = document.createElement('h4');
                    flyoutHeading.textContent = 'Recommended by:';
                    flyout.appendChild(flyoutHeading);

                    // Create the user list for the flyout
                    const flyoutUserList = document.createElement('ul');
                    flyoutUserList.className = 'flyout-user-list';

                    // Populate the list with usernames from the array
                    recommendations.forEach(r => {
                        const userItem = document.createElement('li');
                        userItem.textContent = r.username;
                        flyoutUserList.appendChild(userItem);
                    });

                    flyout.appendChild(flyoutUserList);

                    // Append both the tag and the flyout to the display area
                    displayArea.appendChild(recommendationTag);
                    displayArea.appendChild(flyout);

                    // Add a click event listener to the tag to toggle the flyout
                    recommendationTag.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevents the document click from immediately closing it
                        flyout.classList.toggle('hidden');
                    });

                    // Add a global click listener to close the flyout if the user clicks anywhere else
                    document.addEventListener('click', (e) => {
                        if (!flyout.contains(e.target) && !recommendationTag.contains(e.target)) {
                            flyout.classList.add('hidden');
                        }
                    });
                }
            } catch (error) {
                console.error('Error fetching recommendations:', error.message);
                displayArea.textContent = 'Failed to load recommendations: ' + error.message;
            }
        }

        function getItemId() {
            ;
            let itemId = null;

            const detailLogo = document.querySelector('.detailLogo.lazy.lazy-image-fadein-fast');
            if (detailLogo) {
                const style = window.getComputedStyle(detailLogo);
                const bgImage = style.backgroundImage;
                ;
                if (bgImage && bgImage.includes('/Items/')) {
                    const match = bgImage.match(/\/Items\/([0-9a-f]{32})\//);
                    itemId = match ? match[1] : null;
                    ;
                }
            }

            if (!itemId) {
                const backdropImage = document.querySelector('.backdropImage.displayingBackdropImage.backdropImageFadeIn');
                if (backdropImage) {
                    const style = window.getComputedStyle(backdropImage);
                    const bgImage = style.backgroundImage;
                    ;
                    if (bgImage && bgImage.includes('/Items/')) {
                        const match = bgImage.match(/\/Items\/([0-9a-f]{32})\//);
                        itemId = match ? match[1] : null;
                        ;
                    }
                    if (!itemId && backdropImage.dataset.url) {
                        const dataUrl = backdropImage.dataset.url;
                        ;
                        const match = dataUrl.match(/\/Items\/([0-9a-f]{32})\//);
                        itemId = match ? match[1] : null;
                        ;
                    }
                }
            }

            if (!itemId) {
                const urlParams = new URLSearchParams(window.location.search);
                itemId = urlParams.get('id');
                ;
            }

            if (!itemId) {
                const hash = window.location.hash;
                if (hash.includes('details?id=')) {
                    const match = hash.match(/id=([^&]+)/);
                    itemId = match ? match[1] : null;
                    ;
                }
            }

            if (!itemId) {
                const pathParts = window.location.pathname.split('/');
                itemId = pathParts[pathParts.length - 1];
                ;
            }

            if (!itemId || !/^[0-9a-f]{32}$/.test(itemId)) {
                ;
                return null;
            }

            ;
            return itemId;
        }

        function createRecommendationsButton(castButton) {
            if (document.querySelector('.btnRecommendations')) {
                return;
            }

            ;
            if (!castButton || !castButton.parentNode) {
                ;
            }

            ;
            recommendationsButton = document.createElement('button');
            recommendationsButton.setAttribute('is', 'paper-icon-button-light');
            recommendationsButton.className = 'headerButton btnRecommendations emby-button paper-icon-button-light';
            recommendationsButton.title = 'Recommendations';
            recommendationsButton.innerHTML = '<span class="material-icons star" aria-hidden="true"></span>'; // Fixed HTML syntax
            recommendationsButton.style.backgroundColor = '#00ff0000';
            try {
                const castWidth = parseFloat(getComputedStyle(castButton).width) || 40;
                const castHeight = parseFloat(getComputedStyle(castButton).height) || 40;
                recommendationsButton.style.width = `${castWidth * 1.2}px`;
                recommendationsButton.style.height = `${castHeight * 1.2}px`;
            } catch (error) {
                console.error('Error setting Recommendations button size:', error.message);
                recommendationsButton.style.width = '48px';
                recommendationsButton.style.height = '48px';
            }

            try {
                castButton.parentNode.insertBefore(recommendationsButton, castButton);
                ;
            } catch (error) {
                console.error('Error inserting Recommendations button:', error.message);
                const topBar = document.querySelector('.headerRight, .headerTabs, .mainDrawer-scrollContainer, .header');
                if (topBar) {
                    topBar.prepend(recommendationsButton);
                    ;
                }
            }

            recommendationsButton.addEventListener('click', () => {
                ;
                showRecommendationsOverlay();
            });
        }

        function createAdminButton(castButton) {
            if (document.querySelector('.btnAdmin')) {
                return;
            }

            ;
            if (!adminUserIds.includes(userId)) {
                ;
                return;
            }

            ;
            adminButton = document.createElement('button');
            adminButton.setAttribute('is', 'paper-icon-button-light');
            adminButton.className = 'headerButton btnAdmin emby-button paper-icon-button-light';
            adminButton.title = 'Admin Settings';
            adminButton.innerHTML = '<span class="material-icons settings" aria-hidden="true"></span>';
            adminButton.style.backgroundColor = '#00ff0000';
            try {
                if (castButton && castButton.parentNode) {
                    const castWidth = parseFloat(getComputedStyle(castButton).width) || 40;
                    const castHeight = parseFloat(getComputedStyle(castButton).height) || 40;
                    adminButton.style.width = `${castWidth * 1.2}px`;
                    adminButton.style.height = `${castHeight * 1.2}px`;
                    castButton.parentNode.insertBefore(adminButton, castButton);
                    ;
                } else {
                    throw new Error('Cast button or its parent not found');
                }
            } catch (error) {
                console.error('Error setting or inserting Admin button:', error.message);
                adminButton.style.width = '48px';
                adminButton.style.height = '48px';
                const topBar = document.querySelector('.headerRight, .headerTabs, .mainDrawer-scrollContainer, .header');
                if (topBar) {
                    ;
                    topBar.prepend(adminButton);
                } else {
                    console.error('No topBar found for Admin button');
                    return;
                }
            }

            adminButton.addEventListener('click', () => {
                ;
                try {
                    showAdminOverlay();
                } catch (error) {
                    console.error('Error triggering showAdminOverlay:', error.message);
                    alert('Failed to open admin settings: ' + error.message);
                }
            });
        }

        async function showRecommendationsOverlay() {
            ;
            if (!overlay) {
                ;
                overlay = document.createElement('div');
                overlay.style.cssText = `
                    display: none;
                    position: fixed;
                    top: 5px;
                    left: 5px;
                    width: calc(100% - 10px);
                    height: calc(100% - 10px);
                    background: rgba(0,0,0,0.8);
                    z-index: 1000;
                    color: white;
                    padding: 20px;
                    overflow-y: auto;
                    border: 5px solid #333;
                    box-sizing: border-box;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    align-items: flex-start;
                    justify-content: center;
                `;
                document.body.appendChild(overlay);

                const closeButton = document.createElement('button');
                closeButton.innerHTML = '<span class="material-icons close"></span>';
                closeButton.style.cssText = `
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #ff4444;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                `;
                closeButton.addEventListener('click', () => {
                    ;
                    overlay.style.display = 'none';
                });
                overlay.appendChild(closeButton);

                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        ;
                        overlay.style.display = 'none';
                    }
                });
            }

            const closeButton = overlay.querySelector('button');
            overlay.innerHTML = '';
            if (closeButton) {
                overlay.appendChild(closeButton);
                ;
            }

            try {
                const url = `${backendUrl}/recommendations`;
                ;
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Emby-Token': apiKey // Added for potential backend auth
                    }
                });
                if (!response.ok) {
                    console.error('Fetch recommendations failed:', `HTTP ${response.status}`, await response.text());
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }
                const recommendations = await response.json();
                ;

                if (!Array.isArray(recommendations) || recommendations.length === 0) {
                    ;
                    const noRecsMessage = document.createElement('p');
                    noRecsMessage.textContent = 'No recommendations available yet.';
                    noRecsMessage.style.cssText = 'width: 100%; text-align: center;';
                    overlay.appendChild(noRecsMessage);
                    overlay.style.display = 'flex';
                    ;
                    return;
                }

                const groupedByItem = {};
                recommendations.forEach(rec => {
                    if (!groupedByItem[rec.itemId]) {
                        groupedByItem[rec.itemId] = [];
                    }
                    groupedByItem[rec.itemId].push(rec.username);
                });

                for (const itemId in groupedByItem) {
                    const usernames = groupedByItem[itemId];
                    ;
                    const itemDetails = await fetchItemDetails(itemId);
                    if (!itemDetails) {
                        ;
                        continue;
                    }

                    const card = document.createElement('div');
                    card.className = 'recommendationCard';
                    card.style.cssText = `
                        flex: 0 0 200px;
                        margin: 10px;
                        background: #333;
                        border-radius: 8px;
                        padding: 10px;
                        color: white;
                        cursor: pointer;
                        box-sizing: border-box;
                    `;
                    card.addEventListener('click', () => {
                        ;
                        window.location.href = `/web/index.html#!/details?id=${itemId}`;
                        overlay.style.display = 'none';
                    });

                    const imageUrl = itemDetails.ImageTags?.Primary ?
                        `${serverUrl}/Items/${itemId}/Images/Primary?api_key=${apiKey}` :
                        '';
                    const logoUrl = itemDetails.ImageTags?.Logo ?
                        `${serverUrl}/Items/${itemId}/Images/Logo?api_key=${apiKey}` :
                        '';

                    card.innerHTML = `
                        ${imageUrl ? `<img src="${imageUrl}" style="width: 100%; border-radius: 4px;" alt="${itemDetails.Name || 'Item'}">` : ''}
                        ${logoUrl ? `<img src="${logoUrl}" style="max-width: 100%; margin-top: 5px;" alt="Logo">` : ''}
                        ${!logoUrl ? `<h3 style="margin: 10px 0;">${itemDetails.Name || 'Unknown'}</h3>` : ''}
                        <p style="font-size: 12px; font-style: italic;">Recommended by: ${usernames.join(', ')}</p>
                    `;

                    overlay.appendChild(card);
                    ;
                }

                overlay.style.display = 'flex';
                ;
            } catch (error) {
                console.error('Error fetching recommendations:', error.message);
                const errorMessage = document.createElement('p');
                errorMessage.textContent = 'Failed to load recommendations: ' + error.message;
                errorMessage.style.cssText = 'width: 100%; text-align: center;';
                overlay.appendChild(errorMessage);
                overlay.style.display = 'flex';
                ;
            }
        }

        async function showAdminOverlay() {
            ;
            if (!adminUserIds.includes(userId)) {
                ;
                alert('Access denied: Admin privileges required');
                return;
            }

            if (!adminOverlay) {
                ;
                adminOverlay = document.createElement('div');
                adminOverlay.style.cssText = `
                    display: none;
                    position: fixed;
                    top: 5px;
                    left: 5px;
                    width: calc(100% - 10px);
                    height: calc(100% - 10px);
                    background: rgba(0,0,0,0.8);
                    z-index: 1000;
                    color: white;
                    padding: 20px;
                    overflow-y: auto;
                    border: 5px solid #333;
                    box-sizing: border-box;
                `;
                try {
                    document.body.appendChild(adminOverlay);
                    ;
                } catch (error) {
                    console.error('Error appending admin overlay:', error.message);
                    alert('Failed to create admin overlay: ' + error.message);
                    return;
                }

                const closeButton = document.createElement('button');
                closeButton.innerHTML = '<span class="material-icons close"></span>';
                closeButton.style.cssText = `
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #ff4444;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                `;
                closeButton.addEventListener('click', () => {
                    ;
                    adminOverlay.style.display = 'none';
                });
                adminOverlay.appendChild(closeButton);
                ;

                adminOverlay.addEventListener('click', (e) => {
                    if (e.target === adminOverlay) {
                        ;
                        adminOverlay.style.display = 'none';
                    }
                });
            }

            adminOverlay.innerHTML = '';
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '<span class="material-icons close"></span>';
            closeButton.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: #ff4444;
                color: white;
                border: none;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
            `;
            closeButton.addEventListener('click', () => {
                ;
                adminOverlay.style.display = 'none';
            });
            adminOverlay.appendChild(closeButton);
            ;

            try {
                ;
                const settingsResponse = await fetch(`${backendUrl}/admin/settings`);
                if (!settingsResponse.ok) {
                    console.error('Fetch settings failed:', `HTTP ${settingsResponse.status}`);
                    throw new Error(`HTTP ${settingsResponse.status}: ${await settingsResponse.text()}`);
                }
                const settings = await settingsResponse.json();
                ;

                const settingsForm = document.createElement('div');
                settingsForm.style.cssText = 'margin-bottom: 20px;';
                settingsForm.innerHTML = `
                    <h2>Admin Settings</h2>
                    <div style="margin-bottom: 10px;">
                        <label>Global Recommendation Limit (0 for unlimited):</label>
                        <input type="number" id="globalLimit" value="${settings.globalLimit || 0}" min="0" style="margin-left: 10px; padding: 5px;">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label>User ID for Per-User Limit:</label>
                        <input type="text" id="userIdLimit" placeholder="Enter User ID" style="margin-left: 10px; padding: 5px;">
                        <input type="number" id="perUserLimit" value="0" min="0" style="margin-left: 10px; padding: 5px;">
                    </div>
                    <button style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Save Settings</button>
                `;
                const saveButton = settingsForm.querySelector('button');
                saveButton.addEventListener('click', async () => {
                    ;
                    const globalLimit = parseInt(document.getElementById('globalLimit').value) || 0;
                    const userIdLimit = document.getElementById('userIdLimit').value.trim();
                    const perUserLimit = parseInt(document.getElementById('perUserLimit').value) || 0;
                    try {
                        const response = await fetch(`${backendUrl}/admin/settings`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ globalLimit, userId: userIdLimit, perUserLimit })
                        });
                        if (!response.ok) {
                            console.error('Save settings failed:', `HTTP ${response.status}`);
                            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                        }
                        ;
                        alert('Settings saved successfully');
                    } catch (error) {
                        console.error('Error saving settings:', error.message);
                        alert('Failed to save settings: ' + error.message);
                    }
                });
                adminOverlay.appendChild(settingsForm);
                ;

                ;
                const commentsResponse = await fetch(`${backendUrl}/admin/comments`);
                if (!commentsResponse.ok) {
                    console.error('Fetch comments failed:', `HTTP ${commentsResponse.status}`);
                    throw new Error(`HTTP ${commentsResponse.status}: ${await commentsResponse.text()}`);
                }
                const comments = await commentsResponse.json();
                ;

                const commentSection = document.createElement('div');
                commentSection.innerHTML = `
                    <h2>Manage Comments</h2>
                    <div style="margin-bottom: 10px;">
                        <label><input type="checkbox" id="selectAllComments"> Select All</label>
                        <button id="deleteSelected" style="background: #ff4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-left: 10px;">Delete Selected</button>
                    </div>
                `;
                const selectAllCheckbox = commentSection.querySelector('#selectAllComments');
                const deleteSelectedButton = commentSection.querySelector('#deleteSelected');

                selectAllCheckbox.addEventListener('change', () => {
                    ;
                    const checkboxes = commentSection.querySelectorAll('.commentCheckbox');
                    checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
                });

                deleteSelectedButton.addEventListener('click', async () => {
                    ;
                    const selectedIds = Array.from(commentSection.querySelectorAll('.commentCheckbox:checked')).map(cb => cb.dataset.commentId);
                    if (selectedIds.length === 0) {
                        ;
                        alert('No comments selected');
                        return;
                    }
                    if (!confirm(`Are you sure you want to delete ${selectedIds.length} comment(s)?`)) {
                        ;
                        return;
                    }
                    try {
                        for (const commentId of selectedIds) {
                            ;
                            const response = await fetch(`${backendUrl}/admin/comments/${commentId}`, {
                                method: 'DELETE'
                            });
                            if (!response.ok) {
                                console.error('Delete comment failed:', `HTTP ${response.status}`);
                                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                            }
                            ;
                        }
                        showAdminOverlay(); // Refresh
                    } catch (error) {
                        console.error('Error deleting selected comments:', error.message);
                        alert('Failed to delete some comments: ' + error.message);
                    }
                });

                comments.forEach(comment => {
                    const commentDiv = document.createElement('div');
                    commentDiv.style.cssText = 'margin-bottom: 10px; display: flex; align-items: center;';
                    commentDiv.innerHTML = `
                        <input type="checkbox" class="commentCheckbox" data-comment-id="${comment.id}" style="margin-right: 10px;">
                        <p><strong>${comment.username}</strong> on Item ${comment.itemId}: ${comment.comment}</p>
                        <button style="background: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-left: 10px;">Delete</button>
                    `;
                    const deleteButton = commentDiv.querySelector('button');
                    deleteButton.addEventListener('click', async () => {
                        ;
                        if (!confirm('Are you sure you want to delete this comment?')) {
                            ;
                            return;
                        }
                        try {
                            const response = await fetch(`${backendUrl}/admin/comments/${comment.id}`, {
                                method: 'DELETE'
                            });
                            if (!response.ok) {
                                console.error('Delete comment failed:', `HTTP ${response.status}`);
                                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                            }
                            ;
                            commentDiv.remove();
                        } catch (error) {
                            console.error('Error deleting comment:', error.message);
                            alert('Failed to delete comment: ' + error.message);
                        }
                    });
                    commentSection.appendChild(commentDiv);
                });

                adminOverlay.appendChild(commentSection);
                ;

                const bulkDeleteForm = document.createElement('div');
                bulkDeleteForm.style.cssText = 'margin-top: 20px;';
                bulkDeleteForm.innerHTML = `
                    <h3>Bulk Delete Comments by User</h3>
                    <input type="text" id="bulkUserId" placeholder="Enter User ID" style="margin-right: 10px; padding: 5px;">
                    <button style="background: #ff4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Delete All Comments</button>
                `;
                const bulkDeleteButton = bulkDeleteForm.querySelector('button');
                bulkDeleteButton.addEventListener('click', async () => {
                    ;
                    const bulkUserId = document.getElementById('bulkUserId').value.trim();
                    if (!bulkUserId) {
                        ;
                        alert('Please enter a User ID');
                        return;
                    }
                    if (!confirm(`Are you sure you want to delete all comments by user ${bulkUserId}?`)) {
                        ;
                        return;
                    }
                    try {
                        const response = await fetch(`${backendUrl}/admin/comments/user/${bulkUserId}`, {
                            method: 'DELETE'
                        });
                        if (!response.ok) {
                            console.error('Bulk delete failed:', `HTTP ${response.status}`);
                            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                        }
                        ;
                        alert('Comments deleted successfully');
                        showAdminOverlay();
                    } catch (error) {
                        console.error('Error deleting bulk comments:', error.message);
                        alert('Failed to delete comments: ' + error.message);
                    }
                });

                adminOverlay.appendChild(bulkDeleteForm);
                ;

                adminOverlay.style.display = 'block';
                ;
            } catch (error) {
                console.error('Error loading admin overlay:', error.message);
                const errorMessage = document.createElement('p');
                errorMessage.textContent = 'Failed to load admin settings: ' + error.message;
                errorMessage.style.cssText = 'width: 100%; text-align: center;';
                adminOverlay.appendChild(errorMessage);
                adminOverlay.style.display = 'block';
                ;
            }
        }

        function cleanupExistingElements() {
            ;
            const elements = [
                document.querySelector('.btnRecommend'),
                document.querySelector('.btnRecommendations'),
                document.querySelector('.btnAdmin'),
                document.querySelector('.recommendationArea'),
                document.querySelector('.commentsSection'),
                document.querySelector('.recommendationOverlay'),
                document.querySelector('.adminOverlay')
            ];
            elements.forEach(el => {
                if (el) {
                    el.remove();
                    ;
                }
            });
            recommendButton = null;
            recommendationsButton = null;
            adminButton = null;
            overlay = null;
            adminOverlay = null;
        }

        function init() {
            ;
            function tryAddButtons() {
                ;
                const playButton = document.querySelector('.mainDetailButtons .btnPlaystate, .detailButton-container button[data-id="play"]');
                const castButton = document.querySelector('.headerRight .headerCastButton, .headerTabs button[data-id="cast"], .mainDrawer-scrollContainer .castButton');

                if (playButton) {
                    ;
                    createRecommendButton(playButton);
                } else {
                    ;
                }

                if (castButton) {
                    ;
                    createRecommendationsButton(castButton);
                    createAdminButton(castButton);
                } else {
                    ;
                    createAdminButton(null);
                }
            }

            cleanupExistingElements();
            tryAddButtons();

            /*  const observer = new MutationObserver(() => {
                //;
                //tryAddButtons();
            });
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true
            }); */

            let attempts = 0;
            const maxAttempts = 10;
            const retryInterval = setInterval(() => {
                ;
                tryAddButtons();
                attempts++;
                if (document.querySelector('.btnRecommend') && document.querySelector('.btnRecommendations') || attempts >= maxAttempts) {
                    ;
                    clearInterval(retryInterval);
                }
            }, 2000);
        }

        function setupNavigationListener() {
            ;
            const homeButton = document.querySelector('.headerHomeButton, .skinHeader .emby-button[title="Home"]');
            if (homeButton) {
                homeButton.addEventListener('click', () => {
                    ;
                    setTimeout(() => {
                        ;
                        init();
                    }, 500); // Delay to allow page navigation
                });
                ;
            } else {
                ;
            }

            // Observe URL changes for SPA navigation
            let lastUrl = window.location.href;
            const urlObserver = new MutationObserver(() => {
                const currentUrl = window.location.href;
                if (currentUrl !== lastUrl) {
                    ;
                    lastUrl = currentUrl;
                    ;
                    setTimeout(() => init(), 500); // Delay to allow DOM to settle
                }
            });
            urlObserver.observe(document.body, { childList: true, subtree: true });

            /*             // Override history API to catch SPA navigation
            const originalPushState = history.pushState;
            history.pushState = function(state, title, url) {
                ;
                originalPushState.apply(this, arguments);
                ;
                setTimeout(() => init(), 500);
            };

            const originalReplaceState = history.replaceState;
            history.replaceState = function(state, title, url) {
                ;
                originalReplaceState.apply(this, arguments);
                ;
                setTimeout(() => init(), 500);
            }; */
        }

        if (document.readyState === 'loading') {
            ;
            document.addEventListener('DOMContentLoaded', () => {
                init();
                setupNavigationListener();
            });
        } else {
            ;
            init();
            setupNavigationListener();
        }
    } catch (error) {
        console.error('Critical error in script:', error.message);
        alert('Script initialization failed: ' + error.message);
    }
})();
