import React, { PropsWithChildren, useContext, useEffect, useReducer, useState } from 'react';
import { ClientChannel, isErrorResponse, User, ChannelEvent, SocketClient, ErrorResponse } from '@bsr-comms/utils';
import { sortBy } from '../utils';
import useMountEffect from '../hooks/useMountEffect';

import { io } from 'socket.io-client';

const server_uri = process.env.SERVER_URI || process.env.REACT_APP_SERVER_URI!;

const comm = SocketClient(
    io(server_uri, {
        extraHeaders: {
            'my-custom-header': 'abcd',
        },
        autoConnect: false,
        transports: ['websocket', 'polling', 'flashsocket'],
    })
);

class Session {
    constructor(private sessionStorage = globalThis.sessionStorage) {}

    get id(): string {
        let value = this.sessionStorage.getItem('id');

        if (!value) {
            value = crypto.randomUUID();
            this.sessionStorage.setItem('id', value);
        }

        return value;
    }

    get userName(): string {
        return this.sessionStorage.getItem('userName') || '';
    }
    set userName(value: string) {
        this.sessionStorage.setItem('userName', value);
    }
    get channelName(): string {
        return this.sessionStorage.getItem('channelName') || '';
    }
    set channelName(value: string) {
        this.sessionStorage.setItem('channelName', value);
    }

    get user(): User {
        return {
            name: this.userName,
            sessionId: this.id,
        };
    }
}

export type Route = 'login' | 'channel' | 'connecting';

export const ErrorMessage: Record<ErrorResponse['code'], string> = {
    MaxUsers: 'The maximum number of users have already joined the channel.',
    UsernameInvalid: 'User name is invalid.',
    UsernameUnavailable: 'User name is unavailable.',
};

interface SessionContext {
    channel: ClientChannel | null;
    userName: string | null;
    error: ErrorResponse['code'] | null;
    route: Route;
}

interface SessionContextProvided extends SessionContext {
    getNewChannel: () => Promise<string>;
    login: (userName: string, channelName: string) => Promise<void>;
    logout: () => void;
    sendEvent: (data: any) => void;
    setError: (error: ErrorResponse['code'] | null) => void;
}

const sessionContext = React.createContext<SessionContextProvided | null>(null);

const Provider = sessionContext.Provider;

const session = new Session();

type Action =
    | {
          type: 'event';
          data: ChannelEvent;
      }
    | {
          type: 'channel';
          data: ClientChannel;
      };

function channelReducer(state: SessionContext['channel'], action: Action | null): SessionContext['channel'] {
    if (!action) return action;

    const { type, data } = action;

    if (type === 'channel' && (!state || data.name === state?.name)) {
        return { ...state, ...data };
    }

    if (type === 'event' && data.channel === state?.name) {
        const events: ClientChannel['events'] = [...state.events, data].sort(sortBy((e) => e.time));

        return { ...state, events };
    }

    return state;
}

export function SessionProvider({ children }: PropsWithChildren) {
    const [channel, setChannel] = useReducer(channelReducer, null);
    const [userName, setUsername] = useState<SessionContext['userName']>(session.userName || null);
    const [error, setError] = useState<SessionContext['error'] | null>(null);
    const [route, setRoute] = useState<SessionContext['route']>('connecting');

    // clear error when route changes
    useEffect(() => {
        setError(null);
    }, [channel]);

    useMountEffect(
        comm.onMount({
            onChannelEvent: (data) => {
                setChannel({ type: 'event', data });
            },
            onConnect: async () => {
                const { userName, channelName } = session;
                if (userName && channelName) {
                    login(userName, channelName);
                } else {
                    setRoute('login');
                }
            },
            onConnectError: () => {
                setRoute('connecting');
            },
            onChannelLogin: ({ channel: data }) => {
                setChannel({ type: 'channel', data });
            },
            onChannelLogout: ({ channel: data }) => {
                data && setChannel({ type: 'channel', data });
            },
        })
    );

    const login: SessionContextProvided['login'] = async (userName, channel) => {
        if (!userName || !channel) return;

        const response = await comm.login({
            channel,
            user: {
                name: userName,
                sessionId: session.id,
            },
        });

        if (isErrorResponse(response)) {
            setError(response.code);
            setRoute('login');
            return;
        }

        if (!response.channel) {
            setRoute('login');
            return;
        }

        // successful login, set session

        session.channelName = channel;
        session.userName = userName;

        setChannel({ type: 'channel', data: response.channel });
        setUsername(userName);
        setRoute('channel');
    };

    const logout: SessionContextProvided['logout'] = async () => {
        if (!channel) {
            setRoute('login');
            return;
        }

        const response = await comm.logout({
            channel: channel.name,
            user: session.user,
        });

        if (isErrorResponse(response)) {
            setError(response.code);
            return;
        }

        // successful channel logout, set session vars
        session.channelName = '';

        setChannel(null);

        setRoute('login');
    };

    const sendEvent = async (data: any) => {
        if (!channel?.name) return;

        const action = { data, channel: channel.name, user: session.user };

        const channelEvent = await comm.sendEvent(action);

        if (isErrorResponse(channelEvent)) {
            setError(channelEvent.code);
            return;
        }

        setChannel({ type: 'event', data: channelEvent });
    };

    return (
        <Provider
            value={{
                channel,
                error,
                getNewChannel: () => comm.getNewChannel(),
                login,
                logout,
                route,
                sendEvent,
                setError,
                userName,
            }}
        >
            {children}
        </Provider>
    );
}

export const useSessionContext = (): SessionContextProvided => {
    const context = useContext(sessionContext);
    if (!context) throw new Error('useSessionContext called outside of provider!');
    return context;
};
