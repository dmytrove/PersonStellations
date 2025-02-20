export class MouseInputManager {
    constructor(inputManager) {
        this.inputManager = inputManager;
    }

    setupEventListeners(canvas, config) {
        canvas.addEventListener('mousedown', (event) => {
            event.preventDefault();
            this.inputManager.start(event.clientX, event.clientY);
        });

        canvas.addEventListener('mousemove', (event) => {
            event.preventDefault();
            this.inputManager.move(event.clientX, event.clientY, config);
        });

        canvas.addEventListener('mouseup', (event) => {
            event.preventDefault();
            this.inputManager.end();
        });

        canvas.addEventListener('mouseleave', (event) => {
            event.preventDefault();
            this.inputManager.end();
        });
    }
}