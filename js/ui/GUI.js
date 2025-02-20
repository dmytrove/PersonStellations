import GUI from 'lil-gui';
import * as THREE from 'three';
import { config } from '../config/index.js';
import { InfoFolderManager } from './folders/InfoFolder.js';
import { PersonsFolderManager } from './folders/PersonsFolder.js';
import { ControlsFolderManager } from './folders/ControlsFolder.js';

export class GUIManager {
    constructor(app) {
        this.app = app;
        this.gui = null;
        
        // Initialize folder managers
        this.infoFolder = new InfoFolderManager();
        this.personsFolder = new PersonsFolderManager(app);
        this.controlsFolder = new ControlsFolderManager(app);
    }

    setupGUI() {
        this.gui = new GUI();
        const theme = config.isDarkTheme ? config.darkTheme : config.lightTheme;
        this.gui.domElement.classList.add(theme.guiTheme);
        
        if (window.innerWidth <= 768) {
            this.gui.close();
        }

        // Setup folders using specialized managers
        this.infoFolder.setupFolder(this.gui);
        this.setupAppearanceFolder();
        this.personsFolder.setupFolder(this.gui);
        this.controlsFolder.setupFolder(this.gui);
        this.setupCameraFolder();
        this.setupSceneFolder();
    }

    setupAppearanceFolder() {
        const appearanceFolder = this.gui.addFolder('Appearance');
        appearanceFolder.open(false);
        appearanceFolder.add(config, 'isDarkTheme')
            .name('Dark Theme')
            .onChange((value) => {
                this.app.applyTheme(value);
                const theme = value ? 'dark' : 'light';
                this.gui.domElement.classList.remove('theme-dark', 'theme-light');
                this.gui.domElement.classList.add(`theme-${theme}`);
            });
    }

    setupCameraFolder() {
        const cameraFolder = this.gui.addFolder('Camera');
        cameraFolder.open(false);
        cameraFolder.add(config, 'cameraDistance', 0, 50).onChange((value) => {
            if (this.app.camera) {
                this.app.camera.position.z = value;
            }
        });
    }

    setupSceneFolder() {
        const sceneFolder = this.gui.addFolder('Scene');
        sceneFolder.open(false);
        sceneFolder.addColor(config, 'backgroundColor').onChange((value) => {
            if (this.app.scene) {
                this.app.scene.background = new THREE.Color(value);
            }
        });
    }

    destroy() {
        if (this.gui) {
            this.gui.destroy();
            this.gui = null;
        }
    }
}