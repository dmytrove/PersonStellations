import * as THREE from 'three';
import { config } from '../config/index.js';

export class SceneManager {
    constructor() {
        const theme = config.isDarkTheme ? config.darkTheme : config.lightTheme;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.group = new THREE.Group();
        
        this.scene.background = new THREE.Color(theme.backgroundColor);
        this.setupRenderer();
        this.scene.add(this.group);
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);
        this.camera.position.z = config.cameraDistance;
        this.scene.background = new THREE.Color(config.backgroundColor);
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    setBackground(color) {
        this.scene.background = new THREE.Color(color);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}