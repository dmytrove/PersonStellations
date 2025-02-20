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

        this.geometryCache = new Map();
        this.materialCache = new Map();
        this.lastFrameTime = 0;
        this.TARGET_FRAME_RATE = 60;
        this.FRAME_BUDGET = 1000 / 60; // 16.67ms target frame time
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
            // Use a circle geometry for mobile (faces camera)
            geometry = new THREE.CircleGeometry(0.4, 16);
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
        
        // Create dome with optimized geometry for mobile
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

        // Batch creation for better performance
        const starBatch = new THREE.Group();
        const batchSize = 50;
        
        for (let i = 0; i < persons.length; i += batchSize) {
            const batch = persons.slice(i, i + batchSize);
            
            batch.forEach((person, index) => {
                const hue = ((i + index) / persons.length);
                const color = new THREE.Color().setHSL(hue, 1, 0.5);
                const glowColor = new THREE.Color().setHSL(hue, 1, 0.7);
                
                const materialKey = `${color.getHexString()}-${glowColor.getHexString()}`;
                let material = this.materialCache.get(materialKey);
                if (!material) {
                    material = this.isMobileDevice ? 
                        new THREE.MeshBasicMaterial({ 
                            color: color,
                            transparent: true,
                            opacity: 0.8,
                            side: THREE.DoubleSide 
                        }) :
                        this.starAnimator.createStarMaterial(color, glowColor);
                    this.materialCache.set(materialKey, material);
                }

                const personStars = this.createPersonStars(person, sphereGeometry, material, radius, config);
                starBatch.add(...personStars);
            });

            // Allow browser to process batch
            if (i + batchSize < persons.length) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        this.group.add(starBatch);

        // Reduce timeline opacity on mobile
        if (this.isMobileDevice) {
            this.timelineLines.children.forEach(line => {
                if (line.material) {
                    line.material.opacity = 0.15;
                }
            });
        }

        scene.add(this.group);
        scene.userData.camera = config.camera;
        
        if (!this.isMobileDevice) {
            this.starAnimator.setupLighting(scene);
        }
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
                // Only add pulse phase for desktop
                ...(this.isMobileDevice ? {} : { pulsePhase: Math.random() * Math.PI * 2 })
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

    // Add frame rate control
    updateAnimation(time) {
        if (this.isMobileDevice) {
            // No animation for mobile devices to improve performance
            return;
        }

        // Desktop animation
        const deltaTime = time - this.lastFrameTime;
        if (deltaTime < this.FRAME_BUDGET) {
            return; // Skip frame if we're running too fast
        }
        this.lastFrameTime = time;
        
        // Update animations with delta time
        this.starMeshes.forEach(mesh => {
            if (mesh.userData.pulsePhase !== undefined) {
                mesh.userData.pulsePhase += deltaTime * 0.001;
                const scale = 1 + Math.sin(mesh.userData.pulsePhase) * 0.1;
                mesh.scale.setScalar(scale * mesh.userData.originalScale);
            }
        });
    }

    dispose() {
        this.clearScene();
        this.geometryCache.clear();
        this.materialCache.clear();
    }
}