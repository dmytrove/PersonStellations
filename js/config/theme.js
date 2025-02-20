export const themeConfig = {
    isDarkTheme: true,
    darkTheme: {
        backgroundColor: '#000000',
        textColor: '#ffffff',
        geodesicColor: '#ff0000',
        guiTheme: 'dark',
        lineColor: '#ff0000',
        equatorColor: '#ff3333'
    },
    lightTheme: {
        backgroundColor: '#ffffff',
        textColor: '#000000',
        geodesicColor: '#0000ff',
        guiTheme: 'light',
        lineColor: '#0000ff',
        equatorColor: '#3333ff'
    }
};

export function applyTheme(isDark) {
    return isDark ? themeConfig.darkTheme : themeConfig.lightTheme;
}