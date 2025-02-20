import { MouseInputManager } from './input/MouseInputManager.js';
import { TouchInputManager } from './input/TouchInputManager.js';
import { WheelInputManager } from './input/WheelInputManager.js';
import { config } from './config/index.js';

export class InputManager {
    constructor() {
        this.isDragging = false;
        this.previousPosition = { x: 0, y: 0 };
        this.targetRotation = { x: 0, y: 0 };
        this.currentRotation = { x: 0, y: 0 };
        this.pinchStartDistance = 0;
        this.camera = null;

        // Initialize input managers
        this.mouseInput = new MouseInputManager(this);
        this.touchInput = new TouchInputManager(this);
        this.wheelInput = new WheelInputManager(this);
    }

    setCamera(camera) {
        this.camera = camera;
    }

    start(x, y, touches) {
        if (touches && touches.length === 2) {
            // Handle pinch start
            const touch1 = touches[0];
            const touch2 = touches[1];
            this.pinchStartDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
        } else {
            // Handle regular drag start
            this.isDragging = true;
            this.previousPosition = { x, y };
        }
    }

    move(x, y, config, touches) {
        if (touches && touches.length === 2) {
            // Handle pinch move
            const touch1 = touches[0];
            const touch2 = touches[1];
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            
            if (this.pinchStartDistance > 0 && this.camera) {
                const scale = currentDistance / this.pinchStartDistance;
                const newDistance = this.camera.position.z / scale;
                this.camera.position.z = Math.min(Math.max(newDistance, 0), 50);
                config.cameraDistance = this.camera.position.z;
            }
            this.pinchStartDistance = currentDistance;
        } else if (this.isDragging) {
            // Handle regular drag move
            const deltaMove = {
                x: x - this.previousPosition.x,
                y: y - this.previousPosition.y
            };

            this.targetRotation.x += deltaMove.y * 0.005 * config.panSpeed;
            this.targetRotation.y += deltaMove.x * 0.005 * config.panSpeed;

            // Limit vertical rotation
            this.targetRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.targetRotation.x));

            this.previousPosition = { x, y };
        }
    }

    end() {
        this.isDragging = false;
        this.pinchStartDistance = 0;
    }

    setupEventListeners(canvas, config) {
        this.mouseInput.setupEventListeners(canvas, config);
        this.touchInput.setupEventListeners(canvas, config);
        this.wheelInput.setupEventListeners(canvas, config);
    }

    update(stars, config) {
        if (stars) {
            // Smooth rotation interpolation
            this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.1;
            this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.1;
            
            stars.rotation.x = this.currentRotation.x;
            stars.rotation.y = this.currentRotation.y;

            // Auto-rotation when enabled and not dragging
            if (config.autoRotate && !this.isDragging) {
                // Use rotationSpeed from config
                this.targetRotation.y += config.rotationSpeed || 0.001;
            }
        }
    }

    reset() {
        // Reset rotation state
        this.targetRotation.x = 0;
        this.targetRotation.y = 0;
        this.currentRotation.x = 0;
        this.currentRotation.y = 0;

        // Reset interaction state
        this.isDragging = false;
        this.pinchStartDistance = 0;
        this.previousPosition = { x: 0, y: 0 };

        // Reset camera to initial position if available
        if (this.camera && typeof config !== 'undefined') {
            this.camera.position.z = config.cameraDistance;
            this.camera.updateProjectionMatrix();
        }
    }
}