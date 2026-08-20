import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.medigen.app',
    appName: 'MediGen',
    webDir: 'out',
    server: {
        androidScheme: 'https'
    }
};

export default config;
