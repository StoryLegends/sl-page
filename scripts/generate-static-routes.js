import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define your static routes with specific metadata
const routes = [
    {
        path: 'about',
        title: 'О сервере - StoryLegends',
        description: 'Узнайте больше о мире StoryLegends, нашем сообществе и особенностях бесплатного ванильного сервера Minecraft.'
    },
    {
        path: 'rules',
        title: 'Правила - StoryLegends',
        description: 'Правила игры на сервере StoryLegends. Соблюдение этих норм обеспечивает комфортную игру для всех.'
    },
    {
        path: 'faq',
        title: 'FAQ / ЧЗВ - StoryLegends',
        description: 'Ответы на часто задаваемые вопросы о сервере StoryLegends. Как начать играть, правила, моды и решение проблем.'
    },
    {
        path: 'history',
        title: 'История - StoryLegends',
        description: 'Хроники сезонов и великие события сервера StoryLegends. Погрузитесь в прошлое нашего мира.'
    },
    {
        path: 'glorylist',
        title: 'Зал Славы - StoryLegends',
        description: 'Легендарные игроки и строители, оставившие свой след в истории StoryLegends.'
    },
    {
        path: 'privacy-policy',
        title: 'Политика конфиденциальности - StoryLegends',
        description: 'Политика обработки персональных данных и конфиденциальности на сайте StoryLegends.'
    },
    {
        path: 'user-agreement',
        title: 'Пользовательское соглашение - StoryLegends',
        description: 'Условия использования сервисов и правила поведения на проекте StoryLegends.'
    },
    {
        path: 'licenses',
        title: 'Лицензии - StoryLegends',
        description: 'Информация о лицензиях и правах на использование контента StoryLegends.'
    },
    {
        path: '404',
        title: 'Страница не найдена - StoryLegends',
        description: 'Кажется вы заблудились...'
    }
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

    // Base values to replace from index.html
    const defaultTitle = 'StoryLegends';
    const defaultDescription = 'StoryLegends - Бесплатный ванильный сервер Minecraft';
    const defaultUrl = 'https://www.storylegends.xyz/';
    const defaultImage = 'https://www.storylegends.xyz/images/opengraph.png';
    const saulImage = 'https://www.storylegends.xyz/images/saul.png';

    routes.forEach(route => {
        let targetPath;
        if (route.path === '404') {
            targetPath = path.join(distDir, '404.html');
            // override for 404
            route.image = saulImage;
        } else {
            const routeDir = path.join(distDir, route.path);
            if (!fs.existsSync(routeDir)) {
                fs.mkdirSync(routeDir, { recursive: true });
            }
            targetPath = path.join(routeDir, 'index.html');
        }

        let routeContent = indexContent;

        // Replace Title Tag
        routeContent = routeContent.replace(/<title>.*<\/title>/, `<title>${route.title}</title>`);

        // Replace OG Title (assuming it matches defaultTitle)
        routeContent = routeContent.replace(new RegExp(`content="${defaultTitle}"`, 'g'), `content="${route.title}"`);

        // Replace Description
        routeContent = routeContent.replace(new RegExp(`content="${defaultDescription}"`, 'g'), `content="${route.description}"`);

        // Replace URL - escape dots in defaultUrl for regex
        const escapedDefaultUrl = defaultUrl.replace(/\./g, '\\.');
        const routeUrl = `${defaultUrl}${route.path}`;
        routeContent = routeContent.replace(new RegExp(`content="${escapedDefaultUrl}"`, 'g'), `content="${routeUrl}"`);

        // Replace global Image if specified for the route
        if (route.image) {
            routeContent = routeContent.replace(new RegExp(`content="${defaultImage}"`, 'g'), `content="${route.image}"`);
        }

        // Write file
        fs.writeFileSync(targetPath, routeContent);
        console.log(`Created custom page for: ${route.path}`);
    });

    console.log('Static route generation complete.');
}

generateStaticRoutes();
