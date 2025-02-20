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
        this.isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.setupTooltips();
    }

    async createVisualization(persons) {
        const radius = 50;
        
        const geodesicLines = this.geodesic.createLines(
            radius, 
            config.geodesicCount, 
            this.theme.geodesicColor || config.darkTheme.geodesicColor
        );
        this.group.add(geodesicLines);

        persons.forEach((person, index) => {
            const hue = index / persons.length;
            const color = new THREE.Color().setHSL(hue, 1, 0.5);
            
            const personStars = [];
            
            person.events.forEach(event => {
                const pos = latLongToCartesian(event.lat, event.lon, radius);
                const star = this.starMesh.create(pos, color, null, {
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
        const handlePointerEvent = (event) => {
            const clientX = event.touches ? event.touches[0].clientX : event.clientX;
            const clientY = event.touches ? event.touches[0].clientY : event.clientY;
            
            this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;

            if (this.raycaster.camera) {
                this.raycaster.setFromCamera(this.mouse, this.raycaster.camera);
                const intersects = this.raycaster.intersectObjects(this.stars);

                if (intersects.length > 0) {
                    const star = intersects[0].object;
                    const tooltipContent = `${star.userData.person}<br>${star.userData.info}<br>Year: ${star.userData.year}`;
                    // Position tooltip above the touch point on mobile
                    const yOffset = this.isMobileDevice ? -100 : 10;
                    this.tooltipManager.show(tooltipContent, clientX, clientY + yOffset);
                } else if (!this.isMobileDevice) {
                    // Only hide tooltip on mousemove when not on mobile
                    this.tooltipManager.hide();
                }
            }
        };

        if (this.isMobileDevice) {
            // Mobile touch events
            window.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handlePointerEvent(e);
            }, { passive: false });
            
            window.addEventListener('touchmove', (e) => {
                e.preventDefault(); // Prevent scrolling while touching stars
            }, { passive: false });
        } else {
            // Desktop mouse events
            window.addEventListener('mousemove', handlePointerEvent);
        }
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

    updateGeodesicColor(color) {
        this.geodesic.updateColor(color);
    }
}