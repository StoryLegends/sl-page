export interface BrowserFingerprint {
    canvas: string;
    webgl: string;
    timezone: string;
    language: string;
    hardware: string;
    resolution: string;
}

function djb2Hash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
}

export function getBrowserFingerprint(): BrowserFingerprint {
    // 1. Canvas Fingerprint
    let canvasHash = 'unknown';
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            canvas.width = 200;
            canvas.height = 50;
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('StoryLegends,xyz <canvas> 1.0', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('StoryLegends,xyz <canvas> 1.0', 4, 17);
            canvasHash = djb2Hash(canvas.toDataURL());
        }
    } catch (e) {
        console.warn('Canvas fingerprinting failed:', e);
    }

    // 2. WebGL Renderer
    let webglRenderer = 'unknown';
    try {
        const canvas = document.createElement('canvas');
        const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
            }
        }
    } catch (e) {
        console.warn('WebGL renderer query failed:', e);
    }

    // 3. Timezone
    let timezone = 'unknown';
    try {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {}

    // 4. Language
    const language = navigator.language || 'unknown';

    // 5. Hardware Concurrency
    const hardware = String(navigator.hardwareConcurrency || 'unknown');

    // 6. Resolution
    const resolution = `${window.screen.width}x${window.screen.height}`;

    return {
        canvas: canvasHash,
        webgl: webglRenderer,
        timezone,
        language,
        hardware,
        resolution
    };
}
