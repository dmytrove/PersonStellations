export class TooltipManager {
    constructor() {
        this.tooltip = this.createTooltip();
        this.visible = false;
        this.currentX = 0;
        this.currentY = 0;
        this.currentContent = '';
    }

    createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.style.display = 'none';
        tooltip.style.position = 'absolute';
        tooltip.style.padding = '10px';
        tooltip.style.borderRadius = '5px';
        tooltip.style.pointerEvents = 'none';
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
        this.tooltip.style.left = x + 10 + 'px';
        this.tooltip.style.top = y + 10 + 'px';
        this.updateTheme(document.body.classList.contains('theme-dark'));
    }

    hide() {
        this.visible = false;
        this.tooltip.style.display = 'none';
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