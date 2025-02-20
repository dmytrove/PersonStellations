import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { latLongToCartesian } from './coordinates.js';

const RADIUS = 100; // Using a default radius of 100 units

function processDirectory(dirPath) {
    const files = readdirSync(dirPath);
    files.forEach(file => {
        if (file.endsWith('.json')) {
            const filePath = join(dirPath, file);
            const bioData = JSON.parse(readFileSync(filePath, 'utf8'));
            
            // Add cartesian coordinates to each event
            bioData.events = bioData.events.map(event => ({
                ...event,
                cartesian: latLongToCartesian(event.lat, event.lon, RADIUS)
            }));
            
            // Write back the updated JSON
            writeFileSync(filePath, JSON.stringify(bioData, null, 4), 'utf8');
        }
    });
}

// Process both Famous and Centropa directories
const directories = ['Famous', 'Centropa'].map(dir => join(process.cwd(), 'bios', dir));
directories.forEach(processDirectory);

console.log('Coordinates pre-computation complete!');