import * as THREE from 'three';
import { latLongToCartesian } from './utils/coordinates.js';
import { TooltipManager } from './ui/TooltipManager.js';
import { DomeVisualizer } from './visualization/DomeVisualizer.js';
import { StarAnimator } from './visualization/StarAnimator.js';
import { TextSprite } from './visualization/TextSprite.js';

export class StarVisualizer {
    constructor() {
        this.starMeshes = [];
        this.textSprites = [];
        this.group = new THREE.Group();
        this.timelineLines = new THREE.Group();
        
        this.tooltipManager = new TooltipManager();
        this.domeVisualizer = new DomeVisualizer();
        this.starAnimator = new StarAnimator();
        this.textSpriteManager = new TextSprite();
    }

    createSphereGeometry() {
        return new THREE.SphereGeometry(0.6, 32, 32);
    }

    createArcPoints(start, end, radius, segments = 50) {
        const points = [];
        // Use great circle interpolation to create arc points
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

    async createVisualization(persons, config, scene) {
        this.clearScene(scene);
        
        const radius = 50;
        
        // Create dome and geodesic lines
        const dome = this.domeVisualizer.createDome(radius);
        this.group.add(dome);
        
        const geodesicLines = this.domeVisualizer.createGeodesicLines(radius, config.geodesicCount, config.geodesicColor);
        this.group.add(geodesicLines);
        
        this.domeVisualizer.updateVisibility(config);

        const sphereGeometry = this.createSphereGeometry();
        this.group.add(this.timelineLines);

        // Create stars and timelines for each person
        persons.forEach((person, personIndex) => {
            const hue = personIndex / persons.length;
            const color = new THREE.Color().setHSL(hue, 1, 0.5);
            const glowColor = new THREE.Color().setHSL(hue, 1, 0.7);
            const material = this.starAnimator.createStarMaterial(color, glowColor);

            const personStars = this.createPersonStars(person, sphereGeometry, material, radius, config);
            this.createTimelineForPerson(personStars, color);
        });

        this.setupInteractions(scene, config);
        
        scene.add(this.group);
        scene.userData.camera = config.camera;
        
        this.starAnimator.setupLighting(scene);
        return this.group;
    }

    createPersonStars(person, geometry, material, radius, config) {
        const personStars = [];

        person.events.forEach(event => {
            const pos = latLongToCartesian(event.lat, event.lon, radius);
            const starMesh = new THREE.Mesh(geometry, material.clone());
            starMesh.position.set(pos.x, pos.y, pos.z);
            starMesh.userData = {
                person: person.name,
                nickname: person.nickname,
                year: event.year,
                info: event.info,
                shortCode: event.shortCode,
                originalScale: 1.0,
                pulsePhase: Math.random() * Math.PI * 2
            };

            const labelText = `${person.nickname} | ${event.shortCode} | ${event.year}`;
            const textSprite = this.textSpriteManager.createSprite(labelText, config);
            textSprite.position.set(pos.x * 1.3, pos.y * 1.3, pos.z * 1.3);
            textSprite.userData = { 
                associatedStar: starMesh,
                text: labelText
            };
            
            this.group.add(starMesh);
            this.group.add(textSprite);
            this.starMeshes.push(starMesh);
            this.textSprites.push(textSprite);
            personStars.push({ mesh: starMesh, event });
        });

        return personStars;
    }

    createTimelineForPerson(personStars, color) {
        personStars.sort((a, b) => a.event.year - b.event.year);

        const lineMaterial = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            depthWrite: false
        });

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
            this.timelineLines.add(line);
        }
    }

    setupInteractions(scene, config) {
        if (!scene.userData.animationAdded) {
            scene.userData.animationAdded = true;
            const animate = () => {
                requestAnimationFrame(animate);
                this.starAnimator.updateStarAnimations(this.starMeshes);
            };
            animate();
        }

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        window.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, scene.userData.camera);
            const intersects = raycaster.intersectObjects(this.starMeshes);

            if (intersects.length > 0) {
                const star = intersects[0].object;
                const tooltipContent = `${star.userData.person}<br>${star.userData.info}<br>Year: ${star.userData.year}`;
                this.tooltipManager.show(tooltipContent, event.clientX, event.clientY);
            } else {
                this.tooltipManager.hide();
            }
        });
    }

    clearScene(scene) {
        this.starMeshes.forEach(mesh => this.group.remove(mesh));
        this.textSprites.forEach(sprite => this.group.remove(sprite));
        if (this.group.parent) {
            scene.remove(this.group);
        }
        this.starMeshes = [];
        this.textSprites = [];
        this.group = new THREE.Group();
        if (this.timelineLines) {
            this.group.remove(this.timelineLines);
        }
    }

    updateTextColors(config) {
        this.textSprites.forEach((sprite, index) => {
            const newSprite = this.textSpriteManager.updateTheme(sprite, sprite.userData.text, config);
            newSprite.position.copy(sprite.position);
            this.group.remove(sprite);
            this.group.add(newSprite);
            this.textSprites[index] = newSprite;
        });
    }

    updateVisibility(startYear, endYear, personVisibility) {
        this.starMeshes.forEach((star, index) => {
            const starYear = star.userData.year;
            const isPersonVisible = personVisibility[star.userData.person];
            const isInTimeRange = starYear >= startYear && starYear <= endYear;
            let scale = 1.0;
            
            if (!isPersonVisible || !isInTimeRange) {
                scale = 0.0;
            }
            
            star.userData.originalScale = scale;
            star.visible = scale > 0;

            const textSprite = this.textSprites[index];
            if (textSprite) {
                textSprite.visible = scale > 0;
                textSprite.material.opacity = scale;
            }
        });

        this.timelineLines.children.forEach(line => {
            const isPersonVisible = personVisibility[line.userData.person];
            const startEventYear = line.userData.startYear;
            const endEventYear = line.userData.endYear;
            const isVisible = isPersonVisible && 
                            !(endEventYear < startYear || startEventYear > endYear); // Check if the line spans any part of the time range
            
            line.visible = isVisible;
            if (line.material) {
                line.material.opacity = isVisible ? 0.3 : 0;
            }
        });
    }
}