import type { Api } from '@jellyfin/sdk';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import type { ApiClient, Event } from 'jellyfin-apiclient';
import React, { type FC, type PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import events from 'utils/events';
import { toApi } from 'utils/jellyfin-apiclient/compat';

export interface JellyfinApiContext {
    __legacyApiClient__?: ApiClient
    api?: Api
    user?: UserDto
}

export const ApiContext = createContext<JellyfinApiContext>({});
export const useApi = () => useContext(ApiContext);

export const ApiProvider: FC<PropsWithChildren<unknown>> = ({ children }) => {
    const [legacyApiClient, setLegacyApiClient] = useState<ApiClient>();
    const [api, setApi] = useState<Api>();
    const [user, setUser] = useState<UserDto>();

    const context = useMemo(() => ({
        __legacyApiClient__: legacyApiClient,
        api,
        user
    }), [api, legacyApiClient, user]);

    useEffect(() => {
        const currentApiClient = ServerConnections.currentApiClient();

        if (currentApiClient && currentApiClient.isLoggedIn()) {
            // console.log('currentApiClient.getCurrentUser()', currentApiClient.getCurrentUser());
            currentApiClient.getCurrentUser()
                .then(newUser => {
                    if (newUser) {
                        updateApiUser(undefined, newUser);
                    } else {
                        console.info('[ApiProvider] No current user found');
                        resetApiUser();
                    }
                })
                .catch(err => {
                    console.info('[ApiProvider] Could not get current user', err || 'Unknown error');
                    resetApiUser();
                });
        } else {
            // console.info('[ApiProvider] No authenticated session available');
        }

        const updateApiUser = (_e: Event | undefined, newUser: UserDto) => {
            setUser(newUser);

            if (newUser.ServerId) {
                setLegacyApiClient(ServerConnections.getApiClient(newUser.ServerId));
            }
        };

        const resetApiUser = () => {
            setLegacyApiClient(undefined);
            setUser(undefined);
        };

        events.on(ServerConnections, 'localusersignedin', updateApiUser);
        events.on(ServerConnections, 'localusersignedout', resetApiUser);

        return () => {
            events.off(ServerConnections, 'localusersignedin', updateApiUser);
            events.off(ServerConnections, 'localusersignedout', resetApiUser);
        };
    }, [ setLegacyApiClient, setUser ]);

    useEffect(() => {
        setApi(legacyApiClient ? toApi(legacyApiClient) : undefined);
    }, [legacyApiClient, setApi]);

    return (
        <ApiContext.Provider value={context}>
            {children}
        </ApiContext.Provider>
    );
};
