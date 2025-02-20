import { latLongToCartesian } from './config.js';

export class StarVisualizer {
    constructor() {
        this.starMeshes = [];
        this.textSprites = [];
        this.group = new THREE.Group();
        this.tooltip = this.createTooltip();
        this.dome = null;
        this.geodesicLines = new THREE.Group();
        this.timelineLines = new THREE.Group();
        this.clock = new THREE.Clock();
    }

    createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.style.display = 'none';
        tooltip.style.position = 'absolute';
        tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '10px';
        tooltip.style.borderRadius = '5px';
        tooltip.style.pointerEvents = 'none';
        document.body.appendChild(tooltip);
        return tooltip;
    }

    createTextSprite(text, config) {
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
        return sprite;
    }

    updateTextColors(config) {
        this.textSprites.forEach(sprite => {
            const labelText = sprite.userData.text;
            const newSprite = this.createTextSprite(labelText, config);
            newSprite.position.copy(sprite.position);
            newSprite.userData = {...sprite.userData};
            this.group.remove(sprite);
            this.group.add(newSprite);
            const index = this.textSprites.indexOf(sprite);
            if (index !== -1) {
                this.textSprites[index] = newSprite;
            }
        });
    }

    createSphereGeometry() {
        // Increased size and detail for stars
        return new THREE.SphereGeometry(0.6, 32, 32);
    }

    createDome(radius) {
        // Make dome slightly larger to avoid z-fighting with stars
        const domeRadius = radius * 1.001;
        const geometry = new THREE.SphereGeometry(domeRadius, 32, 32);
        const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide,
            depthWrite: false,
            depthTest: false // Disable depth testing
        }));
        mesh.renderOrder = -1; // Set renderOrder on the mesh instead of material
        return mesh;
    }

    createGeodesicLines(radius, count, color) {
        const lineRadius = radius * 1.001;
        const group = new THREE.Group();
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.3,
            depthWrite: false,
            depthTest: false
        });
        
        // Create meridian lines (longitude) - full circles
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI;
            const points = [];
            // Create full circle for meridians
            for (let j = 0; j <= 50; j++) {
                const phi = (j / 50) * 2 * Math.PI; // Full circle
                const x = lineRadius * Math.sin(phi) * Math.cos(angle);
                const y = lineRadius * Math.cos(phi);
                const z = lineRadius * Math.sin(phi) * Math.sin(angle);
                points.push(new THREE.Vector3(x, y, z));
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            group.add(line);
        }

        // Create parallel lines (latitude) including equator
        const latitudeSteps = Math.floor(count/2);
        for (let i = 0; i <= latitudeSteps; i++) { // Changed to include 0 (equator)
            const phi = (i / latitudeSteps) * Math.PI/2;
            const points = [];
            
            for (let j = 0; j <= 50; j++) {
                const theta = (j / 50) * 2 * Math.PI;
                const radius2 = lineRadius * Math.sin(phi);
                const y = lineRadius * Math.cos(phi);
                const x = radius2 * Math.cos(theta);
                const z = radius2 * Math.sin(theta);
                points.push(new THREE.Vector3(x, y, z));
            }
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            
            if (i === 0) { // Equator
                const equator = new THREE.Line(geometry, new THREE.LineBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.5, // Make equator more visible
                    depthWrite: false,
                    depthTest: false
                }));
                equator.renderOrder = -1; // Set renderOrder on the line instead of material
                group.add(equator);
            } else {
                // Regular latitude lines
                const upperLine = new THREE.Line(geometry, lineMaterial);
                upperLine.renderOrder = -1;
                group.add(upperLine);
                
                const lowerLine = new THREE.Line(geometry, lineMaterial);
                lowerLine.position.y = -upperLine.position.y;
                lowerLine.scale.y = -1;
                lowerLine.renderOrder = -1;
                group.add(lowerLine);
            }
        }

        return group;
    }

    updateDomeVisibility(config) {
        if (this.dome) {
            this.dome.visible = config.domeVisible;
            this.dome.material.opacity = config.domeOpacity;
        }
        this.geodesicLines.visible = config.geodesicLines;
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

        // Create dome if it doesn't exist
        if (!this.dome) {
            this.dome = this.createDome(radius);
            this.group.add(this.dome);
            
            this.geodesicLines = this.createGeodesicLines(radius, config.geodesicCount, config.geodesicColor);
            this.group.add(this.geodesicLines);
        }

        this.updateDomeVisibility(config);

        const sphereGeometry = this.createSphereGeometry();

        this.timelineLines = new THREE.Group();
        this.group.add(this.timelineLines);

        persons.forEach((person, personIndex) => {
            const hue = personIndex / persons.length;
            const color = new THREE.Color().setHSL(hue, 1, 0.5);
            
            // Create glowing material for stars
            const glowColor = new THREE.Color().setHSL(hue, 1, 0.7);
            const material = new THREE.ShaderMaterial({
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

            const personStars = [];

            // Create stars for this person
            person.events.forEach(event => {
                const pos = latLongToCartesian(event.lat, event.lon, radius);
                const starMesh = new THREE.Mesh(sphereGeometry, material.clone());
                starMesh.position.set(pos.x, pos.y, pos.z);
                starMesh.userData = {
                    person: person.name,
                    nickname: person.nickname,
                    year: event.year,
                    info: event.info,
                    shortCode: event.shortCode,
                    originalScale: 1.0,
                    pulsePhase: Math.random() * Math.PI * 2 // Random starting phase for animation
                };

                // Rest of the existing star creation code...
                const labelText = `${person.nickname} | ${event.shortCode} | ${event.year}`;
                const textSprite = this.createTextSprite(labelText, config);
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

            // Sort person's events chronologically
            personStars.sort((a, b) => a.event.year - b.event.year);

            // Create lines between consecutive events for this person
            const lineMaterial = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.3,
                depthWrite: false
            });

            // Connect consecutive events with lines
            for (let i = 0; i < personStars.length - 1; i++) {
                const star1 = personStars[i].mesh;
                const star2 = personStars[i + 1].mesh;
                
                const arcPoints = this.createArcPoints(
                    star1.position,
                    star2.position,
                    radius * 1.001
                );
                
                const geometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
                const line = new THREE.Line(geometry, lineMaterial);
                line.userData = {
                    person: person.name,
                    startYear: personStars[i].event.year,
                    endYear: personStars[i + 1].event.year
                };
                this.timelineLines.add(line);
            }
        });

        // Add animation update to the scene's animation loop
        if (!scene.userData.animationAdded) {
            scene.userData.animationAdded = true;
            const animate = () => {
                requestAnimationFrame(animate);
                const time = this.clock.getElapsedTime();
                
                this.starMeshes.forEach(star => {
                    if (star.visible) {
                        const material = star.material;
                        material.uniforms.time.value = time;
                        
                        // Pulse animation
                        const pulseSpeed = 1.5;
                        const pulseAmount = 0.15;
                        const scale = 1.0 + Math.sin(time * pulseSpeed + star.userData.pulsePhase) * pulseAmount;
                        star.scale.setScalar(scale * star.userData.originalScale);
                    }
                });
            };
            animate();
        }

        // Setup tooltip event listeners
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
                this.tooltip.innerHTML = tooltipContent;
                this.tooltip.style.display = 'block';
                this.tooltip.style.left = event.clientX + 10 + 'px';
                this.tooltip.style.top = event.clientY + 10 + 'px';
            } else {
                this.tooltip.style.display = 'none';
            }
        });

        scene.add(this.group);
        scene.userData.camera = config.camera;

        this.setupLighting(scene);
        return this.group;
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