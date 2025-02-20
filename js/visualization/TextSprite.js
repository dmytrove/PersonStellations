import * as THREE from 'three';

export class TextSprite {
    createSprite(text, config) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 2048;
        canvas.height = 1024;

        const theme = config.isDarkTheme ? config.darkTheme : config.lightTheme;
        
        // Set up text style
        context.font = 'Bold 96px Arial';
        context.textAlign = 'center';
        
        // Draw outline in opposite color with 60% opacity
        context.strokeStyle = config.isDarkTheme ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)';
        context.lineWidth = 12;
        context.strokeText(text, 1024, 512);
        
        // Draw main text
        context.fillStyle = theme.textColor;
        context.fillText(text, 1024, 512);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            depthTest: false
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(24, 12, 1);
        sprite.userData.text = text;
        return sprite;
    }

    updateTheme(sprite, text, config) {
        return this.createSprite(text, config); // Create a new sprite with updated theme
    }
}