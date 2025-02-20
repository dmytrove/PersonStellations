import { themeConfig } from './theme.js';
import { visualizationConfig } from './visualization.js';

// Create combined config with proper default values
export const config = {
    ...themeConfig,
    ...visualizationConfig,
    personVisibility: {},
    isDarkTheme: true,
    backgroundColor: themeConfig.darkTheme.backgroundColor,
    geodesicColor: themeConfig.darkTheme.geodesicColor
};

export { applyTheme } from './theme.js';
export { latLongToCartesian } from '../utils/coordinates.js';