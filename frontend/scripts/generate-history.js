import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const historyDir = path.join(__dirname, '../public/history');
const outputFile = path.join(__dirname, '../public/history-index.json');

function generateHistoryIndex() {
    if (!fs.existsSync(historyDir)) {
        console.log('No history directory found.');
        fs.writeFileSync(outputFile, '[]');
        return;
    }

    const historyItems = [];
    const entries = fs.readdirSync(historyDir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const detailsPath = path.join(historyDir, entry.name, 'details.json');
            if (fs.existsSync(detailsPath)) {
                try {
                    const detailsContent = fs.readFileSync(detailsPath, 'utf-8');
                    const details = JSON.parse(detailsContent);

                    // Basic validation/extraction
                    if (details.id && details.name) {
                        historyItems.push({
                            id: details.id,
                            name: details.name,
                            description: details.description,
                            path: entry.name, // The folder name to construct the URL
                            date: details.date,
                            colors: details.colors || undefined
                        });
                    }
                } catch (error) {
                    console.error(`Error reading/parsing ${detailsPath}:`, error);
                }
            }
        }
    }

    // Sort by ID descending as requested
    historyItems.sort((a, b) => {
        const idA = parseInt(a.id);
        const idB = parseInt(b.id);
        if (!isNaN(idA) && !isNaN(idB)) {
            return idB - idA;
        }
        return String(b.id).localeCompare(String(a.id));
    });

    fs.writeFileSync(outputFile, JSON.stringify(historyItems, null, 2));
    console.log(`Generated history index with ${historyItems.length} items at ${outputFile}`);
}

generateHistoryIndex();
