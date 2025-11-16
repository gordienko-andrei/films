import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

// Создаем кастомный пресет на основе Aura
export const CustomAuraPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{blue.50}',
            100: '{blue.100}',
            200: '{blue.200}',
            300: '{blue.300}',
            400: '{blue.400}',
            500: '{blue.500}',
            600: '{blue.600}',
            700: '{blue.700}',
            800: '{blue.800}',
            900: '{blue.900}',
            950: '{blue.950}'
        },
        colorScheme: {
            light: {
                surface: {
                    0: '#ffffff',
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617'
                }
            },
            dark: {
                surface: {
                    0: '#ffffff',
                    50: '#fafafa',
                    100: '#f4f4f5',
                    200: '#e4e4e7',
                    300: '#d4d4d8',
                    400: '#a1a1aa',
                    500: '#71717a',
                    600: '#52525b',
                    700: '#3f3f46',
                    800: '#27272a',
                    900: '#18181b',
                    950: '#09090b'
                }
            }
        }
    },
    components: {
        button: {
            colorScheme: {
                light: {
                    root: {
                        primary: {
                            background: '{primary.500}',
                            hoverBackground: '{primary.600}',
                            activeBackground: '{primary.700}',
                            borderColor: '{primary.500}',
                            hoverBorderColor: '{primary.600}',
                            activeBorderColor: '{primary.700}',
                            color: '#ffffff',
                            hoverColor: '#ffffff',
                            activeColor: '#ffffff'
                        },
                        success: {
                            background: '#22c55e',
                            hoverBackground: '#16a34a',
                            activeBackground: '#15803d',
                            borderColor: '#22c55e',
                            hoverBorderColor: '#16a34a',
                            activeBorderColor: '#15803d',
                            color: '#ffffff',
                            hoverColor: '#ffffff',
                            activeColor: '#ffffff'
                        },
                        danger: {
                            background: '#ef4444',
                            hoverBackground: '#dc2626',
                            activeBackground: '#b91c1c',
                            borderColor: '#ef4444',
                            hoverBorderColor: '#dc2626',
                            activeBorderColor: '#b91c1c',
                            color: '#ffffff',
                            hoverColor: '#ffffff',
                            activeColor: '#ffffff'
                        }
                    }
                },
                dark: {
                    root: {
                        primary: {
                            background: '{primary.400}',
                            hoverBackground: '{primary.300}',
                            activeBackground: '{primary.200}',
                            borderColor: '{primary.400}',
                            hoverBorderColor: '{primary.300}',
                            activeBorderColor: '{primary.200}',
                            color: '{surface.900}',
                            hoverColor: '{surface.900}',
                            activeColor: '{surface.900}'
                        },
                        success: {
                            background: '#22c55e',
                            hoverBackground: '#4ade80',
                            activeBackground: '#86efac',
                            borderColor: '#22c55e',
                            hoverBorderColor: '#4ade80',
                            activeBorderColor: '#86efac',
                            color: '{surface.900}',
                            hoverColor: '{surface.900}',
                            activeColor: '{surface.900}'
                        },
                        danger: {
                            background: '#ef4444',
                            hoverBackground: '#f87171',
                            activeBackground: '#fca5a5',
                            borderColor: '#ef4444',
                            hoverBorderColor: '#f87171',
                            activeBorderColor: '#fca5a5',
                            color: '#ffffff',
                            hoverColor: '#ffffff',
                            activeColor: '#ffffff'
                        }
                    }
                }
            }
        },
        rating: {
            colorScheme: {
                light: {
                    root: {
                        onColor: '#facc15',
                        offColor: '#cbd5e1'
                    }
                },
                dark: {
                    root: {
                        onColor: '#fbbf24',
                        offColor: '#475569'
                    }
                }
            }
        }
    }
});