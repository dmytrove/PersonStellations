export class InfoFolderManager {
    setupFolder(gui) {
        const infoFolder = gui.addFolder('Info');
        const description = document.createElement('div');
        description.innerHTML = `
            <div style="padding: 8px; margin: 8px 0;">
                <p style="margin: 0 0 8px 0;">PersonStellations transforms biographies into an 
                interactive 3D star map, where each star represents a significant moment in a person's life.</p>
                <p style="margin: 0;">Featuring stories of Holocaust survivors and historical figures.</p>
            </div>
        `;
        description.style.fontSize = '12px';
        description.style.lineHeight = '1.4';
        infoFolder.domElement.appendChild(description);

        const links = {
            openDemo: () => window.open('https://dmytrove.github.io/PersonStellations/', '_blank'),
            openRepo: () => window.open('https://github.com/dmytrove/PersonStellations', '_blank'),
            openIssues: () => window.open('https://github.com/dmytrove/PersonStellations/issues', '_blank')
        };
        infoFolder.add(links, 'openDemo').name('Live Demo');
        infoFolder.add(links, 'openRepo').name('GitHub Repository');
        infoFolder.add(links, 'openIssues').name('Report Issues');
        infoFolder.open(false);
        
        return infoFolder;
    }
}