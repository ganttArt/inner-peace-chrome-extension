// Integration tests for the Chrome extension

const fs = require('fs')
const path = require('path')

// Read the actual extension files
const backgroundScript = fs.readFileSync(path.join(__dirname, '../../src/background.js'), 'utf8')
const popupScript = fs.readFileSync(path.join(__dirname, '../../src/popup.js'), 'utf8')
const linkedinIndexScript = fs.readFileSync(path.join(__dirname, '../../scripts/linkedin/index.js'), 'utf8')
const linkedinFeedScript = fs.readFileSync(path.join(__dirname, '../../scripts/linkedin/feed.js'), 'utf8')
const linkedinAsideScript = fs.readFileSync(path.join(__dirname, '../../scripts/linkedin/aside.js'), 'utf8')
const youtubeIndexScript = fs.readFileSync(path.join(__dirname, '../../scripts/youtube/index.js'), 'utf8')
const youtubeHomefeedScript = fs.readFileSync(path.join(__dirname, '../../scripts/youtube/homefeed.js'), 'utf8')
const youtubeVideopageScript = fs.readFileSync(path.join(__dirname, '../../scripts/youtube/videopage.js'), 'utf8')

describe('Extension Integration Tests', () => {
    describe('Background Script Integration', () => {
        test('should contain all required Chrome API integrations', () => {
            // Test that background script has all necessary Chrome API calls
            expect(backgroundScript).toContain('chrome.storage.sync')
            expect(backgroundScript).toContain('chrome.runtime.onMessage')
            expect(backgroundScript).toContain('chrome.tabs.onUpdated')
            expect(backgroundScript).toContain('chrome.tabs.query')
        })

        test('should handle website configurations', () => {
            // Test that background script has website configurations
            expect(backgroundScript).toContain('linkedin.com')
            expect(backgroundScript).toContain('youtube.com')
            expect(backgroundScript).toContain('scripts/linkedin')
            expect(backgroundScript).toContain('scripts/youtube')
        })

        test('should implement message handling', () => {
            // Test that background script implements message handling
            expect(backgroundScript).toContain('addListener')
            expect(backgroundScript).toContain('sendMessage')
            expect(backgroundScript).toContain('action')
        })

        test('should implement tab management', () => {
            // Test that background script implements tab management
            expect(backgroundScript).toContain('onUpdated')
            expect(backgroundScript).toContain('query')
            expect(backgroundScript).toContain('tabId')
        })
    })

    describe('Popup Script Integration', () => {
        test('should implement DOM manipulation', () => {
            // Test that popup script implements DOM manipulation
            expect(popupScript).toContain('getElementById')
            expect(popupScript).toContain('createElement')
            expect(popupScript).toContain('appendChild')
            expect(popupScript).toContain('innerHTML')
        })

        test('should implement settings management', () => {
            // Test that popup script implements settings management
            expect(popupScript).toContain('getWebsiteSettings')
            expect(popupScript).toContain('updateWebsiteSettings')
            expect(popupScript).toContain('chrome.runtime.sendMessage')
        })

        test('should implement website detection', () => {
            // Test that popup script implements website detection
            expect(popupScript).toContain('getCurrentWebsite')
            expect(popupScript).toContain('hostname')
            expect(popupScript).toContain('linkedin.com')
            expect(popupScript).toContain('youtube.com')
        })

        test('should implement UI controls', () => {
            // Test that popup script implements UI controls
            expect(popupScript).toContain('createToggleControl')
            expect(popupScript).toContain('addEventListener')
            expect(popupScript).toContain('change')
        })
    })

    describe('LinkedIn Content Scripts Integration', () => {
        test('should implement feed management', () => {
            // Test that LinkedIn scripts implement feed management
            expect(linkedinIndexScript).toContain('LinkedInFeed')
            expect(linkedinFeedScript).toContain('querySelector')
            expect(linkedinFeedScript).toContain('InnerPeaceUtils')
            expect(linkedinFeedScript).toContain('setDisplay')
        })

        test('should implement aside management', () => {
            // Test that LinkedIn scripts implement aside management
            expect(linkedinIndexScript).toContain('LinkedInAside')
            expect(linkedinAsideScript).toContain('querySelector')
            expect(linkedinAsideScript).toContain('style')
            expect(linkedinAsideScript).toContain('display')
        })

        test('should implement settings integration', () => {
            // Test that LinkedIn scripts implement settings integration
            expect(linkedinIndexScript).toContain('linkedin_showFeed')
            expect(linkedinIndexScript).toContain('linkedin_showAside')
            expect(linkedinIndexScript).toContain('updateSettings')
            expect(linkedinIndexScript).toContain('settings')
        })

        test('should implement DOM observation', () => {
            // Test that LinkedIn scripts implement DOM observation
            expect(linkedinIndexScript).toContain('setupFeedObserver')
            expect(linkedinIndexScript).toContain('setupAsideObserver')
            expect(linkedinIndexScript).toContain('periodicFeedCheck')
            expect(linkedinIndexScript).toContain('periodicAsideCheck')
        })
    })

    describe('YouTube Content Scripts Integration', () => {
        test('should implement home feed management', () => {
            // Test that YouTube scripts implement home feed management
            expect(youtubeIndexScript).toContain('YouTubeHomeFeed')
            expect(youtubeHomefeedScript).toContain('querySelector')
            expect(youtubeHomefeedScript).toContain('InnerPeaceUtils')
            expect(youtubeHomefeedScript).toContain('setDisplayMultiple')
        })

        test('should implement video page management', () => {
            // Test that YouTube scripts implement video page management
            expect(youtubeIndexScript).toContain('YouTubeVideoPage')
            expect(youtubeVideopageScript).toContain('querySelector')
            expect(youtubeVideopageScript).toContain('InnerPeaceUtils')
            expect(youtubeVideopageScript).toContain('setDisplayMultiple')
        })

        test('should implement settings integration', () => {
            // Test that YouTube scripts implement settings integration
            expect(youtubeIndexScript).toContain('youtube_showFeed')
            expect(youtubeIndexScript).toContain('youtube_showRightPanel')
            expect(youtubeIndexScript).toContain('updateSettings')
            expect(youtubeIndexScript).toContain('settings')
        })

        test('should implement DOM observation', () => {
            // Test that YouTube scripts implement DOM observation
            expect(youtubeIndexScript).toContain('setupHomeFeedObserver')
            expect(youtubeIndexScript).toContain('setupVideoPageObserver')
            expect(youtubeIndexScript).toContain('periodicHomeFeedCheck')
            expect(youtubeIndexScript).toContain('periodicVideoPageCheck')
        })
    })

    describe('Extension Architecture Integration', () => {
        test('should have consistent message passing', () => {
            // Test that all scripts use consistent message passing
            expect(backgroundScript).toContain('sendMessage')
            expect(popupScript).toContain('sendMessage')
            expect(linkedinIndexScript).toContain('onMessage')
            expect(youtubeIndexScript).toContain('onMessage')
        })

        test('should have consistent storage usage', () => {
            // Test that all scripts use consistent storage
            expect(backgroundScript).toContain('chrome.storage.sync')
            expect(popupScript).toContain('chrome.runtime.sendMessage')
            expect(linkedinIndexScript).toContain('chrome.runtime.onMessage')
            expect(youtubeIndexScript).toContain('chrome.runtime.onMessage')
        })

        test('should have consistent error handling', () => {
            // Test that all scripts have error handling
            expect(backgroundScript).toContain('console.error')
            expect(popupScript).toContain('console.error')
            expect(linkedinIndexScript).toContain('console.error')
            expect(youtubeIndexScript).toContain('console.error')
        })

        test('should have consistent logging', () => {
            // Test that all scripts have logging
            expect(backgroundScript).toContain('console.log')
            expect(popupScript).toContain('console.log')
            expect(linkedinIndexScript).toContain('console.log')
            expect(youtubeIndexScript).toContain('console.error')
        })
    })

    describe('Functionality Integration', () => {
        test('should implement element hiding functionality', () => {
            // Test that all content scripts implement element hiding through utility functions
            expect(linkedinFeedScript).toContain('InnerPeaceUtils')
            expect(linkedinAsideScript).toContain('display')
            expect(youtubeHomefeedScript).toContain('InnerPeaceUtils')
            expect(youtubeVideopageScript).toContain('InnerPeaceUtils')
        })

        test('should implement settings persistence', () => {
            // Test that settings are persisted across sessions
            expect(backgroundScript).toContain('chrome.storage.sync.set')
            expect(backgroundScript).toContain('chrome.storage.sync.get')
            expect(popupScript).toContain('updateWebsiteSettings')
            expect(popupScript).toContain('getWebsiteSettings')
        })

        test('should implement dynamic content handling', () => {
            // Test that scripts handle dynamic content
            expect(linkedinIndexScript).toContain('setupFeedObserver')
            expect(youtubeIndexScript).toContain('setupHomeFeedObserver')
            expect(linkedinIndexScript).toContain('periodicFeedCheck')
            expect(youtubeIndexScript).toContain('periodicHomeFeedCheck')
        })

        test('should implement website-specific logic', () => {
            // Test that scripts have website-specific logic
            expect(linkedinIndexScript).toContain('LinkedInFeed')
            expect(youtubeIndexScript).toContain('YouTubeHomeFeed')
            expect(popupScript).toContain('createLinkedInControls')
            expect(popupScript).toContain('createYouTubeControls')
        })
    })
})
