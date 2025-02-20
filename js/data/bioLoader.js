import { getFamousBios } from './famousBioLoader.js';
import { getCentropaBios } from './centropaBioLoader.js';

async function getCentropaBioIds() {
    return ['edith-umova', 'michal-warzager', 'stanislaw-wierzba'];
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
            const bioIds = await getCentropaBioIds();
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
        const [famousBios, centropaBios] = await Promise.all([
            getFamousBios(),
            getCentropaBios()
        ]);
        
        return [...famousBios, ...centropaBios];
    } catch (error) {
        console.error('Error loading bios data:', error);
        return [];
    }
}