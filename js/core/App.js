import * as THREE from 'three';
import { config, applyTheme } from '../config/index.js';
import { loadBiosData } from '../data/bioLoader.js';
import { InputManager } from '../input-manager.js';
import { GUIManager } from '../ui/GUI.js';
import { SceneManager } from '../visualization/SceneManager.js';
import { VisualizationManager } from '../visualization/VisualizationManager.js';

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
    }

    async init() {
        await this.loadData();
        this.guiManager.setupGUI();
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

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = performance.now() * 0.001;
        this.visualizationManager.updateAnimation(time);
        this.inputManager.update(this.sceneManager.group, config);
        this.sceneManager.render();
    }

    startAnimation() {
        this.animate();
    }
}