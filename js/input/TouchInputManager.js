export class TouchInputManager {
    constructor(inputManager) {
        this.inputManager = inputManager;
    }

    setupEventListeners(canvas, config) {
        canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            if (event.touches.length === 2) {
                this.inputManager.start(0, 0, event.touches);
            } else {
                const touch = event.touches[0];
                this.inputManager.start(touch.clientX, touch.clientY);
            }
        });

        canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
            if (event.touches.length === 2) {
                this.inputManager.move(0, 0, config, event.touches);
            } else {
                const touch = event.touches[0];
                this.inputManager.move(touch.clientX, touch.clientY, config);
            }
        });

        canvas.addEventListener('touchend', (event) => {
            event.preventDefault();
            this.inputManager.end();
        });

        canvas.addEventListener('touchcancel', (event) => {
            event.preventDefault();
            this.inputManager.end();
        });

        // Prevent default touch behavior
        document.body.addEventListener('touchmove', (event) => {
            event.preventDefault();
        }, { passive: false });
    }
}