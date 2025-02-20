export class TouchInputManager {
    constructor(inputManager) {
        this.inputManager = inputManager;
        this.touchStartTime = 0;
        this.touchStartPos = { x: 0, y: 0 };
        this.lastTouchTime = 0;
        this.MIN_TOUCH_DELAY = 50; // Debounce threshold in ms
    }

    setupEventListeners(canvas, config) {
        // Use passive listeners where possible for better scrolling performance
        canvas.addEventListener('touchstart', (event) => {
            // Throttle touch events
            const now = performance.now();
            if (now - this.lastTouchTime < this.MIN_TOUCH_DELAY) {
                event.preventDefault();
                return;
            }
            this.lastTouchTime = now;
            
            this.touchStartTime = now;
            const touch = event.touches[0];
            this.touchStartPos = { x: touch.clientX, y: touch.clientY };

            if (event.touches.length === 2) {
                this.inputManager.start(0, 0, event.touches);
            } else {
                this.inputManager.start(touch.clientX, touch.clientY);
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
            
            // Throttle touch events
            const now = performance.now();
            if (now - this.lastTouchTime < this.MIN_TOUCH_DELAY) return;
            this.lastTouchTime = now;

            if (event.touches.length === 2) {
                this.inputManager.move(0, 0, config, event.touches);
            } else {
                const touch = event.touches[0];
                // Calculate move delta for smoother touch handling
                const deltaX = touch.clientX - this.touchStartPos.x;
                const deltaY = touch.clientY - this.touchStartPos.y;
                
                // Apply dampening for smoother movement
                const dampenedX = touch.clientX - (deltaX * 0.2);
                const dampenedY = touch.clientY - (deltaY * 0.2);
                
                this.inputManager.move(dampenedX, dampenedY, config);
            }
        }, { passive: false });

        // Use passive listeners for end/cancel events
        canvas.addEventListener('touchend', () => {
            this.inputManager.end();
        }, { passive: true });

        canvas.addEventListener('touchcancel', () => {
            this.inputManager.end();
        }, { passive: true });

        // Prevent unwanted touch behaviors on iOS
        document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });
    }
}