/**
 * X (Twitter) Video Downloader - Content Script
 * 
 * This script intercepts Twitter API calls to extract media URLs
 * and injects download buttons into the Twitter interface.
 */

// Global variables
let mediaDataList = [];

/**
 * Utility function to convert array-like objects to arrays
 */
function toArray(arrayLike, length) {
    if (length == null || length > arrayLike.length) {
        length = arrayLike.length;
    }
    
    const result = new Array(length);
    for (let i = 0; i < length; i++) {
        result[i] = arrayLike[i];
    }
    return result;
}

/**
 * Spread operator implementation for older browsers
 */
function spreadArray(array) {
    if (Array.isArray(array)) {
        return toArray(array);
    }
    
    if (typeof Symbol !== "undefined" && array[Symbol.iterator] != null) {
        return Array.from(array);
    }
    
    if (array && typeof array === "object") {
        const toString = Object.prototype.toString.call(array).slice(8, -1);
        if (toString === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(toString)) {
            return toArray(array);
        }
    }
    
    throw new TypeError("Invalid attempt to spread non-iterable instance");
}

/**
 * Intercepts XMLHttpRequest to monitor Twitter API calls
 * @param {Function} callback - Function to handle API responses
 */
function interceptTwitterAPI(callback) {
    const originalOpen = XMLHttpRequest.prototype.open;
    
    XMLHttpRequest.prototype.open = function(method, url) {
        // Check if this is a Twitter API call
        if (/(api\.)?(twitter|x)\.com\/(i\/api\/)?(2|graphql|1\.1)\//i.test(url)) {
            const originalSend = this.send;
            
            this.send = function() {
                const originalOnReadyStateChange = this.onreadystatechange;
                
                this.onreadystatechange = function() {
                    const readyState = this.readyState;
                    const responseText = this.responseText;
                    
                    if (readyState === XMLHttpRequest.DONE && responseText) {
                        try {
                            const data = JSON.parse(responseText);
                            callback(data);
                        } catch (error) {
                            console.log('Error parsing API response:', error);
                        }
                    }
                    
                    if (originalOnReadyStateChange) {
                        return originalOnReadyStateChange.apply(this, arguments);
                    }
                };
                
                return originalSend.apply(this, arguments);
            };
        }
        
        return originalOpen.apply(this, arguments);
    };
}

/**
 * Recursively searches for a specific property in an object
 * @param {Object} obj - Object to search in
 * @param {string} property - Property name to find
 * @param {Array} results - Array to store results
 * @returns {Array} Array of found values
 */
function findInObject(obj, property, results = []) {
    if (!obj) return results;
    
    if (typeof obj === "object") {
        if (obj[property] !== undefined) {
            results.push(obj);
        } else {
            Object.values(obj).forEach(value => {
                results.push(...findInObject(value, property));
            });
        }
    }
    
    return results;
}

/**
 * Extracts text content from tweet data
 * @param {Object} tweetData - Tweet data object
 * @returns {string} Cleaned tweet text for filename
 */
function extractTweetText(tweetData) {
    const entityId = tweetData.id_str || tweetData.conversation_id_str;
    
    if (!tweetData.full_text) {
        return entityId;
    }
    
    let text = tweetData.full_text
        .split("https://t.co")[0]
        .trim()
        .replace(/(\r\n|\n|\r)/gm, "")
        .substr(0, 50);
    
    return text || entityId;
}

/**
 * Checks if media item is a supported type (video, gif, or photo)
 * @param {Object} media - Media object
 * @returns {boolean} True if supported media type
 */
function isSupportedMediaType(media) {
    return media.type === "video" || 
           media.type === "animated_gif" || 
           media.type === "photo";
}

/**
 * Extracts media data from Twitter API response
 * @param {Object} apiResponse - Raw API response
 * @returns {Array} Array of media objects with download URLs
 */
