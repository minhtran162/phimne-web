import { playbackManager } from './playbackmanager';
import layoutManager from '../layoutManager';
import Events from '../../utils/events.ts';

let orientationLocked;

function onOrientationChangeSuccess() {
    orientationLocked = true;
}

function onOrientationChangeError(err) {
    orientationLocked = false;
    console.error('error locking orientation: ' + err);
}

function tryLockLandscape() {
    try {
        const orientation = window.screen.orientation;

        if (!orientation || typeof orientation.lock !== 'function') {
            return; // unsupported, move on with life
        }

        const result = orientation.lock('landscape');

        if (result && typeof result.then === 'function') {
            result.catch(() => {
                /* ignore – orientation is best-effort */
            });
        }
    } catch {
        // NotSupportedError, SecurityError, Illegal invocation
        // All non-fatal. Do absolutely nothing.
    }
}

Events.on(playbackManager, 'playbackstart', function (e, player) {
    const isLocalVideo =
        player.isLocalPlayer &&
        !player.isExternalPlayer &&
        playbackManager.isPlayingVideo(player);

    if (isLocalVideo && layoutManager.mobile) {
        tryLockLandscape();
    }
});

Events.on(playbackManager, 'playbackstop', function (e, playbackStopInfo) {
    if (orientationLocked && !playbackStopInfo.nextMediaType) {
        const unlockOrientation = window.screen.unlockOrientation || window.screen.mozUnlockOrientation || window.screen.msUnlockOrientation || (window.screen.orientation?.unlock);

        if (unlockOrientation) {
            try {
                unlockOrientation();
            } catch (err) {
                console.error('error unlocking orientation: ' + err);
            }
            orientationLocked = false;
        }
    }
});
