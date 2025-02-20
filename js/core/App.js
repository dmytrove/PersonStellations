import * as THREE from 'three';
import { config, applyTheme } from '../config/index.js';
import { loadBiosData } from '../data/bioLoader.js';
import { InputManager } from '../input-manager.js';
import { GUIManager } from '../ui/GUI.js';
import { SceneManager } from '../visualization/SceneManager.js';
import { VisualizationManager } from '../visualization/VisualizationManager.js';
import { GUI } from 'lil-gui';
import { InfoFolderManager } from '../ui/folders/InfoFolder.js';
import { ControlsFolderManager } from '../ui/folders/ControlsFolder.js';
import { PersonsFolderManager } from '../ui/folders/PersonsFolder.js';

export class App {
    constructor() {
        this.sceneManager = new SceneManager();
        this.inputManager = new InputManager();
        this.guiManager = new GUIManager(this);
        this.visualizationManager = new VisualizationManager(this.sceneManager.group);
        this.persons = [];
        
        // Expose camera and scene for GUI access
        this.camera = this.sceneManager.camera;
        this.scene = this.sceneManager.scene;
        
        // Set camera for visualization manager
        this.visualizationManager.setCamera(this.camera);
        
        this.applyTheme(config.isDarkTheme);
        this.init();

        this.isRunning = true;
        this.lastRenderTime = 0;
        this.frameId = null;
        this.FRAME_BUDGET = 1000 / 60; // Target 60 FPS
    }

    async init() {
        await this.loadData();
        this.setupGUI();
        this.inputManager.setCamera(this.sceneManager.camera);
        this.setupEventListeners();
        this.startAnimation();
    }

    applyTheme(isDark) {
        const theme = applyTheme(isDark);
        document.body.classList.toggle('theme-dark', isDark);
        document.body.classList.toggle('theme-light', !isDark);
        this.sceneManager.setBackground(theme.backgroundColor);
        this.visualizationManager.updateGeodesicColor(theme.geodesicColor);
        this.visualizationManager.updateLabels();
        this.visualizationManager.tooltipManager.updateTheme(isDark);
    }

    async loadData() {
        this.persons = await loadBiosData();
        const years = this.persons.flatMap(p => p.events.map(e => e.year));
        config.minYear = Math.min(...years);
        config.maxYear = Math.max(...years);
        config.startYear = config.minYear;
        config.endYear = config.maxYear;
        
        this.persons.forEach(person => {
            config.personVisibility[person.name] = true;
        });
        
        await this.visualizationManager.createVisualization(this.persons);
    }

    setupEventListeners() {
        this.inputManager.setupEventListeners(this.sceneManager.renderer.domElement, config);
        window.addEventListener('resize', () => this.sceneManager.onWindowResize(), false);
    }

    resetView() {
        // Reset input manager
        this.inputManager.reset();
        
        // Reset camera position
        if (this.camera) {
            this.camera.position.z = config.cameraDistance;
        }
        
        // Reset scene group rotation
        if (this.sceneManager.group) {
            this.sceneManager.group.rotation.set(0, 0, 0);
        }
        
        // Update camera and GUI if needed
        this.camera.updateProjectionMatrix();
        if (this.guiManager.gui) {
            const cameraController = this.guiManager.gui.controllers.find(c => c.property === 'cameraDistance');
            if (cameraController) cameraController.updateDisplay();
        }
    }

    animate(timestamp) {
        if (!this.isRunning) return;
        
        const deltaTime = timestamp - this.lastRenderTime;
        if (deltaTime < this.FRAME_BUDGET) {
            this.frameId = requestAnimationFrame((t) => this.animate(t));
            return;
        }

        this.lastRenderTime = timestamp;
        
        const time = performance.now() * 0.001;
        this.visualizationManager.updateAnimation(time);
        this.inputManager.update(this.sceneManager.group, config);
        this.sceneManager.render();
        
        this.frameId = requestAnimationFrame((t) => this.animate(t));
    }

    startAnimation() {
        this.isRunning = true;
        this.lastRenderTime = performance.now();
        this.animate(this.lastRenderTime);
    }

    stopAnimation() {
        this.isRunning = false;
        if (this.frameId !== null) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
    }

    dispose() {
        this.stopAnimation();
        this.sceneManager.dispose();
        this.visualizationManager.dispose();
        if (this.guiManager) {
            this.guiManager.destroy();
        }
    }

    setupGUI() {
        this.gui = new GUI(); // Store GUI instance
        this.gui.domElement.classList.add(config.isDarkTheme ? 'theme-dark' : 'theme-light');
        
        if (window.innerWidth <= 768) {
            this.gui.close();
        }

        // Add folders
        const infoFolderManager = new InfoFolderManager();
        infoFolderManager.setupFolder(this.gui);

        const personsFolderManager = new PersonsFolderManager(this);
        personsFolderManager.setupFolder(this.gui);

        const controlsFolderManager = new ControlsFolderManager(this);
        controlsFolderManager.setupFolder(this.gui);

        const appearanceFolder = this.gui.addFolder('Appearance');
        appearanceFolder.open(false);
        appearanceFolder.add(config, 'isDarkTheme')
            .name('Dark Theme')
            .onChange((value) => {
                this.applyTheme(value);
                this.gui.domElement.classList.toggle('theme-dark', value);
                this.gui.domElement.classList.toggle('theme-light', !value);
            });

        const cameraFolder = this.gui.addFolder('Camera');
        cameraFolder.open(false);
        cameraFolder.add(config, 'cameraDistance', 0, 50).onChange((value) => {
            this.camera.position.z = value;
        });

        const sceneFolder = this.gui.addFolder('Scene');
        sceneFolder.open(false);
        sceneFolder.addColor(config, 'backgroundColor').onChange((value) => {
            this.sceneManager.setBackground(value);
        });
    }
}