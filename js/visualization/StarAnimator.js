import * as THREE from 'three';

export class StarAnimator {
    constructor() {
        this.clock = new THREE.Clock();
    }

    createStarMaterial(color, glowColor) {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color: { value: color },
                glowColor: { value: glowColor }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform vec3 glowColor;
                uniform float time;
                varying vec3 vNormal;
                varying vec3 vPosition;
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    float glow = 0.5 + 0.5 * sin(time * 2.0);
                    vec3 finalColor = mix(color, glowColor, intensity * glow);
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            transparent: true
        });
    }

    updateStarAnimations(stars) {
        const time = this.clock.getElapsedTime();
        
        stars.forEach(star => {
            if (star.visible) {
                const material = star.material;
                material.uniforms.time.value = time;
                
                // Store original position if not already stored
                if (!star.userData.originalPosition) {
                    star.userData.originalPosition = star.position.clone();
                }
                
                // Pulse animation (only affects scale, not position)
                const pulseSpeed = 1.5;
                const pulseAmount = 0.15;
                const scale = 1.0 + Math.sin(time * pulseSpeed + star.userData.pulsePhase) * pulseAmount;
                star.scale.setScalar(scale * star.userData.originalScale);
                
                // Ensure position stays at original coordinates
                if (star.userData.originalPosition) {
                    star.position.copy(star.userData.originalPosition);
                }
            }
        });
    }

    setupLighting(scene) {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const pointLight = new THREE.PointLight(0xffffff, 2);
        pointLight.position.set(10, 10, 10);
        scene.add(pointLight);

        const pointLight2 = new THREE.PointLight(0xffffff, 1);
        pointLight2.position.set(-10, -10, -10);
        scene.add(pointLight2);
    }
}