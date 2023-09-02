import React, { PropsWithChildren, useContext, useEffect, useState } from 'react';
import { PayloadRoomJoin, RoomEvent, PayloadRoomLeave, Room, SocketEvent, PayloadRoomMessage } from '@bsr-comm/types';
import useMountEffect from '../hooks/useMountEffect';
import socket from '../socket';

interface SessionContext {
    roomName: Room['name'];
    usernames: string[];
    events: Room['events'];
    username: string | null;
}

const SessionContextDefaults = (): SessionContext => ({
    roomName: '' as Room['name'],
    usernames: [] as string[],
    events: [] as Room['events'],
    username: sessionStorage.getItem('username') || '',
});

export type Route = 'init' | 'login' | 'room' | 'server-offline';

interface SessionContextProvided extends Partial<SessionContext> {
    login: (username: string, roomName: string) => Promise<void>;
    logout: () => void;
    sendMessage: (message: string) => void;
    route: Route;
    availableRooms: string[];
    getNewRoom: () => Promise<string>;
}

const sessionContext = React.createContext<SessionContextProvided | null>(null);

const Provider = sessionContext.Provider;

export const SessionProvider = ({ children }: PropsWithChildren) => {
    const [route, setRoute] = useState<Route>('init');

    const [rooms, setRooms] = useState<string[]>([]);

    const [contextValue, setContextValue] = useState<SessionContext>(SessionContextDefaults());

    useMountEffect(() => {
        const onRoomEvent = (roomEvent: RoomEvent<any>) => {
            setContextValue((prev) => {
                if (roomEvent.room !== prev.roomName) {
                    return prev;
                }

                let usernames = prev.usernames;

                if (roomEvent.data.system) {
                    if (roomEvent.data.system === 'join' && !usernames.includes(roomEvent.username))
                        usernames = [...usernames, roomEvent.username];

                    if (roomEvent.data.system === 'leave' && usernames.includes(roomEvent.username))
                        usernames = usernames.filter((u) => u !== roomEvent.username);
                }

                return {
                    //
                    ...prev,
                    usernames,
                    events: [...prev.events, roomEvent],
                };
            });
        };

        const onConnect = () => {
            socket.on(SocketEvent.RoomEvent, onRoomEvent);
            socket.on(SocketEvent.RoomLeave, (data) => console.log({ RoomLeave: data }));

            socket.emitWithAck(SocketEvent.ClientInit).then(({ rooms }) => {
                setRooms(rooms);

                const roomName =
                    document.location.hash?.length > 2
                        ? document.location.hash.substring(2)
                        : sessionStorage.getItem('roomName');

                const username = sessionStorage.getItem('username');

                if (username && roomName) {
                    rejoin(username, roomName);
                } else {
                    setRoute('login');
                }
            });
        };
        const onConnectError = () => {
            setRoute('server-offline');
        };
        socket.on('connect', onConnect);
        socket.on('connect_error', onConnectError);

        socket.connect();

        return () => {
            socket.off('connect', onConnect);
            socket.off('connect_error', onConnectError);
            socket.off(SocketEvent.RoomEvent, onRoomEvent);
        };
    });

    // then room changes in context update location hash
    useEffect(() => {
        if (document.location.hash.substring(2) !== contextValue.roomName) {
            document.location.hash = !contextValue.roomName ? '' : '/' + contextValue.roomName;
        }
    }, [contextValue.roomName]);

    const rejoin = async (username: string, roomName: string) => {
        const room: Room = await socket.emitWithAck(SocketEvent.RoomRejoin, {
            username,
            room: roomName,
        } as PayloadRoomJoin);

        if (!room) {
            setRoute('login');
            return;
        }

        setContextValue({ username, roomName, events: room.events, usernames: room.usernames });

        sessionStorage.setItem('username', username);
        sessionStorage.setItem('roomName', room.name);

        setRoute('room');
    };

    const login: SessionContextProvided['login'] = async (username, roomName) => {
        const room: Room = await socket.emitWithAck(SocketEvent.RoomJoin, {
            username,
            room: roomName,
        } as PayloadRoomJoin);

        if (!room) {
            setRoute('login');
            return;
        }

        setContextValue({ username, roomName, events: room.events, usernames: room.usernames });

        sessionStorage.setItem('username', username);
        sessionStorage.setItem('roomName', room.name);

        setRoute('room');
    };

    const logout = async () => {
        const { username, roomName } = contextValue;

        socket.emitWithAck(SocketEvent.RoomLeave, { username, room: roomName } as PayloadRoomLeave);

        setContextValue(SessionContextDefaults);
        sessionStorage.removeItem('roomName');
        setRoute('login');
    };

    const sendMessage = async (message: string) => {
        if (!contextValue.username || !contextValue.roomName) return;
        // send logout request

        const event = await socket.emitWithAck(SocketEvent.RoomEvent, {
            data: { message },
            room: contextValue.roomName,
            username: contextValue.username,
        } as PayloadRoomMessage);

        setContextValue((prev) => ({ ...prev, events: [...prev.events, event] }));
    };

    const getNewRoom = async () => socket.emitWithAck(SocketEvent.RoomNewName) as Promise<string>;

    const sessionContextProvidedValue: SessionContextProvided = {
        ...contextValue,
        login,
        logout,
        sendMessage,
        availableRooms: rooms.sort(),
        route: route,
        getNewRoom,
    };

    return <Provider value={sessionContextProvidedValue}>{children}</Provider>;
};

export const useSessionContext = (): SessionContextProvided => {
    const context = useContext(sessionContext);
    if (!context) throw new Error('useSessionContext called outside of provider!');
    return context;
};
