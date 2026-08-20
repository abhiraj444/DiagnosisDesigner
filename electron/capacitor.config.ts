import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.medigen.app',
    appName: 'MediGen',
    webDir: 'app', // In electron, it's usually 'app' because Capacitor copies 'out' to 'electron/app'
    server: {
        androidScheme: 'https'
    }
};

export default config;
