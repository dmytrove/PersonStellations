export class InputManager {
    constructor() {
        this.isDragging = false;
        this.previousPosition = { x: 0, y: 0 };
        this.targetRotation = { x: 0, y: 0 };
        this.currentRotation = { x: 0, y: 0 };
        this.pinchStartDistance = 0;
        this.camera = null;
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
                this.camera.position.z = Math.min(Math.max(newDistance, 0), 50); // Reduced minimum distance from 5 to 2
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

    handleWheel(event, config) {
        if (!this.camera) return;
        
        event.preventDefault();
        const zoomSpeed = 0.1;
        const delta = -Math.sign(event.deltaY) * zoomSpeed;
        const newDistance = this.camera.position.z * (1 - delta);
        
        // Clamp between min (2) and max (50) distance
        this.camera.position.z = Math.min(Math.max(newDistance, 0), 50); // Reduced minimum distance from 5 to 2
        config.cameraDistance = this.camera.position.z;
    }

    end() {
        this.isDragging = false;
        this.pinchStartDistance = 0;
    }

    setupEventListeners(canvas, config) {
        // Mouse events
        canvas.addEventListener('mousedown', (event) => {
            event.preventDefault();
            this.start(event.clientX, event.clientY);
        });

        canvas.addEventListener('mousemove', (event) => {
            event.preventDefault();
            this.move(event.clientX, event.clientY, config);
        });

        canvas.addEventListener('mouseup', (event) => {
            event.preventDefault();
            this.end();
        });

        canvas.addEventListener('mouseleave', (event) => {
            event.preventDefault();
            this.end();
        });

        // Mouse wheel zoom
        canvas.addEventListener('wheel', (event) => {
            this.handleWheel(event, config);
        }, { passive: false });

        // Touch events
        canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            if (event.touches.length === 2) {
                this.start(0, 0, event.touches);
            } else {
                const touch = event.touches[0];
                this.start(touch.clientX, touch.clientY);
            }
        });

        canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
            if (event.touches.length === 2) {
                this.move(0, 0, config, event.touches);
            } else {
                const touch = event.touches[0];
                this.move(touch.clientX, touch.clientY, config);
            }
        });

        canvas.addEventListener('touchend', (event) => {
            event.preventDefault();
            this.end();
        });

        canvas.addEventListener('touchcancel', (event) => {
            event.preventDefault();
            this.end();
        });

        // Prevent default touch behavior
        document.body.addEventListener('touchmove', (event) => {
            event.preventDefault();
        }, { passive: false });
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
                this.targetRotation.y += config.rotationSpeed;
            }
        }
    }

    reset() {
        this.targetRotation.x = 0;
        this.targetRotation.y = 0;
        this.currentRotation.x = 0;
        this.currentRotation.y = 0;
    }
}