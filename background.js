/**
 * X (Twitter) Video Downloader - Background Script
 * 
 * Service Worker for the browser extension.
 * Handles extension lifecycle events and uninstall tracking.
 */

/**
 * Get the currently active tab
 */
function getCurrentTab() {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
            const currentUrl = tabs[0].url;
            console.log('Current tab URL:', currentUrl);
        }
    });
}

/**
 * Set uninstall URL (removed for privacy)
 */
function setUninstallURL() {
    // Removed uninstall tracking for privacy protection
    console.log('Uninstall tracking disabled for privacy');
}

/**
 * Handle extension installation/update events
 */
function handleInstallation() {
    chrome.runtime.onInstalled.addListener((details) => {
        const reason = details.reason;
        console.log('Extension installed/updated:', reason);
        
        switch (reason) {
            case 'install':
                console.log('Extension installed for the first time');
                break;
            case 'update':
                console.log('Extension updated');
                break;
            case 'chrome_update':
                console.log('Chrome browser updated');
                break;
            default:
                console.log('Unknown installation reason:', reason);
        }
    });
}

/**
 * Initialize background script
 */
function initializeBackground() {
    console.log('Background script initialized');
    
    // Get current tab info
    getCurrentTab();
    
    // Set uninstall tracking URL
    setUninstallURL();
    
    // Handle installation events
    handleInstallation();
}

// Initialize when script loads
initializeBackground();