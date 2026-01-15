import browser from '@/scripts/browser';
import appSettings from '@/scripts/settings/appSettings';

export {};

console.log('[NativeBridge] NativeInterface attached:', typeof window.NativeInterface);

const features = [];
const plugins = [];

const BrowserName = {
    tizen: 'Samsung Smart TV',
    web0s: 'LG Smart TV',
    titanos: 'Titan OS',
    operaTv: 'Opera TV',
    xboxOne: 'Xbox One',
    ps4: 'Sony PS4',
    chrome: 'Chrome',
    edgeChromium: 'Edge Chromium',
    edge: 'Edge',
    firefox: 'Firefox',
    opera: 'Opera',
    safari: 'Safari'
}

let deviceId
let deviceName
let appName
let appVersion

function generateDeviceId() {
    const keys = [];

    keys.push(navigator.userAgent);
    keys.push(new Date().getTime());
    if (window.btoa) {
        return btoa(keys.join('|')).replaceAll('=', '1');
    }

    return new Date().getTime();
}

function getDeviceId() {
    if (!deviceId) {
        const key = '_deviceId2';

        deviceId = appSettings.get(key);

        if (!deviceId) {
            deviceId = generateDeviceId();
            appSettings.set(key, deviceId);
        }
    }

    return deviceId;
}

function getDeviceName() {
    if (deviceName) {
        return deviceName;
    }

    deviceName = 'Web Browser'; // Default device name

    for (const key in BrowserName) {
        if (browser[key]) {
            deviceName = BrowserName[key];
            break;
        }
    }

    if (browser.ipad) {
        deviceName += ' iPad';
    } else if (browser.iphone) {
        deviceName += ' iPhone';
    } else if (browser.android) {
        deviceName += ' Android';
    }
    return deviceName;
}

function getBrowserDeviceInfo() {
    return {
        deviceId: getDeviceId(),
        deviceName: getDeviceName(),
        appName: "Phim Ne",
        appVersion: "10.11.5"
    };
}

window.NativeShell = {};

window.NativeShell.AppHost = {
    init() {
        try {
            // Native environment
            if (window.NativeInterface && typeof window.NativeInterface.getDeviceInformation === "function" ) {
                const result = JSON.parse(window.NativeInterface.getDeviceInformation());
                deviceId = result.deviceId;
                deviceName = result.deviceName;
                appName = result.appName;
                appVersion = result.appVersion;
            } else {
                // Browser environment
                const info = getBrowserDeviceInfo();
                deviceId = info.deviceId;
                deviceName = info.deviceName;
                appName = info.appName;
                appVersion = info.appVersion;
            }

            return Promise.resolve({
                deviceId,
                deviceName,
                appName,
                appVersion,
            });
        } catch (e) {
            return Promise.reject(e);
        }
    },
    deviceName() {
        return deviceName;
    },
    deviceId() {
        return deviceId;
    },
    appName() {
        return appName;
    },
    appVersion() {
        return appVersion;
    },
};
