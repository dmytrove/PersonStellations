import * as THREE from 'three';
import { config } from '../config/index.js';

export class SceneManager {
    constructor() {
        const theme = config.isDarkTheme ? config.darkTheme : config.lightTheme;
        this.scene = new THREE.Scene();
        this.isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // Optimize camera for mobile
        this.camera = new THREE.PerspectiveCamera(
            this.isMobileDevice ? 60 : 75, // Narrower FOV for mobile
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        // Optimize renderer for mobile
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: !this.isMobileDevice, // Disable antialiasing on mobile
            powerPreference: 'high-performance',
            alpha: false
        });
        
        // Enable optimizations
        this.renderer.sortObjects = false;
        this.renderer.powerPreference = 'high-performance';
        
        if (this.isMobileDevice) {
            this.renderer.shadowMap.enabled = false;
            this.renderer.physicallyCorrectLights = false;
        }
        
        this.group = new THREE.Group();
        this.scene.background = new THREE.Color(theme.backgroundColor);
        this.setupRenderer();
        this.scene.add(this.group);
    }

    setupRenderer() {
        // Calculate size based on screen density
        const maxPixelRatio = this.isMobileDevice ? 1.5 : 2;
        const pixelRatio = Math.min(window.devicePixelRatio, maxPixelRatio);
        
        // Set initial size with exact pixel dimensions
        const width = Math.floor(window.innerWidth * pixelRatio);
        const height = Math.floor(window.innerHeight * pixelRatio);
        
        this.renderer.setSize(width, height, false);
        this.renderer.setPixelRatio(pixelRatio);
        
        document.body.appendChild(this.renderer.domElement);
        this.camera.position.z = config.cameraDistance;
    }

    onWindowResize() {
        const pixelRatio = this.renderer.getPixelRatio();
        const width = Math.floor(window.innerWidth * pixelRatio);
        const height = Math.floor(window.innerHeight * pixelRatio);
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }

    setBackground(color) {
        this.scene.background = new THREE.Color(color);
    }

    render() {
        if (this.isMobileDevice) {
            // Skip rendering if page is not visible
            if (document.hidden) return;
            
            // Throttle rendering on mobile
            const now = performance.now();
            if (now - (this._lastRenderTime || 0) < 32) { // Cap at ~30fps on mobile
                return;
            }
            this._lastRenderTime = now;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}