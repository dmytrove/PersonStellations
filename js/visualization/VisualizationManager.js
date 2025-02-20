import * as THREE from 'three';
import { StarMesh } from './StarMesh.js';
import { TextSprite } from './TextSprite.js';
import { Geodesic } from './Geodesic.js';
import { Timeline } from './Timeline.js';
import { config } from '../config/index.js';
import { latLongToCartesian } from '../utils/coordinates.js';
import { TooltipManager } from '../ui/TooltipManager.js';

export class VisualizationManager {
    constructor(group) {
        this.group = group;
        this.starMesh = new StarMesh();
        this.textSprite = new TextSprite();
        this.geodesic = new Geodesic();
        this.timeline = new Timeline();
        
        this.stars = [];
        this.labels = [];
        this.theme = config.isDarkTheme ? config.darkTheme : config.lightTheme;
        this.tooltipManager = new TooltipManager();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.setupTooltips();
    }

    async createVisualization(persons) {
        const radius = 50;
        
        // Add geodesic lines with explicit color
        const geodesicLines = this.geodesic.createLines(
            radius, 
            config.geodesicCount, 
            this.theme.geodesicColor || config.darkTheme.geodesicColor
        );
        this.group.add(geodesicLines);

        // Create stars and labels for each person
        persons.forEach((person, index) => {
            const hue = index / persons.length;
            const color = new THREE.Color().setHSL(hue, 1, 0.5);
            const glowColor = new THREE.Color().setHSL(hue, 1, 0.7);
            
            const personStars = [];
            
            person.events.forEach(event => {
                const pos = latLongToCartesian(event.lat, event.lon, radius);
                const star = this.starMesh.create(pos, color, glowColor, {
                    person: person.name,
                    year: event.year,
                    info: event.info
                });
                
                const labelText = `${person.name} | ${event.year}`;
                const label = this.textSprite.createSprite(labelText, config);
                label.position.copy(pos).multiplyScalar(1.1);
                
                this.stars.push(star);
                this.labels.push(label);
                this.group.add(star);
                this.group.add(label);
                
                personStars.push({ mesh: star, event: {...event, person: person.name} });
            });
            
            this.timeline.createTimelineForPerson(personStars, color);
        });
        
        this.group.add(this.timeline.group);
    }

    setupTooltips() {
        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            if (this.raycaster.camera) {
                this.raycaster.setFromCamera(this.mouse, this.raycaster.camera);
                const intersects = this.raycaster.intersectObjects(this.stars);

                if (intersects.length > 0) {
                    const star = intersects[0].object;
                    const tooltipContent = `${star.userData.person}<br>${star.userData.info}<br>Year: ${star.userData.year}`;
                    this.tooltipManager.show(tooltipContent, event.clientX, event.clientY);
                } else {
                    this.tooltipManager.hide();
                }
            }
        });
    }

    setCamera(camera) {
        this.raycaster.camera = camera;
    }

    updateLabels() {
        this.labels.forEach((label, index) => {
            const star = this.stars[index];
            if (star && label) {
                const newLabel = this.textSprite.updateTheme(label, label.userData.text, config);
                this.group.remove(label);
                this.group.add(newLabel);
                this.labels[index] = newLabel;
            }
        });
    }

    updateVisibility() {
        this.stars.forEach((star, index) => {
            const isVisible = config.personVisibility[star.userData.person] &&
                            star.userData.year >= config.startYear &&
                            star.userData.year <= config.endYear;
            
            star.visible = isVisible;
            if (this.labels[index]) {
                this.labels[index].visible = isVisible;
            }
        });
        
        this.timeline.updateVisibility(config.startYear, config.endYear, config.personVisibility);
    }

    updateAnimation(time) {
        this.stars.forEach(star => {
            this.starMesh.updateAnimation(star, time);
        });
    }

    updateGeodesicColor(color) {
        this.geodesic.updateColor(color);
    }
}