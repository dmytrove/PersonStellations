export const themeConfig = {
    isDarkTheme: true,
    darkTheme: {
        backgroundColor: '#000000',
        textColor: '#ffffff',
        geodesicColor: '#1a1a1a',
        guiTheme: 'dark',
        lineColor: '#1a1a1a',
        equatorColor: '#2a2a2a'
    },
    lightTheme: {
        backgroundColor: '#ffffff',
        textColor: '#000000',
        geodesicColor: '#e6e6e6',
        guiTheme: 'light',
        lineColor: '#e6e6e6',
        equatorColor: '#d6d6d6'
    }
};

export function applyTheme(isDark) {
    return isDark ? themeConfig.darkTheme : themeConfig.lightTheme;
}