# Testing Guide for InnerPeace Chrome Extension

This document describes the comprehensive testing setup for the InnerPeace Chrome Extension, including unit tests, end-to-end tests, and automated testing workflows.

## 🧪 Testing Overview

The extension uses a multi-layered testing approach:

- **Unit Tests**: Test individual functions and components in isolation
- **End-to-End Tests**: Test the extension in a real browser environment
- **Automated Testing**: Continuous integration with GitHub Actions
- **File Watching**: Automatic test execution on file changes

## 📦 Dependencies

The testing setup requires the following dependencies:

```bash
npm install --save-dev @playwright/test jest jest-environment-jsdom eslint chokidar
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install
```

### 3. Run All Tests

```bash
npm test          # Unit tests
npm run test:e2e  # End-to-end tests
npm run test:all  # Both unit and e2e tests
```

### 4. Start File Watcher (Development)

```bash
npm run watch     # Watch all files and run tests on changes
npm run watch:unit # Watch and run only unit tests
npm run watch:e2e # Watch and run only e2e tests
```

## 🧩 Unit Testing

Unit tests use **Jest** and test individual functions and components in isolation.

### Test Structure

```
tests/
├── setup.js              # Jest setup and mocks
└── unit/
    ├── background.test.js # Background script tests
    └── popup.test.js     # Popup script tests
```

### Running Unit Tests

```bash
npm test                 # Run all unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

### Writing Unit Tests

Example unit test for the background script:

```javascript
describe('Background Script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle storage sync get', async () => {
    const mockData = { linkedin_showFeed: true };
    chrome.storage.sync.get.mockResolvedValue(mockData);
    
    const result = await new Promise(resolve => {
      chrome.storage.sync.get(['linkedin_showFeed'], resolve);
    });
    
    expect(result).toEqual(mockData);
  });
});
```

### Chrome API Mocking

The `tests/setup.js` file provides comprehensive mocks for Chrome extension APIs:

- `chrome.storage.sync` - Storage operations
- `chrome.runtime` - Message passing
- `chrome.tabs` - Tab management
- `chrome.scripting` - Script injection

## 🌐 End-to-End Testing

End-to-end tests use **Playwright** to test the extension in a real browser environment.

### Test Structure

```
tests/
└── e2e/
    └── extension.spec.js # Main e2e test suite
```

### Running E2E Tests

```bash
npm run test:e2e         # Run all e2e tests
npm run test:e2e:headed  # Run tests with visible browser
npm run test:e2e:ui      # Run tests with Playwright UI
npm run test:e2e:debug   # Run tests in debug mode
```

### Writing E2E Tests

Example e2e test for LinkedIn integration:

```javascript
test('should toggle LinkedIn feed visibility', async ({ page }) => {
  // Setup LinkedIn page with feed
  await page.setContent(`
    <html>
      <body>
        <main>
          <div id="feed-identity-module" style="display: block;">Feed Content</div>
        </main>
      </body>
    </html>
  `);
  
  // Simulate toggling feed visibility
  await page.evaluate(() => {
    const feed = document.getElementById('feed-identity-module');
    if (feed) {
      feed.style.display = 'none';
    }
  });
  
  // Check if feed is hidden
  const feed = page.locator('#feed-identity-module');
  await expect(feed).toHaveCSS('display', 'none');
});
```

## 🔄 File Watching

The file watcher automatically runs tests when files change, making development more efficient.

### Features

- **Smart Test Selection**: Automatically chooses unit vs e2e tests based on changed files
- **Queue Management**: Queues tests if they're already running
- **Visual Feedback**: Colored console output with timestamps
- **Graceful Shutdown**: Handles Ctrl+C properly

### Usage

```bash
# Watch all files and run appropriate tests
npm run watch

# Watch and run only unit tests
npm run watch:unit

