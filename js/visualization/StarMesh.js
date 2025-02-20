import * as THREE from 'three';

export class StarMesh {
    constructor() {
        this.geometry = this.createGeometry();
    }

    createGeometry() {
        return new THREE.SphereGeometry(0.6, 32, 32);
    }

    createMaterial(color, glowColor) {
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

    create(position, color, glowColor, userData) {
        const material = this.createMaterial(color, glowColor);
        const mesh = new THREE.Mesh(this.geometry, material);
        mesh.position.copy(position);
        mesh.userData = {
            ...userData,
            originalScale: 1.0,
            pulsePhase: Math.random() * Math.PI * 2
        };
        return mesh;
    }

    updateAnimation(star, time) {
        if (star.visible) {
            const material = star.material;
            material.uniforms.time.value = time;
            
            // Pulse animation
            const pulseSpeed = 1.5;
            const pulseAmount = 0.15;
            const scale = 1.0 + Math.sin(time * pulseSpeed + star.userData.pulsePhase) * pulseAmount;
            star.scale.setScalar(scale * star.userData.originalScale);
        }
    }
}