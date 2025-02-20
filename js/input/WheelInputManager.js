export class WheelInputManager {
    constructor(inputManager) {
        this.inputManager = inputManager;
    }

    setupEventListeners(canvas, config) {
        canvas.addEventListener('wheel', (event) => {
            this.handleWheel(event, config);
        }, { passive: false });
    }

    handleWheel(event, config) {
        if (!this.inputManager.camera) return;
        
        event.preventDefault();
        const zoomSpeed = 0.1;
        const delta = -Math.sign(event.deltaY) * zoomSpeed;
        const newDistance = this.inputManager.camera.position.z * (1 - delta);
        
        this.inputManager.camera.position.z = Math.min(Math.max(newDistance, 0), 50);
        config.cameraDistance = this.inputManager.camera.position.z;
    }
}