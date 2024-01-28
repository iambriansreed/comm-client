import { ChannelEvent, ClientChannel, isErrorResponse, SocketClient } from '@bsr-comm/utils';
import { PropsWithChildren, useReducer, useState, useEffect } from 'react';
import useMountEffect from '../hooks/useMountEffect';

import { io } from 'socket.io-client';
import { sessionContext, Session, SessionContext, SessionContextProvided } from '../utils/Session';
import sortBy from '../utils/sortBy';

const server_uri = import.meta.env.VITE_SERVER_URI;

const comm = SocketClient(
    io(server_uri, {
        extraHeaders: {
            'my-custom-header': 'abcd',
        },
        autoConnect: false,
        transports: ['websocket', 'polling', 'flashsocket'],
    })
);

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

export default function SessionProvider({ children }: PropsWithChildren) {
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

    const sendEvent = async (data: Record<string, unknown>) => {
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
