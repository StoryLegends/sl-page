import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define your static routes here
const routes = [
    'about',
    'rules',
    'history',
    'glorylist',
    'privacy-policy',
    'user-agreement',
    'licenses'
];

const distDir = path.join(__dirname, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');

function generateStaticRoutes() {
    if (!fs.existsSync(distDir)) {
        console.error('Dist directory not found. Run build first.');
        process.exit(1);
    }

    if (!fs.existsSync(indexHtmlPath)) {
        console.error('index.html not found in dist.');
        process.exit(1);
    }

    const indexContent = fs.readFileSync(indexHtmlPath, 'utf-8');

    routes.forEach(route => {
        const routeDir = path.join(distDir, route);

        // Create directory for the route
        if (!fs.existsSync(routeDir)) {
            fs.mkdirSync(routeDir, { recursive: true });
        }

        // Write index.html to the route directory
        const targetPath = path.join(routeDir, 'index.html');
        fs.writeFileSync(targetPath, indexContent);
        console.log(`Created static page for: /${route}`);
    });

    console.log('Static route generation complete.');
}

generateStaticRoutes();
