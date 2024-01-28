import React from 'react';
import { ClientChannel, User, ErrorResponse } from '@bsr-comm/utils';
import { Route } from '../Route';
import generateUUID from './generateUUID';

export class Session {
    constructor(private sessionStorage = globalThis.sessionStorage) {}

    get id(): string {
        let value = this.sessionStorage.getItem('id');

        if (!value) {
            value = generateUUID();
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

export interface SessionContext {
    channel: ClientChannel | null;
    userName: string | null;
    error: ErrorResponse['code'] | null;
    route: Route;
}

export interface SessionContextProvided extends SessionContext {
    getNewChannel: () => Promise<string>;
    login: (userName: string, channelName: string) => Promise<void>;
    logout: () => void;
    sendEvent: (data: Record<string, unknown>) => Promise<void>;
    setError: (error: ErrorResponse['code'] | null) => void;
}

export const sessionContext = React.createContext<SessionContextProvided | null>(null);
