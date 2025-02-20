import * as THREE from 'three';

export class StarMesh {
    constructor() {
        this.geometry = this.createGeometry();
    }

    createGeometry() {
        return new THREE.SphereGeometry(0.6, 16, 16);
    }

    createMaterial(color) {
        return new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
    }

    create(position, color, _, userData) {
        const material = this.createMaterial(color);
        const mesh = new THREE.Mesh(this.geometry, material);
        mesh.position.copy(position);
        mesh.userData = userData;
        return mesh;
    }
}