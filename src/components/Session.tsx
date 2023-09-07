import React, { PropsWithChildren, useContext, useEffect, useState } from 'react';
import {
    ClientChannel,
    ChannelAction,
    ChannelEvent,
    ChannelNameResponse,
    ChannelStatus,
    ClientStatusResponse,
    EventAction,
    LoginResponse,
    LogoutResponse,
    SocketEvent,
    ErrorResponse,
} from '@bsr-comm/types';
import useMountEffect from '../hooks/useMountEffect';
import socket from '../socket';
import { sortBy } from '../utils';

const Session = new (class {
    sessionReset() {
        this.sessionId = crypto.randomUUID();
        return this.sessionId;
    }

    get sessionId(): string {
        return sessionStorage.getItem('sessionId') || this.sessionReset();
    }
    set sessionId(value: string) {
        sessionStorage.setItem('sessionId', value);
    }

    get userName(): string {
        return sessionStorage.getItem('userName') || '';
    }
    set userName(value: string) {
        sessionStorage.setItem('userName', value);
    }

    get channelName(): string {
        return sessionStorage.getItem('channelName') || '';
    }
    set channelName(value: string) {
        sessionStorage.setItem('channelName', value);
    }
})();

interface SessionContext {
    channelName: ClientChannel['name'] | null;
    users: string[];
    events: ClientChannel['events'];
    userName: string | null;
    error: string;
}

const SessionContextDefaults = (): SessionContext => {
    return {
        channelName: '' as ClientChannel['name'],
        users: [] as string[],
        events: [] as ClientChannel['events'],
        userName: Session.userName,
        error: '',
    };
};

export type Route = 'login' | 'channel' | 'connecting';

interface SessionContextProvided extends Partial<SessionContext> {
    availableChannels: ChannelStatus[];
    getNewChannel: () => Promise<ChannelNameResponse>;
    login: (userName: string, channelName: string) => Promise<void>;
    logout: () => void;
    refreshChannels: () => void;
    route: Route;
    sendEvent: (data: any) => void;
}

const sessionContext = React.createContext<SessionContextProvided | null>(null);

const Provider = sessionContext.Provider;

export const SessionProvider = ({ children }: PropsWithChildren) => {
    const [route, setRoute] = useState<Route>('connecting');
    const [error, setError] = useState<string>('');

    const [channels, setChannels] = useState<ChannelStatus[]>([]);

    const [contextValue, setContextValue] = useState<SessionContext>(SessionContextDefaults());

    const setContextKey = (callback: (prev: SessionContext) => Partial<SessionContext> | null | false | undefined) =>
        setContextValue((prev) => ({
            ...prev,
            ...(callback(prev) || null),
        }));

    useEffect(() => {
        Session.channelName = contextValue.channelName || '';
        Session.userName = contextValue.userName || '';
    }, [contextValue.channelName, contextValue.userName]);

    const refreshChannels = () =>
        socket.emitWithAck(SocketEvent.ClientStatus).then(({ channels }: ClientStatusResponse) => {
            setChannels(channels);
        });

    useMountEffect(() => {
        const onChannelEvent = (channelEvent: ChannelEvent) => {
            const { channel } = channelEvent;

            setContextKey(
                ({ channelName, events }) => channel === channelName && { events: [...events, channelEvent] }
            );
        };

        const onConnect = () => {
            refreshChannels().then(() => {
                const channelName =
                    document.location.hash?.length > 2 ? document.location.hash.substring(2) : Session.channelName;

                const user = Session.userName;

                if (user && channelName) {
                    login(user, channelName);
                } else {
                    setRoute('login');
                }
            });
        };

        const onConnectError = () => {
            setRoute('connecting');
        };

        const onChannelLogin = ({ channels, channel }: LoginResponse) => {
            setContextKey(
                (prev) =>
                    channel.name === prev.channelName && {
                        users: channel.users,
                        events: channel.events,
                    }
            );
            setChannels(channels);
        };

        const onChannelLogout = ({ channels, channel }: LogoutResponse) => {
            if (channel)
                setContextKey(
                    (prev) =>
                        channel?.name === prev.channelName && {
                            users: channel.users,
                            events: channel.events,
                        }
                );

            setChannels(channels);
        };

        socket.on('connect', onConnect);
        socket.on('connect_error', onConnectError);
        socket.on(SocketEvent.ChannelEvent, onChannelEvent);
        socket.on(SocketEvent.ChannelLogin, onChannelLogin);
        socket.on(SocketEvent.ChannelLogout, onChannelLogout);

        socket.connect();

        return () => {
            socket.off('connect', onConnect);
            socket.off('connect_error', onConnectError);
            socket.off(SocketEvent.ChannelEvent, onChannelEvent);
            socket.off(SocketEvent.ChannelLogin, onChannelLogin);
            socket.off(SocketEvent.ChannelLogout, onChannelLogout);
        };
    });

    // then channel changes in context update location hash
    useEffect(() => {
        if (document.location.hash.substring(2) !== contextValue.channelName) {
            document.location.hash = !contextValue.channelName ? '' : '/' + contextValue.channelName;
        }
    }, [contextValue.channelName]);

    const newChannelAction = (
        userName = contextValue.userName,
        channelName = contextValue.channelName
    ): ChannelAction => ({
        channel: channelName!,
        user: {
            name: userName!,
            sessionId: Session.sessionId,
        },
    });

    const newEvent: <T = Record<string, any>>(data: T) => EventAction<T> = (data: any) => {
        return {
            ...newChannelAction(),
            data,
        } as EventAction;
    };

    const login: SessionContextProvided['login'] = async (userName, channelName) => {
        const response: LoginResponse | ErrorResponse = await socket.emitWithAck(
            //
            SocketEvent.ChannelLogin,
            newChannelAction(userName, channelName)
        );

        if ('error' in response) {
            setError(response.error);
            return;
        }

        const { channel } = response;

        if (!channel) {
            setRoute('login');
            return;
        }

        setContextKey(() => ({
            events: channel.events,
            users: channel.users,
            userName,
            channelName,
        }));

        setRoute('channel');
    };

    const logout: SessionContextProvided['logout'] = async () => {
        const { channels }: LogoutResponse = await socket.emitWithAck(
            //
            SocketEvent.ChannelLogout,
            newChannelAction()
        );

        setContextKey((prev) => ({ ...SessionContextDefaults(), userName: prev.userName }));

        setChannels(channels);

        setRoute('login');
    };

    const sendEvent = async (data: any) => {
        const eventPayload = newEvent(data);

        const event = await socket.emitWithAck(SocketEvent.ChannelEvent, eventPayload);

        setContextValue((prev) => ({ ...prev, events: [...prev.events, event] }));
    };

    const getNewChannel = async () => socket.emitWithAck(SocketEvent.ChannelName) as Promise<ChannelNameResponse>;

    const sessionContextProvidedValue: SessionContextProvided = {
        ...contextValue,
        login,
        logout,
        sendEvent: sendEvent,
        availableChannels: channels.sort(sortBy((c) => c.name)),
        route: route,
        getNewChannel,
        refreshChannels,
        error,
    };

    return <Provider value={sessionContextProvidedValue}>{children}</Provider>;
};

export const useSessionContext = (): SessionContextProvided => {
    const context = useContext(sessionContext);
    if (!context) throw new Error('useSessionContext called outside of provider!');
    return context;
};
