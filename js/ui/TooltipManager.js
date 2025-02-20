export class TooltipManager {
    constructor() {
        this.tooltip = this.createTooltip();
        this.visible = false;
        this.currentX = 0;
        this.currentY = 0;
        this.currentContent = '';
        this.isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.style.display = 'none';
        tooltip.style.position = 'absolute';
        tooltip.style.padding = '12px';
        tooltip.style.borderRadius = '8px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.maxWidth = '280px';
        tooltip.style.fontSize = this.isMobileDevice ? '16px' : '14px';
        tooltip.style.lineHeight = '1.4';
        tooltip.style.zIndex = '1000';
        tooltip.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
        tooltip.style.transition = 'opacity 0.2s ease-in-out';
        tooltip.style.opacity = '0';
        document.body.appendChild(tooltip);
        return tooltip;
    }

    show(content, x, y) {
        this.currentX = x;
        this.currentY = y;
        this.currentContent = content;
        this.visible = true;
        this.tooltip.innerHTML = content;
        this.tooltip.style.display = 'block';

        // Ensure tooltip stays within viewport bounds
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Calculate position, accounting for mobile positioning above finger
        let left = x + 10;
        let top = y + (this.isMobileDevice ? -tooltipRect.height - 20 : 10);

        // Adjust if tooltip would go outside viewport
        if (left + tooltipRect.width > viewportWidth) {
            left = viewportWidth - tooltipRect.width - 10;
        }
        if (top < 10) {
            top = 10;
        }
        if (top + tooltipRect.height > viewportHeight) {
            top = viewportHeight - tooltipRect.height - 10;
        }

        this.tooltip.style.left = left + 'px';
        this.tooltip.style.top = top + 'px';
        this.updateTheme(document.body.classList.contains('theme-dark'));
        
        // Fade in animation
        requestAnimationFrame(() => {
            this.tooltip.style.opacity = '1';
        });
    }

    hide() {
        this.visible = false;
        this.tooltip.style.opacity = '0';
        // Remove from DOM after fade out
        setTimeout(() => {
            if (!this.visible) {
                this.tooltip.style.display = 'none';
            }
        }, 200);
    }

    updateTheme(isDark) {
        if (this.tooltip) {
            this.tooltip.style.backgroundColor = isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
            this.tooltip.style.color = isDark ? '#ffffff' : '#000000';
            this.tooltip.style.border = isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.2)';
            
            if (this.visible) {
                this.tooltip.style.display = 'block';
                this.tooltip.innerHTML = this.currentContent;
                this.tooltip.style.left = this.currentX + 10 + 'px';
                this.tooltip.style.top = this.currentY + 10 + 'px';
            }
        }
    }
}