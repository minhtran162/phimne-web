export declare global {
    import { ApiClient, Events } from 'jellyfin-apiclient';

    interface Window {
        ApiClient: ApiClient;
        Events: Events;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        NativeShell: any;
        Loading: {
            show();
            hide();
        }
    }

    interface DocumentEventMap {
        'viewshow': CustomEvent;
    }

    const __COMMIT_SHA__: string;
    const __JF_BUILD_VERSION__: string;
    const __PACKAGE_JSON_NAME__: string;
    const __PACKAGE_JSON_VERSION__: string;
    const __USE_SYSTEM_FONTS__: boolean;
    const __WEBPACK_SERVE__: boolean;
    const __NGINX_ENCRYPTED_DATA__: string;
    const __NGINX_IV__: string;
    const __NGINX_TAG__: string;
    const __NGINX_SECRET_KEY__: string;
    const __NGINX_JELLYFIN_DOMAIN__: string;
}
