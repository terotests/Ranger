/**
 * Express.js middleware and server wrapper for ranger-pdf-tool
 * 
 * This provides a simple way to integrate the EVG preview server with Express.js applications.
 * 
 * @example
 * // Quick start - standalone server
 * const { createPreviewServer } = require('ranger-pdf-tool/express');
 * const server = createPreviewServer('./document.tsx', { port: 3000 });
 * server.start();
 * 
 * @example
 * // Middleware integration
 * const express = require('express');
 * const { createPreviewMiddleware } = require('ranger-pdf-tool/express');
 * const app = express();
 * app.use('/preview', createPreviewMiddleware('./document.tsx'));
 * app.listen(3000);
 */

const path = require('path');
const fs = require('fs');

// Try to load the compiled Ranger module
let rangerModule;
try {
    rangerModule = require('../dist/ranger_pdf_tool.js');
} catch (e) {
    console.warn('ranger-pdf-tool: Compiled module not found. Run "npm run build:module" first.');
}

/**
 * Create a standalone preview server for TSX documents
 * 
 * @param {string} inputFile - Path to the TSX file to preview
 * @param {Object} options - Server options
 * @param {number} [options.port=3000] - Server port
 * @param {string} [options.assets=''] - Asset search paths (comma-separated)
 * @param {number} [options.pageWidth=595] - Page width in points
 * @param {number} [options.pageHeight=842] - Page height in points
 * @returns {Object} Server instance with start() method
 */
function createPreviewServer(inputFile, options = {}) {
    const {
        port = 3000,
        assets = '',
        pageWidth = 595,
        pageHeight = 842
    } = options;

    let express;
    try {
        express = require('express');
    } catch (e) {
        throw new Error('Express is required for the preview server. Install it with: npm install express');
    }

    const app = express();
    
    // Create server instance from compiled Ranger code
    let server;
    if (rangerModule && rangerModule.EVGPreviewServerNode) {
        server = new rangerModule.EVGPreviewServerNode();
        server.setPageSize(pageWidth, pageHeight);
        server.initialize(inputFile, port, assets);
    } else {
        // Fallback: use native JS implementation
        server = createNativeServer(inputFile, { port, assets, pageWidth, pageHeight });
    }

    // Setup routes
    app.get('/', (req, res) => {
        res.type('text/html').send(server.getShellHTML());
    });

    app.get('/content', (req, res) => {
        res.type('text/html').set('Cache-Control', 'no-cache').send(server.getContentHTML());
    });

    app.get('/fonts.css', (req, res) => {
        res.type('text/css').set('Cache-Control', 'no-cache').send(server.getFontsCSS());
    });

    app.get('/assets/*', (req, res) => {
        const assetPath = req.params[0];
        const data = server.readAssetFile(assetPath);
        if (data && data.length > 0) {
            res.type(server.getMimeType(assetPath)).send(data);
        } else {
            res.status(404).send('Asset not found');
        }
    });

    // Server-sent events for live reload
    app.get('/events', (req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        
        // Send initial ping
        res.write('data: connected\n\n');
        
        // Setup file watcher if not already watching
        if (!server._watcher) {
            const inputDir = server.getInputDir();
            try {
                server._watcher = fs.watch(inputDir, { recursive: true }, (eventType, filename) => {
                    if (filename && (filename.endsWith('.tsx') || filename.endsWith('.rgr'))) {
                        console.log(`File changed: ${filename}`);
                        res.write('data: reload\n\n');
                    }
                });
            } catch (e) {
                console.warn('File watching not available:', e.message);
            }
        }
        
        req.on('close', () => {
            // Client disconnected
        });
    });

    return {
        app,
        server,
        start: (callback) => {
            return app.listen(port, () => {
                console.log(`\n🚀 EVG Preview Server running at http://localhost:${port}`);
                console.log(`   Previewing: ${inputFile}`);
                console.log(`   Live reload enabled\n`);
                if (callback) callback();
            });
        }
    };
}

