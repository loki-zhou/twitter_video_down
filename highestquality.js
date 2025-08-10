/**
 * X (Twitter) Video Downloader - Content Script Entry Point
 * 
 * This script is injected into web pages and determines whether to load
 * the main content script based on the current URL.
 */

/**
 * Check if current page is Twitter/X and inject main content script
 */
function initializeTwitterDownloader() {
    const currentUrl = window.location.href;
    
    // Check if we're on Twitter/X
    if (currentUrl.includes("https://x.com") || currentUrl.includes("https://twitter.com")) {
        console.log('Twitter/X detected, loading video downloader');
        
        // Create and inject the main content script
        const scriptElement = document.createElement("script");
        scriptElement.src = chrome.runtime.getURL("content.js");
        
        // Inject into page
        const targetElement = document.head || document.documentElement;
        targetElement.appendChild(scriptElement);
        
        console.log('Content script injected successfully');
    }
}

/**
 * Main initialization function
 */
function initialize() {
    console.log('Initializing X (Twitter) Video Downloader');
    
    // Only initialize Twitter downloader - no analytics or data collection
    initializeTwitterDownloader();
    
    console.log('Twitter Video Downloader initialized');
}

// Initialize when script loads
initialize();