# Watch and run only e2e tests
npm run watch:e2e
```

### File Change Detection

The watcher intelligently determines which tests to run:

- **Unit Tests**: `scripts/`, `background.js`, `popup.js`, `tests/unit/`
- **E2E Tests**: `manifest.json`, `popup.html`, `styles.css`, `tests/e2e/`
- **All Tests**: Any other JavaScript files

## 🏗️ Continuous Integration

GitHub Actions automatically runs tests on every push and pull request.

### Workflow Jobs

1. **Test**: Runs unit and e2e tests on multiple Node.js versions
2. **Extension Build**: Validates extension files and creates deployment package
3. **Security**: Runs security audits and vulnerability checks

### Triggers

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

### Artifacts

- Test results and coverage reports
- Extension package (zip file)
- Playwright reports and screenshots

## 📊 Coverage Reports

Coverage reports are generated for unit tests and uploaded to Codecov.

### Coverage Configuration

```javascript
// package.json
"collectCoverageFrom": [
  "*.js",
  "scripts/**/*.js",
  "!tests/**/*.js",
  "!node_modules/**/*.js"
],
"coverageReporters": ["text", "lcov", "html"]
```

### Viewing Coverage

```bash
npm run test:coverage  # Generate coverage report
open coverage/lcov-report/index.html  # View HTML report
```

## 🔧 Configuration Files

### Jest Configuration (`package.json`)

```javascript
"jest": {
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"],
  "collectCoverageFrom": [...],
  "coverageReporters": [...],
  "testMatch": [...]
}
```

### Playwright Configuration (`playwright.config.js`)

```javascript
module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
```

### ESLint Configuration (`.eslintrc.js`)

```javascript
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
    webextensions: true
  },
  extends: ['standard'],
  rules: {
    'no-eval': 'error',
    'prefer-const': 'error',
    // ... more rules
  }
};
```

## 🐛 Debugging Tests

### Unit Test Debugging

```bash
# Run specific test file
npm test -- tests/unit/background.test.js

# Run tests with verbose output
npm test -- --verbose

# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### E2E Test Debugging

```bash
# Run tests with visible browser
npm run test:e2e:headed

# Run tests with Playwright UI
npm run test:e2e:ui

# Run specific test
npx playwright test tests/e2e/extension.spec.js --grep "should toggle LinkedIn feed"
```

### Common Issues

1. **Chrome API Mocks**: Ensure all Chrome APIs are properly mocked in `tests/setup.js`
2. **DOM Elements**: Use `document.body.innerHTML` to set up DOM for unit tests
3. **Async Operations**: Use `await` and proper Promise handling in tests
4. **File Paths**: Use relative paths from the project root

## 📝 Best Practices

### Unit Testing

1. **Mock Dependencies**: Mock Chrome APIs and external dependencies
2. **Test Edge Cases**: Test error conditions and edge cases
3. **Isolate Tests**: Each test should be independent
4. **Clear Assertions**: Use descriptive test names and clear assertions

### E2E Testing

1. **Realistic Scenarios**: Test realistic user workflows
2. **Page Objects**: Consider using page object pattern for complex pages
3. **Screenshots**: Use screenshots for debugging failed tests
4. **Parallel Execution**: Run tests in parallel when possible

### General

1. **Fast Feedback**: Keep tests fast for quick feedback
2. **Reliable**: Avoid flaky tests with proper waits and assertions
3. **Maintainable**: Write clear, readable test code
4. **Comprehensive**: Aim for good coverage of critical functionality

## 🚀 Next Steps

1. **Add More Tests**: Expand test coverage for new features
2. **Performance Tests**: Add performance benchmarks
3. **Visual Regression Tests**: Add visual testing for UI changes
4. **Accessibility Tests**: Add a11y testing with Playwright
5. **Cross-Browser Testing**: Test on different browsers and versions

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Chrome Extension Testing Guide](https://developer.chrome.com/docs/extensions/mv3/tut_testing/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions) 