/**
 * Create Express middleware for TSX preview
 * 
 * @param {string} inputFile - Path to the TSX file
 * @param {Object} options - Middleware options
 * @returns {Function} Express middleware
 */
function createPreviewMiddleware(inputFile, options = {}) {
    const {
        assets = '',
        pageWidth = 595,
        pageHeight = 842
    } = options;

    const express = require('express');
    const router = express.Router();

    // Create server instance
    let server;
    if (rangerModule && rangerModule.EVGPreviewServerNode) {
        server = new rangerModule.EVGPreviewServerNode();
        server.setPageSize(pageWidth, pageHeight);
        server.initialize(inputFile, 0, assets);
    } else {
        server = createNativeServer(inputFile, { assets, pageWidth, pageHeight });
    }

    router.get('/', (req, res) => {
        res.type('text/html').send(server.getShellHTML());
    });

    router.get('/content', (req, res) => {
        res.type('text/html').set('Cache-Control', 'no-cache').send(server.getContentHTML());
    });

    router.get('/fonts.css', (req, res) => {
        res.type('text/css').set('Cache-Control', 'no-cache').send(server.getFontsCSS());
    });

    router.get('/assets/*', (req, res) => {
        const assetPath = req.params[0];
        const data = server.readAssetFile(assetPath);
        if (data && data.length > 0) {
            res.type(server.getMimeType(assetPath)).send(data);
        } else {
            res.status(404).send('Asset not found');
        }
    });

    return router;
}

/**
 * Native JS fallback server implementation
 * Used when the compiled Ranger module is not available
 */
function createNativeServer(inputFile, options = {}) {
    const { port = 3000, assets = '', pageWidth = 595, pageHeight = 842 } = options;
    
    const inputDir = path.dirname(inputFile) + '/';
    const inputFileName = path.basename(inputFile);

    return {
        getShellHTML() {
            return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${inputFileName} - EVG Preview</title>
    <link rel="stylesheet" href="fonts.css">
    <style>
        body { margin: 0; padding: 20px; background: #f0f0f0; }
        .page { background: white; margin: 20px auto; box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
    </style>
</head>
<body>
    <div id="content"></div>
    <script>
        async function loadContent() {
            const res = await fetch('/content');
            document.getElementById('content').innerHTML = await res.text();
        }
        loadContent();
        
        // Live reload via SSE
        const events = new EventSource('/events');
        events.onmessage = (e) => {
            if (e.data === 'reload') loadContent();
        };
    </script>
</body>
</html>`;
        },
        
        getContentHTML() {
            return `<div style="padding: 40px; color: #666;">
                <h2>⚠️ Native mode</h2>
                <p>The compiled Ranger module is not available.</p>
                <p>Run <code>npm run build:module</code> to compile the PDF tool.</p>
                <p>File: ${inputFile}</p>
            </div>`;
        },
        
        getFontsCSS() {
            return '/* Fonts CSS - compile module for full support */';
        },
        
        readAssetFile(assetPath) {
            const paths = [
                path.join('./assets', assetPath),
                path.join(inputDir, '../assets', assetPath),
                path.join(inputDir, 'assets', assetPath)
            ];
            
            for (const p of paths) {
                try {
                    return fs.readFileSync(p);
                } catch (e) {
                    continue;
                }
            }
            return null;
        },
        
        getMimeType(filePath) {
            const ext = path.extname(filePath).toLowerCase().slice(1);
            const mimes = {
                'ttf': 'font/ttf',
                'otf': 'font/otf',
                'woff': 'font/woff',
                'woff2': 'font/woff2',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'svg': 'image/svg+xml',
                'css': 'text/css',
                'js': 'application/javascript',
                'json': 'application/json',
                'html': 'text/html'
            };
            return mimes[ext] || 'application/octet-stream';
        },
        
        getInputDir() {
            return inputDir;
        },
        
        getInputFileName() {
            return inputFileName;
        }
    };
}

module.exports = {
    createPreviewServer,
    createPreviewMiddleware,
    createNativeServer
};
