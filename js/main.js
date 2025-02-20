import { config, loadBiosData } from './config.js';
import { InputManager } from './input-manager.js';
import { StarVisualizer } from './star-visualizer.js';
import GUI from 'lil-gui';

export class App {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.inputManager = new InputManager();
        this.starVisualizer = new StarVisualizer();
        this.persons = [];
        this.gui = null; // Add GUI instance property
        this.peopleFolder = null; // Initialize peopleFolder reference
        
        this.applyTheme(config.isDarkTheme);
        this.init();
    }

    async init() {
        this.setupRenderer();
        await this.loadData();
        this.setupGUI();
        this.inputManager.setCamera(this.camera);
        this.setupEventListeners();
        this.startAnimation();
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);
        this.camera.position.z = config.cameraDistance;
        this.scene.background = new THREE.Color(config.backgroundColor);
    }

    setupGUI() {
        this.gui = new GUI(); // Store GUI instance
        this.gui.domElement.classList.add(config.isDarkTheme ? 'theme-dark' : 'theme-light');
        
        if (window.innerWidth <= 768) {
            this.gui.close();
        }

        // Add Info folder at the top
        const infoFolder = this.gui.addFolder('Info');
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

        const appearanceFolder = this.gui.addFolder('Appearance');
        appearanceFolder.open(false);
        appearanceFolder.add(config, 'isDarkTheme')
            .name('Dark Theme')
            .onChange((value) => {
                this.applyTheme(value);
                this.gui.domElement.classList.toggle('theme-dark', value);
                this.gui.domElement.classList.toggle('theme-light', !value);
            });

        // Create a parent Persons folder
        const personsFolder = this.gui.addFolder('Persons');
        personsFolder.open(false);

        // Create folders for each category
        const categoryFolders = {};
        
        // Group persons by category
        const personsByCategory = {};
        this.persons.forEach(person => {
            const category = person.category || 'Uncategorized';
            if (!personsByCategory[category]) {
                personsByCategory[category] = [];
            }
            personsByCategory[category].push(person);
        });

        // Create folders and controls for each category under the Persons folder
        Object.entries(personsByCategory).forEach(([category, persons]) => {
            const categoryFolder = personsFolder.addFolder(category);
            categoryFolders[category] = categoryFolder;
            categoryFolder.open(false);

            // Add toggle all function for this category
            const toggleAllConfig = {
                [`toggleAll${category}`]: () => {
                    const categoryPersons = persons;
                    const allVisible = !categoryPersons.every(p => config.personVisibility[p.name]);
                    categoryPersons.forEach(person => {
                        config.personVisibility[person.name] = allVisible;
                        // Update the GUI controls to match
                        const controller = categoryFolder.controllers.find(c => c.property === person.name);
                        if (controller) controller.updateDisplay();
                    });
                    this.updateStarVisibility();
                }
            };
            categoryFolder.add(toggleAllConfig, `toggleAll${category}`).name('Toggle All');

            // Add individual toggles for this category
            persons.forEach(person => {
                config.personVisibility[person.name] = true;
                categoryFolder.add(config.personVisibility, person.name).onChange(() => {
                    this.updateStarVisibility();
                });
            });
        });

        // Store category folders for potential future use
        this.categoryFolders = categoryFolders;

        const controlFolder = this.gui.addFolder('Controls');
        controlFolder.open(false);
        controlFolder.add(config, 'panSpeed', 0.1, 3, 0.1);
        controlFolder.add(config, 'autoRotate');
        controlFolder.add(config, 'reset').onChange(() => this.resetView());

        const cameraFolder = this.gui.addFolder('Camera');
        cameraFolder.open(false);
        cameraFolder.add(config, 'cameraDistance', 0, 50).onChange((value) => {
            this.camera.position.z = value;
        });

        const sceneFolder = this.gui.addFolder('Scene');
        sceneFolder.open(false);
        sceneFolder.addColor(config, 'backgroundColor').onChange((value) => {
            this.scene.background = new THREE.Color(value);
        });
    }

    applyTheme(isDark) {
        const theme = isDark ? config.darkTheme : config.lightTheme;
        document.body.classList.toggle('theme-dark', isDark);
        document.body.classList.toggle('theme-light', !isDark);
        this.scene.background = new THREE.Color(theme.backgroundColor);
        
        // Update text colors for star labels
        if (this.starVisualizer) {
            this.starVisualizer.updateTextColors(config);
        }
        
        // Update GUI controllers if they exist
        if (this.gui) {
            this.gui.domElement.classList.toggle('theme-dark', isDark);
            this.gui.domElement.classList.toggle('theme-light', !isDark);
        }
    }

    setupEventListeners() {
        this.inputManager.setupEventListeners(this.renderer.domElement, config);
        window.addEventListener('resize', () => this.onWindowResize(), false);
        this.renderer.domElement.addEventListener('click', (event) => this.onStarClick(event));
    }

    async loadData() {
        this.persons = await loadBiosData();
        // Initialize all persons as visible and set year range
        const years = this.persons.flatMap(p => p.events.map(e => e.year));
        config.minYear = Math.min(...years);
        config.maxYear = Math.max(...years);
        config.startYear = config.minYear;
        config.endYear = config.maxYear;
        
        this.persons.forEach(person => {
            config.personVisibility[person.name] = true;
        });
        
        await this.updateStars();
    }

    async updateStars() {
        config.camera = this.camera; // Add camera to config for tooltip raycasting
        this.stars = await this.starVisualizer.createVisualization(this.persons, config, this.scene);
        this.updateStarVisibility();
    }

    updateStarVisibility() {
        // No longer hide GUI controls based on time range
        this.starVisualizer.updateVisibility(config.startYear, config.endYear, config.personVisibility);
    }

    onStarClick(event) {
        if (this.inputManager.isDragging) return;

        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObjects(this.starVisualizer.starMeshes);

        if (intersects.length > 0) {
            const star = intersects[0].object;
            // Animate the star on click
            const originalScale = star.scale.x;
            star.scale.setScalar(originalScale * 2);
            setTimeout(() => {
                star.scale.setScalar(originalScale);
            }, 200);
        }
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    resetView() {
        this.inputManager.reset();
        if (this.stars) {
            this.stars.rotation.x = 0;
            this.stars.rotation.y = 0;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.inputManager.update(this.stars, config);
        this.renderer.render(this.scene, this.camera);
    }

    startAnimation() {
        this.animate();
    }
}