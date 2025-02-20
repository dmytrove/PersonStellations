export const config = {
    cameraDistance: 15,
    backgroundColor: '#000000',
    panSpeed: 1.0,
    autoRotate: false, // Disabled by default
    currentYear: -400,
    minYear: -400,
    maxYear: 2023, // Will be dynamically set based on data
    reset: false,
    personVisibility: {},
    // Internal visualization configs (not exposed to GUI)
    starSize: 1.0,
    rotationSpeed: 0.001,
    starColor: '#ffffff',
    starBrightness: 1.0,
    randomColors: true,
    domeVisible: true,
    domeOpacity: 0.03, // Made even more subtle
    geodesicLines: true,
    geodesicColor: '#222222', // Slightly brighter lines
    geodesicCount: 24, // More lines for better visualization
    isDarkTheme: true,
    darkTheme: {
        backgroundColor: '#000000',
        textColor: '#ffffff',
        guiTheme: 'dark'
    },
    lightTheme: {
        backgroundColor: '#ffffff',
        textColor: '#000000',
        guiTheme: 'light'
    }
};

export function latLongToCartesian(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    return {
        x: -radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta)
    };
}

async function getCentropaBioIds() {
    try {
        const centropaBios = ['edith-umova', 'michal-warzager', 'stanislaw-wierzba'];
        return centropaBios;
    } catch (error) {
        console.error('Error getting Centropa bio IDs:', error);
        return [];
    }
}

async function getBioFolders() {
    return ['Famous', 'centropa'];
}

async function getBiosFromFolder(folder) {
    try {
        if (folder === 'Famous') {
            const famousBioIds = [
                'aristotle', 'austen', 'cleopatra', 'curie', 'darwin',
                'davinci', 'einstein', 'gandhi', 'kahlo', 'keller',
                'lovelace', 'mandela', 'mozart', 'nightingale', 'pasteur',
                'picasso', 'shakespeare', 'tesla', 'vangogh', 'victoria'
            ];
            
            return await Promise.all(
                famousBioIds.map(async (id) => {
                    const bioResponse = await fetch(`bios/Famous/${id}.json`);
                    if (!bioResponse.ok) {
                        console.error(`Failed to load bio for ${id}`);
                        return null;
                    }
                    const bio = await bioResponse.json();
                    bio.category = 'Famous';
                    return bio;
                })
            );
        } else {
            // Handle centropa folder
            const bioIds = folder === 'centropa' ? 
                ['edith-umova', 'michal-warzager', 'stanislaw-wierzba'] : [];
            
            return await Promise.all(
                bioIds.map(async (id) => {
                    const bioResponse = await fetch(`bios/${folder}/${id}.json`);
                    if (!bioResponse.ok) {
                        console.error(`Failed to load bio for ${id}`);
                        return null;
                    }
                    const bio = await bioResponse.json();
                    bio.category = folder;
                    return bio;
                })
            );
        }
    } catch (error) {
        console.error(`Error loading bios from folder ${folder}:`, error);
        return [];
    }
}

export async function loadBiosData() {
    try {
        const folders = await getBioFolders();
        const allBiosArrays = await Promise.all(
            folders.map(folder => getBiosFromFolder(folder))
        );
        
        // Flatten the array of arrays and filter out nulls
        const allBios = allBiosArrays.flat().filter(bio => bio !== null);
        return allBios;
    } catch (error) {
        console.error('Error loading bios data:', error);
        return [];
    }
}