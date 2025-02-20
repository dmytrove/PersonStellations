import * as THREE from 'three';

export class DomeVisualizer {
    constructor() {
        this.dome = null;
        this.geodesicLines = new THREE.Group();
    }

    createDome(radius) {
        const domeRadius = radius * 1.001;
        const geometry = new THREE.SphereGeometry(domeRadius, 32, 32);
        const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide,
            depthWrite: false,
            depthTest: false
        }));
        mesh.renderOrder = -1;
        this.dome = mesh;
        return mesh;
    }

    createGeodesicLines(radius, count, color) {
        const lineRadius = radius * 1.001;
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.3,
            depthWrite: false,
            depthTest: false
        });
        
        this.createMeridianLines(lineRadius, count, lineMaterial);
        this.createParallelLines(lineRadius, count, lineMaterial, color);
        
        return this.geodesicLines;
    }

    createMeridianLines(radius, count, material) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI;
            const points = [];
            for (let j = 0; j <= 50; j++) {
                const phi = (j / 50) * 2 * Math.PI;
                const x = radius * Math.sin(phi) * Math.cos(angle);
                const y = radius * Math.cos(phi);
                const z = radius * Math.sin(phi) * Math.sin(angle);
                points.push(new THREE.Vector3(x, y, z));
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, material);
            this.geodesicLines.add(line);
        }
    }

    createParallelLines(radius, count, material, color) {
        const latitudeSteps = Math.floor(count/2);
        for (let i = 0; i <= latitudeSteps; i++) {
            const phi = (i / latitudeSteps) * Math.PI/2;
            const points = [];
            
            for (let j = 0; j <= 50; j++) {
                const theta = (j / 50) * 2 * Math.PI;
                const radius2 = radius * Math.sin(phi);
                const y = radius * Math.cos(phi);
                const x = radius2 * Math.cos(theta);
                const z = radius2 * Math.sin(theta);
                points.push(new THREE.Vector3(x, y, z));
            }
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            
            if (i === 0) {
                const equatorMaterial = new THREE.LineBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.5,
                    depthWrite: false,
                    depthTest: false
                });
                const equator = new THREE.Line(geometry, equatorMaterial);
                equator.renderOrder = -1;
                this.geodesicLines.add(equator);
            } else {
                const upperLine = new THREE.Line(geometry, material);
                upperLine.renderOrder = -1;
                this.geodesicLines.add(upperLine);
                
                const lowerLine = new THREE.Line(geometry, material);
                lowerLine.position.y = -upperLine.position.y;
                lowerLine.scale.y = -1;
                lowerLine.renderOrder = -1;
                this.geodesicLines.add(lowerLine);
            }
        }
    }

    updateVisibility(config) {
        if (this.dome) {
            this.dome.visible = config.domeVisible;
            this.dome.material.opacity = config.domeOpacity;
        }
        this.geodesicLines.visible = config.geodesicLines;
    }
}