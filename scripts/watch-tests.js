#!/usr/bin/env node

const chokidar = require('chokidar')
const { spawn } = require('child_process')
const path = require('path')

// Configuration
const WATCH_PATTERNS = [
    '*.js',
    '*.html',
    '*.css',
    'scripts/**/*.js',
    'tests/**/*.js',
    'manifest.json'
]

const IGNORE_PATTERNS = [
    'node_modules/**',
    'tests/**/node_modules/**',
    '**/*.test.js',
    '**/*.spec.js',
    '**/coverage/**',
    '**/.git/**'
]

// Test commands
const TEST_COMMANDS = {
    unit: 'npm test',
    e2e: 'npm run test:e2e',
    all: 'npm test && npm run test:e2e'
}

let testProcess = null
const testQueue = []
let isRunning = false

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
}

function log (message, color = 'reset') {
    const timestamp = new Date().toLocaleTimeString()
    console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`)
}

function runTests (testType = 'all') {
    if (isRunning) {
        log('Tests already running, queuing...', 'yellow')
        testQueue.push(testType)
        return
    }

    isRunning = true
    log(`Running ${testType} tests...`, 'blue')

    // Kill existing test process if running
    if (testProcess) {
        testProcess.kill('SIGTERM')
    }

    const command = TEST_COMMANDS[testType] || TEST_COMMANDS.all
    const [cmd, ...args] = command.split(' ')

    testProcess = spawn(cmd, args, {
        stdio: 'inherit',
        shell: true
    })

    testProcess.on('close', (code) => {
        isRunning = false

        if (code === 0) {
            log('✅ Tests passed!', 'green')
        } else {
            log('❌ Tests failed!', 'red')
        }

        // Run queued tests
        if (testQueue.length > 0) {
            const nextTest = testQueue.shift()
            setTimeout(() => runTests(nextTest), 1000)
        }
    })

    testProcess.on('error', (error) => {
        log(`Error running tests: ${error.message}`, 'red')
        isRunning = false
    })
}

function handleFileChange (filePath) {
    const relativePath = path.relative(process.cwd(), filePath)

    // Determine test type based on file change
    let testType = 'all'

    if (relativePath.includes('tests/e2e/')) {
        testType = 'e2e'
    } else if (relativePath.includes('tests/unit/')) {
        testType = 'unit'
    } else if (relativePath.includes('scripts/') || relativePath.includes('background.js') || relativePath.includes('popup.js')) {
        testType = 'unit'
    } else if (relativePath.includes('manifest.json') || relativePath.includes('popup.html') || relativePath.includes('styles.css')) {
        testType = 'e2e'
    }

    log(`File changed: ${relativePath}`, 'cyan')
    log(`Running ${testType} tests...`, 'blue')

    runTests(testType)
}

function setupWatcher () {
    log('Setting up file watcher...', 'blue')

    const watcher = chokidar.watch(WATCH_PATTERNS, {
        ignored: IGNORE_PATTERNS,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 300,
            pollInterval: 100
        }
    })

    watcher
        .on('ready', () => {
            log('✅ File watcher ready!', 'green')
            log('Watching for changes...', 'blue')
            log('Press Ctrl+C to stop', 'yellow')
        })
        .on('add', handleFileChange)
        .on('change', handleFileChange)
        .on('unlink', handleFileChange)
        .on('error', (error) => {
            log(`Watcher error: ${error}`, 'red')
        })

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        log('Shutting down...', 'yellow')
        if (testProcess) {
            testProcess.kill('SIGTERM')
        }
        watcher.close()
        process.exit(0)
    })

    return watcher
}

// CLI argument parsing
const args = process.argv.slice(2)
const testType = args[0] || 'all'

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.bright}InnerPeace Chrome Extension Test Watcher${colors.reset}

Usage: node scripts/watch-tests.js [test-type]

Test types:
  unit    - Run only unit tests
  e2e     - Run only end-to-end tests
  all     - Run all tests (default)

Examples:
  node scripts/watch-tests.js unit
  node scripts/watch-tests.js e2e
  node scripts/watch-tests.js all

The watcher will automatically run tests when files change.
Press Ctrl+C to stop the watcher.
`)
    process.exit(0)
}

// Check if required dependencies are installed
try {
    require('chokidar')
} catch (error) {
    log('❌ chokidar not found. Installing dependencies...', 'red')
    log('Run: npm install', 'yellow')
    process.exit(1)
}

// Start the watcher
setupWatcher()

// Run initial tests
log('Running initial tests...', 'blue')
runTests(testType)
