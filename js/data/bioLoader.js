async function getBioIndex() {
    try {
        const response = await fetch('bios/index.json');
        if (!response.ok) {
            throw new Error('Failed to load bio index');
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading bio index:', error);
        return { categories: {} };
    }
}

async function loadBioFromFile(folder, id) {
    try {
        const bioResponse = await fetch(`bios/${folder}/${id}.json`);
        if (!bioResponse.ok) {
            console.error(`Failed to load bio for ${id}`);
            return null;
        }
        const bio = await bioResponse.json();
        bio.category = folder;
        return bio;
    } catch (error) {
        console.error(`Error loading bio ${id}:`, error);
        return null;
    }
}

export async function loadBiosData() {
    try {
        const index = await getBioIndex();
        const allBios = await Promise.all(
            Object.entries(index.categories).flatMap(([folder, { files }]) =>
                files.map(id => loadBioFromFile(folder, id))
            )
        );
        return allBios.filter(bio => bio !== null);
    } catch (error) {
        console.error('Error loading bios data:', error);
        return [];
    }
}