function extractMediaData(apiResponse) {
    console.log('Extracting media data from API response');
    
    // Find extended_entities in the response
    const entitiesData = spreadArray(findInObject(apiResponse, "extended_entities"));
    console.log('Found entities:', entitiesData);
    
    // Parse string_value fields that might contain media data
    const stringValueData = spreadArray(findInObject(apiResponse, "string_value"))
        .map(item => {
            try {
                const parsedValue = JSON.parse(item.string_value);
                console.log('Parsed string value:', parsedValue);
                
                const mediaEntity = Object.values(parsedValue.media_entities)
                    .filter(isSupportedMediaType)
                    .shift();
                
                if (mediaEntity) {
                    console.log('Found media entity:', mediaEntity);
                    return {
                        extended_entities: { media: [mediaEntity] },
                        id_str: mediaEntity.id_str
                    };
                }
            } catch (error) {
                return false;
            }
            return false;
        })
        .filter(Boolean);
    
    // Combine all media data sources
    const allMediaData = [...stringValueData, ...entitiesData]
        .filter(item => {
            return item.extended_entities.media.filter(isSupportedMediaType).length > 0;
        })
        .flatMap(item => {
            const entityId = item.id_str || item.conversation_id_str;
            console.log('Processing entity ID:', entityId, item.id_str, item.conversation_id_str);
            
            return item.extended_entities.media
                .filter(isSupportedMediaType)
                .map(media => {
                    // Extract highest quality video URL
                    let videoUrl = null;
                    if (media.video_info && media.video_info.variants) {
                        const videoVariant = media.video_info.variants
                            .filter(variant => variant.content_type === "video/mp4")
                            .sort((a, b) => b.bitrate - a.bitrate)
                            .shift();
                        
                        videoUrl = videoVariant ? videoVariant.url : null;
                    }
                    
                    console.log('Media URL:', media.media_url_https);
                    
                    // Generate thumbnail URL
                    const thumbnailUrl = media.media_url_https.substr(
                        0, 
                        media.media_url_https.lastIndexOf(".")
                    );
                    
                    // Skip if thumbnail URL is invalid
                    if (thumbnailUrl.endsWith(".twimg")) {
                        return {};
                    }
                    
                    // Generate photo URL with size modifier
                    const photoUrl = media.media_url_https + 
                        (media.sizes && media.sizes.large ? ":large" : "");
                    
                    return {
                        id: media.id_str,
                        entityId: entityId,
                        thumbnail: thumbnailUrl,
                        photo: photoUrl,
                        video: videoUrl,
                        text: extractTweetText(item)
                    };
                });
        })
        .filter((item, index, array) => {
            // Remove duplicates
            return array.indexOf(item) === index;
        });
    
    return allMediaData;
}

/**
 * Downloads a file from URL
 * @param {string} url - File URL to download
 * @param {string} filename - Filename for the download
 * @returns {Promise} Download promise
 */
async function downloadFile(url, filename) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const contentType = response.headers.get("Content-Type");
        
        // Determine file extension
        const extension = contentType === "image/jpeg" ? "jpg" : "mp4";
        
        // Create download link
        const downloadLink = document.createElement("a");
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        
        downloadLink.href = window.URL.createObjectURL(blob);
        downloadLink.setAttribute("target", "_blank");
        downloadLink.setAttribute("download", `${filename}.${extension}`);
        
        // Trigger download
        downloadLink.click();
        
        // Cleanup
        window.URL.revokeObjectURL(downloadLink.href);
        document.body.removeChild(downloadLink);
        
    } catch (error) {
        console.error('Download failed:', error);
        throw error;
    }
}

/**
 * Mustache.js template engine (simplified version)
 * Used for rendering download button HTML
 */
const TemplateEngine = {
    render: function(template, data) {
        return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
            return data[key] || '';
        });
    }
};

/**
 * Creates download button HTML template
 * @param {number} width - Button width
 * @param {number} height - Button height
 * @returns {string} HTML template string
 */
function createDownloadButtonTemplate(width, height) {
    return `
        <div class="extension-button-container">
            <div class="extension-button-hover"></div>
            
            <!-- Download Icon -->
            <svg class="download-icon" width="${width}" height="${height}" viewBox="0 0 24 24" aria-hidden="true">
                <g>
                    <path d="M11.99 16l-5.7-5.7L7.7 8.88l3.29 3.3V2.59h2v9.59l3.3-3.3 1.41 1.42-5.71 5.7zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z">
                    </path>
                </g>
            </svg>
            
            <!-- Loading Icon -->
            <svg class="loading-icon" viewBox="0 0 32 32" aria-hidden="true" width="${width}" height="${height}">
                <circle cx="16" cy="16" fill="none" r="14" stroke-width="4"></circle>
                <circle cx="16" cy="16" fill="none" r="14" stroke-width="4"></circle>
            </svg>
            
            <!-- Success Icon -->
            <svg class="success-icon" viewBox="0 0 24 24" aria-hidden="true" width="${width}" height="${height}">
                <g>
                    <path d="M9 20c-.264 0-.52-.104-.707-.293l-4.785-4.785c-.39-.39-.39-1.023 0-1.414s1.023-.39 1.414 0l3.946 3.945L18.075 4.41c.32-.45.94-.558 1.395-.24.45.318.56.942.24 1.394L9.817 19.577c-.17.24-.438.395-.732.42-.028.002-.057.003-.085.003z">
                    </path>
                </g>
            </svg>
        </div>
    `;
}

