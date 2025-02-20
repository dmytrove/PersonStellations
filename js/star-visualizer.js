import * as THREE from 'three';
import { latLongToCartesian } from './utils/coordinates.js';
import { TooltipManager } from './ui/TooltipManager.js';
import { DomeVisualizer } from './visualization/DomeVisualizer.js';
import { TextSprite } from './visualization/TextSprite.js';

export class StarVisualizer {
    constructor() {
        this.starMeshes = [];
        this.textSprites = [];
        this.group = new THREE.Group();
        this.timelineLines = new THREE.Group();
        
        this.tooltipManager = new TooltipManager();
        this.domeVisualizer = new DomeVisualizer();
        this.textSpriteManager = new TextSprite();

        this.geometryCache = new Map();
        this.materialCache = new Map();
        this.isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        this.circleGeometry = null;
    }

    createSphereGeometry() {
        const cacheKey = this.isMobileDevice ? 'circle' : 'sphere';
        if (this.geometryCache.has(cacheKey)) {
            return this.geometryCache.get(cacheKey);
        }

        let geometry;
        if (this.isMobileDevice) {
            // Use a larger circle geometry for mobile (faces camera)
            geometry = new THREE.CircleGeometry(0.8, 16);
        } else {
            // Use sphere for desktop
            geometry = new THREE.SphereGeometry(0.6, 16, 16);
        }
        
        this.geometryCache.set(cacheKey, geometry);
        return geometry;
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
        const showGrid = !this.isMobileDevice && config.showGrid !== false;
        
        if (showGrid) {
            const dome = this.domeVisualizer.createDome(radius, this.isMobileDevice);
            this.group.add(dome);
            
            const gridCount = this.isMobileDevice ? Math.floor(config.geodesicCount / 3) : config.geodesicCount;
            const geodesicLines = this.domeVisualizer.createGeodesicLines(radius, gridCount, config.geodesicColor);
            this.group.add(geodesicLines);
            this.domeVisualizer.updateVisibility(config);
        }

        const sphereGeometry = this.createSphereGeometry();
        this.group.add(this.timelineLines);

        const starBatch = new THREE.Group();
        const batchSize = 50;
        
        for (let i = 0; i < persons.length; i += batchSize) {
            const batch = persons.slice(i, i + batchSize);
            
            batch.forEach((person, index) => {
                const hue = ((i + index) / persons.length);
                const color = new THREE.Color().setHSL(hue, 1, 0.5);
                
                const materialKey = color.getHexString();
                let material = this.materialCache.get(materialKey);
                if (!material) {
                    material = new THREE.MeshBasicMaterial({ 
                        color: color,
                        transparent: true,
                        opacity: 0.8,
                        side: THREE.DoubleSide 
                    });
                    this.materialCache.set(materialKey, material);
                }

                const personStars = this.createPersonStars(person, sphereGeometry, material, radius, config);
                starBatch.add(...personStars);
            });

            if (i + batchSize < persons.length) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        this.group.add(starBatch);

        if (this.isMobileDevice) {
            this.timelineLines.children.forEach(line => {
                if (line.material) {
                    line.material.opacity = 0.15;
                }
            });
        }

        scene.add(this.group);
        scene.userData.camera = config.camera;
        return this.group;
    }

    createPersonStars(person, geometry, material, radius, config) {
        const personStars = [];

        person.events.forEach(event => {
            // Use pre-computed cartesian coordinates if available, otherwise compute them
            const pos = event.cartesian || latLongToCartesian(event.lat, event.lon, radius);
            const starMesh = new THREE.Mesh(geometry, material.clone());
            starMesh.position.set(pos.x, pos.y, pos.z);
            starMesh.userData = {
                person: person.name,
                nickname: person.nickname,
                year: event.year,
                info: event.info,
                shortCode: event.shortCode
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
        // Dispose of geometries and materials
        this.group.traverse(object => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });

        this.starMeshes.length = 0;
        this.textSprites.length = 0;
        this.group.clear();
        this.timelineLines.clear();
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
            const isVisible = isPersonVisible && isInTimeRange;
            
            star.visible = isVisible;

            const textSprite = this.textSprites[index];
            if (textSprite) {
                textSprite.visible = isVisible;
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

    dispose() {
        this.clearScene();
        this.geometryCache.clear();
        this.materialCache.clear();
    }
}