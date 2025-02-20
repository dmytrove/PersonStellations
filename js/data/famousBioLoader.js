export async function getFamousBios() {
    const famousBioIds = [
        'aristotle', 'austen', 'cleopatra', 'curie', 'darwin',
        'davinci', 'einstein', 'gandhi', 'kahlo', 'keller',
        'lovelace', 'mandela', 'mozart', 'nightingale', 'pasteur',
        'picasso', 'shakespeare', 'tesla', 'vangogh', 'victoria'
    ];
    
    try {
        const bios = await Promise.all(
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
        return bios.filter(bio => bio !== null);
    } catch (error) {
        console.error('Error loading famous bios:', error);
        return [];
    }
}