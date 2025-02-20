import { config } from '../../config/index.js';

export class ControlsFolderManager {
    constructor(app) {
        this.app = app;
    }
    
    setupFolder(gui) {
        const controlFolder = gui.addFolder('Controls');
        controlFolder.open(false);
        
        // Navigation controls
        controlFolder.add(config, 'panSpeed', 0.1, 3, 0.1);
        
        // Rotation controls
        const rotationFolder = controlFolder.addFolder('Auto Rotation');
        rotationFolder.add(config, 'autoRotate');
        rotationFolder.add(config, 'rotationSpeed', 0.0001, 0.005, 0.0001).name('Speed');

        // Reset control
        const resetControl = {
            reset: () => this.app.resetView()
        };
        controlFolder.add(resetControl, 'reset').name('Reset View');
        
        return controlFolder;
    }
}