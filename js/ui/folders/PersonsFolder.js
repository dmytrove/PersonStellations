import { config } from '../../config/index.js';

export class PersonsFolderManager {
    constructor(app) {
        this.app = app;
        this.categoryFolders = {};
    }
    
    setupFolder(gui) {
        const personsFolder = gui.addFolder('Persons');
        personsFolder.open(false);

        // Group persons by category
        const personsByCategory = {};
        this.app.persons.forEach(person => {
            const category = person.category || 'Uncategorized';
            if (!personsByCategory[category]) {
                personsByCategory[category] = [];
            }
            personsByCategory[category].push(person);
        });

        // Create folders for each category
        Object.entries(personsByCategory).forEach(([category, persons]) => {
            const categoryFolder = personsFolder.addFolder(category);
            this.categoryFolders[category] = categoryFolder;
            categoryFolder.open(false);

            this.setupCategoryToggles(categoryFolder, persons);
        });
        
        return personsFolder;
    }

    setupCategoryToggles(categoryFolder, persons) {
        const toggleAllConfig = {
            [`toggleAll${categoryFolder.title}`]: () => {
                const allVisible = !persons.every(p => config.personVisibility[p.name]);
                persons.forEach(person => {
                    config.personVisibility[person.name] = allVisible;
                    const controller = categoryFolder.controllers.find(c => c.property === person.name);
                    if (controller) controller.updateDisplay();
                });
                this.app.visualizationManager.updateStarVisibility();
            }
        };
        categoryFolder.add(toggleAllConfig, `toggleAll${categoryFolder.title}`).name('Toggle All');

        persons.forEach(person => {
            config.personVisibility[person.name] = true;
            categoryFolder.add(config.personVisibility, person.name).onChange(() => {
                this.app.visualizationManager.updateStarVisibility();
            });
        });
    }
}