/**
 * Injects download button into media container
 * @param {Object} params - Parameters object
 * @param {HTMLElement} params.imageElement - Image element
 * @param {HTMLElement} params.groupElement - Group container element
 */
function injectDownloadButton({ imageElement, groupElement }) {
    // Find matching media data by thumbnail URL
    const matchingMedia = mediaDataList.find(media => {
        const matches = imageElement.src.indexOf(media.thumbnail) > -1;
        if (matches) {
            console.log('Thumbnail match:', media.thumbnail, 'Image:', imageElement.src);
        }
        return matches;
    });
    
    // Check if button already exists
    const alreadyProcessed = groupElement.getAttribute("data-twitter-video-downloader-extension");
    
    if (matchingMedia && !alreadyProcessed) {
        console.log('Adding download button');
        
        // Mark as processed
        groupElement.setAttribute("data-twitter-video-downloader-extension", "true");
        
        // Get button dimensions from existing SVG
        const existingSvg = groupElement.querySelector("svg");
        const svgRect = existingSvg.getBoundingClientRect();
        const buttonWidth = svgRect.width;
        const buttonHeight = svgRect.height;
        
        // Create download button
        const downloadButton = document.createElement("button");
        downloadButton.classList.add("extension-button");
        downloadButton.setAttribute("role", "button");
        downloadButton.setAttribute("title", "Download");
        downloadButton.setAttribute("entityId", matchingMedia.entityId);
        downloadButton.setAttribute("imagesrc", imageElement.src);
        
        // Add button HTML
        downloadButton.innerHTML = createDownloadButtonTemplate(buttonWidth, buttonHeight);
        
        // Add to container
        groupElement.appendChild(downloadButton);
        
        // Add click event listener
        downloadButton.addEventListener("click", handleDownloadClick);
    }
}

/**
 * Handles download button click event
 * @param {Event} event - Click event
 */
async function handleDownloadClick(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    
    // Disable button and show loading state
    this.disabled = true;
    this.classList.add("loading");
    
    try {
        const entityId = this.getAttribute("entityId");
        console.log('Downloading media for entity:', entityId);
        
        // Refresh media list (in case new data was loaded)
        console.log('Refreshing media list, current length:', mediaDataList.length);
        
        // Find all media for this entity
        const entityMedia = mediaDataList.filter(media => media.entityId === entityId);
        
        console.log('Found media for entity:', entityMedia.map(m => [m.entityId, m.video || m.photo]));
        
        // Download all unique media files
        const downloadedUrls = new Set();
        
        for (const media of entityMedia) {
            const downloadUrl = media.video || media.photo;
            
            if (!downloadedUrls.has(downloadUrl)) {
                const imageSrc = this.getAttribute("imagesrc");
                console.log('Downloading:', downloadUrl, media.text, media.entityId, imageSrc);
                
                await downloadFile(downloadUrl, media.text);
                downloadedUrls.add(downloadUrl);
            }
        }
        
        // Show success state
        this.classList.remove("loading");
        this.classList.add("success");
        
    } catch (error) {
        console.error('Download failed:', error);
        
        // Reset button state on error
        this.classList.remove("loading");
        this.disabled = false;
    }
}

/**
 * Main initialization function
 */
function initializeExtension() {
    console.log('Initializing X Video Downloader extension');
    
    // Set up API interception
    interceptTwitterAPI(apiResponse => {
        const extractedMedia = extractMediaData(apiResponse);
        
        if (extractedMedia.length > 0) {
            mediaDataList.push(...extractedMedia);
            console.log('Total media items:', mediaDataList.length);
        }
    });
    
    // Set up DOM observer for dynamically loaded content
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (!(node instanceof HTMLElement)) return;
                
                if (node.nodeName === "IMG") {
                    // Find the parent article or modal
                    const parentContainer = node.closest("article[role='article'], div[aria-modal='true']");
                    
                    if (parentContainer) {
                        // Find the action group (where buttons are located)
                        const actionGroup = parentContainer.querySelector("[role='group']:last-child");
                        
                        if (actionGroup) {
                            console.log('Found media element:', node, actionGroup);
                            injectDownloadButton({
                                imageElement: node,
                                groupElement: actionGroup
                            });
                        }
                    }
                }
            });
        });
    });
    
    // Start observing
    observer.observe(document, {
        childList: true,
        subtree: true
    });
    
    console.log('Extension initialized successfully');
}

// Initialize the extension
initializeExtension();