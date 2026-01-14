export {};

console.log('[NativeBridge] NativeInterface attached:', typeof window.NativeInterface);

const features = [
    "filedownload",
    "displaylanguage",
    "subtitleappearancesettings",
    "subtitleburnsettings",
    "exit",
    "htmlaudioautoplay",
    "htmlvideoautoplay",
    "externallinks",
    "clientsettings",
    "multiserver",
    "physicalvolumecontrol",
    "remotecontrol",
    "castmenuhashchange"
];

const plugins = [
    'NavigationPlugin',
    'ExoPlayerPlugin',
    'ExternalPlayerPlugin'
];

let deviceId
let deviceName
let appName
let appVersion

function getBrowserDeviceId() {
    const key = "jellyfin_device_id";
    let id = localStorage.getItem(key);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(key, id);
    }
    return id;
}

function getBrowserDeviceInfo() {
    const ua = navigator.userAgent;

    const platform = ua.toLowerCase().includes('chrome') ? 'Chrome' :
        ua.toLowerCase().includes('safari') ? 'Safari' :
            ua.toLowerCase().includes('firefox') ? 'Firefox' :
                'HTML5';
    return {
        deviceId: getBrowserDeviceId(),
        deviceName: platform,
        appName: "Phim Ne",
        appVersion: "10.11.5"
    };
}

window.NativeShell = {
    enableFullscreen() {
        window.NativeInterface.enableFullscreen();
    },

    disableFullscreen() {
        window.NativeInterface.disableFullscreen();
    },

    openUrl(url, target) {
        window.NativeInterface.openUrl(url);
    },

    updateMediaSession(mediaInfo) {
        window.NativeInterface.updateMediaSession(JSON.stringify(mediaInfo));
    },

    hideMediaSession() {
        window.NativeInterface.hideMediaSession();
    },

    updateVolumeLevel(value) {
        window.NativeInterface.updateVolumeLevel(value);
    },

    downloadFile(downloadInfo) {
        window.NativeInterface.downloadFiles(JSON.stringify([downloadInfo]));
    },

    downloadFiles(downloadInfo) {
        window.NativeInterface.downloadFiles(JSON.stringify(downloadInfo));
    },

    openClientSettings() {
        window.NativeInterface.openClientSettings();
    },

    selectServer() {
        window.NativeInterface.openServerSelection();
    },

    getPlugins() {
        return plugins;
    },

    async execCast(action, args, callback) {
        this.castCallbacks = this.castCallbacks || {};
        this.castCallbacks[action] = callback;
        window.NativeInterface.execCast(action, JSON.stringify(args));
    },

    async castCallback(action, keep, err, result) {
        const callbacks = this.castCallbacks || {};
        const callback = callbacks[action];
        callback && callback(err || null, result);
        if (!keep) {
            delete callbacks[action];
        }
    }
};

function getDeviceProfile(profileBuilder, item) {
    const profile = profileBuilder({
        enableMkvProgressive: false
    });

    profile.CodecProfiles = profile.CodecProfiles.filter(function (i) {
        return i.Type === "Audio";
    });

    profile.CodecProfiles.push({
        Type: "Video",
        Container: "avi",
        Conditions: [
            {
                Condition: "NotEquals",
                Property: "VideoCodecTag",
                Value: "xvid"
            }
        ]
    });

    profile.CodecProfiles.push({
        Type: "Video",
        Codec: "h264",
        Conditions: [
            {
                Condition: "EqualsAny",
                Property: "VideoProfile",
                Value: "high|main|baseline|constrained baseline"
            },
            {
                Condition: "LessThanEqual",
                Property: "VideoLevel",
                Value: "41"
            }]
    });

    profile.TranscodingProfiles.reduce(function (profiles, p) {
        if (p.Type === "Video" && p.CopyTimestamps === true && p.VideoCodec === "h264") {
            p.AudioCodec += ",ac3";
            profiles.push(p);
        }
        return profiles;
    }, []);

    return profile;
}

window.NativeShell.AppHost = {
    init() {
        try {
            // Native environment
            if (
                window.NativeInterface &&
                typeof window.NativeInterface.getDeviceInformation === "function"
            ) {
                const result = JSON.parse(
                    window.NativeInterface.getDeviceInformation()
                );

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
    getDefaultLayout() {
        return "desktop";
    },
    supports(command) {
        return features.includes(command.toLowerCase());
    },
    getDeviceProfile,
    getSyncProfile: getDeviceProfile,
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
    exit() {
        window.NativeInterface.exitApp();
    }
};
