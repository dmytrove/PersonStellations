export const visualConfig = {
    cameraDistance: 15,
    panSpeed: 1.0,
    autoRotate: false,
    starSize: 1.0,
    rotationSpeed: 0.001,
    starColor: '#ffffff',
    starBrightness: 1.0,
    randomColors: true,
    domeVisible: true,
    domeOpacity: 0.03,
    geodesicLines: true,
    geodesicCount: 24
};

export const timelineConfig = {
    currentYear: -400,
    minYear: -400,
    maxYear: 2023,
    personVisibility: {}
};

export const visualizationConfig = {
    // Camera settings
    cameraDistance: 30,
    
    // Interaction settings
    panSpeed: 1.0,
    autoRotate: false,
    rotationSpeed: 0.001, // Adding explicit rotationSpeed
    
    // Visualization settings
    geodesicCount: 20,
    
    // Time range
    minYear: 0,
    maxYear: 2024,
    startYear: 0,
    endYear: 2024,
    
    // Visibility settings
    personVisibility: {},

    // Control functions
    reset: false // Adding reset property
};