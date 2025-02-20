export async function getCentropaBios() {
    const centropaBioIds = ['edith-umova', 'michal-warzager', 'stanislaw-wierzba'];
    
    try {
        const bios = await Promise.all(
            centropaBioIds.map(async (id) => {
                const bioResponse = await fetch(`bios/centropa/${id}.json`);
                if (!bioResponse.ok) {
                    console.error(`Failed to load bio for ${id}`);
                    return null;
                }
                const bio = await bioResponse.json();
                bio.category = 'centropa';
                return bio;
            })
        );
        return bios.filter(bio => bio !== null);
    } catch (error) {
        console.error('Error loading centropa bios:', error);
        return [];
    }
}