import * as THREE from 'three';

export class Timeline {
    constructor() {
        this.group = new THREE.Group();
    }

    createArcPoints(start, end, radius, segments = 50) {
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            
            // Convert positions to spherical coordinates
            const startSpherical = new THREE.Vector3(start.x, start.y, start.z).normalize();
            const endSpherical = new THREE.Vector3(end.x, end.y, end.z).normalize();
            
            // Spherical interpolation (SLERP)
            const dot = startSpherical.dot(endSpherical);
            const theta = Math.acos(Math.min(Math.max(dot, -1), 1));
            
            if (Math.abs(theta) < 0.000001) {
                points.push(start.clone());
                continue;
            }
            
            // Create interpolated point
            const point = new THREE.Vector3()
                .addScaledVector(startSpherical, Math.sin((1 - t) * theta) / Math.sin(theta))
                .addScaledVector(endSpherical, Math.sin(t * theta) / Math.sin(theta))
                .multiplyScalar(radius);
                
            points.push(point);
        }
        return points;
    }

    createTimelineForPerson(personStars, color) {
        const lineMaterial = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            depthWrite: false
        });

        // Sort events chronologically
        personStars.sort((a, b) => a.event.year - b.event.year);

        // Connect consecutive events with arcs
        for (let i = 0; i < personStars.length - 1; i++) {
            const star1 = personStars[i].mesh;
            const star2 = personStars[i + 1].mesh;
            
            const arcPoints = this.createArcPoints(
                star1.position,
                star2.position,
                star1.position.length() * 1.001
            );
            
            const geometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
            const line = new THREE.Line(geometry, lineMaterial);
            line.userData = {
                person: personStars[i].event.person,
                startYear: personStars[i].event.year,
                endYear: personStars[i + 1].event.year
            };
            this.group.add(line);
        }
    }

    updateVisibility(startYear, endYear, personVisibility) {
        this.group.children.forEach(line => {
            const isPersonVisible = personVisibility[line.userData.person];
            const startEventYear = line.userData.startYear;
            const endEventYear = line.userData.endYear;
            const isVisible = isPersonVisible && 
                            !(endEventYear < startYear || startEventYear > endYear);
            
            line.visible = isVisible;
            if (line.material) {
                line.material.opacity = isVisible ? 0.3 : 0;
            }
        });
    }

    clear() {
        while(this.group.children.length > 0) {
            const line = this.group.children[0];
            line.geometry.dispose();
            line.material.dispose();
            this.group.remove(line);
        }
    }
}