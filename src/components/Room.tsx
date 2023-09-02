import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { useSessionContext } from './Session';
import clsx from '../clsx';
import { EventSystem, EventMessage, RoomEvent } from '@bsr-comm/types';
import { BurstIcon, SendIcon, UsersIcon } from '../icons';

type LineData = {
    date: Date;
    nextIsSame: boolean;
    prevIsSame: boolean;
    type: 'message' | 'system-event' | undefined;
};

function sortBy(getValue: (obj: any) => any) {
    return (a: Record<string, any>, b: Record<string, any>) => (getValue(a) > getValue(b) ? 1 : -1);
}

const formatTime = (date: Date) =>
    date.toLocaleTimeString(navigator.language, {
        timeStyle: 'short',
    });

const formatDate = (date: Date) =>
    date.toLocaleString(navigator.language, {
        timeStyle: 'short',
        dateStyle: 'medium',
    });

function Line({ children, className, ...e }: PropsWithChildren<RoomEvent & LineData & { className?: string }>) {
    return (
        <div key={e.uid} id={'line-' + e.uid} className={clsx('line', className)}>
            {children}
        </div>
    );
}

function Message(e: EventMessage & LineData) {
    const { username } = useSessionContext();

    return (
        <Line
            {...e}
            className={clsx(
                'message',
                e.prevIsSame && 'prev-same',
                e.nextIsSame && 'next-same',
                e.username === username && 'mine'
            )}
        >
            <div className="time">{formatTime(e.date)}</div>
            <div className="bubble">
                <div className="username">{e.username}</div>
                <div className="message">{e.data.message}</div>
            </div>
        </Line>
    );
}

const actions = { join: 'joined', leave: 'left' } as const;

function SystemEvent(e: EventSystem & LineData) {
    const [className] = useState('');

    /*

    fadeout and hide
    useMountEffect(() => {
        setTimeout(() => {
            setClassName('opacity-0 transition-all duration-[1000ms] ease-in');
            setTimeout(() => {
                setClassName('');
            }, 1000);
        }, 5000);
    });

    if (e.time + 6000 < Date.now()) return <></>;
    */

    return (
        <Line {...e} className={clsx('system-event', className)}>
            <span>
                <span className="username">{e.username}</span> {actions[e.data.system] || 'interacted with'} the room at{' '}
                {formatDate(e.date)}
            </span>
        </Line>
    );
}

export default function Room() {
    const { events, roomName, logout, sendMessage, usernames } = useSessionContext();

    const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);

    useEffect(() => {
        if (scrollElement) scrollElement.scrollTo(0, document.body.scrollHeight);
    }, [events, scrollElement]);

    const roomEvents = useMemo(() => {
        return (events || [])
            .sort(sortBy((e) => e.time))
            .filter((e, index, all) => {
                const prev = all[index - 1];
                return prev && prev.time !== e.time;
            })
            .map((e) => {
                let type: 'system-event' | 'message' | undefined = undefined;
                if ('system' in e.data) type = 'system-event';
                if ('message' in e.data) type = 'message';
                return {
                    ...e,
                    type,
                };
            })
            .map((e, index, all) => {
                const next = all[index + 1];
                const prev = all[index - 1];
                return {
                    ...e,
                    date: new Date(e.time),
                    nextIsSame: next && next?.username === e.username && next.type === e.type,
                    prevIsSame: prev && prev?.username === e.username && prev.type === e.type,
                };
            });
    }, [events]);

    const handleSend: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();

        const form = e.currentTarget as Form<{ message: HTMLInputElement }>;

        const message = form.message.value || '';

        if (!message) return;

        sendMessage(message);

        form.reset();
    };

    return (
        <>
            <header>
                <h1
                    onClick={() => {
                        navigator.clipboard.writeText(document.location.origin + '#/' + roomName);
                    }}
                >
                    <BurstIcon />
                    {roomName}
                </h1>
                <div className="usernames">
                    <UsersIcon />
                    {!usernames ? 'None' : usernames.map((u, index) => <span key={u + index}>{u}</span>)}
                </div>
                <button type="button" onClick={logout}>
                    Logout
                </button>
            </header>
            <main ref={(node) => setScrollElement(node)}>
                {roomEvents.map((e) => {
                    if (e.type === 'message') return <Message {...e} />;

                    if (e.type === 'system-event') return <SystemEvent {...e} />;

                    return null;
                })}
            </main>
            <footer>
                <form onSubmit={handleSend}>
                    <div className="field">
                        <div className="control">
                            <input type="text" autoComplete="off" name="message" />
                        </div>
                    </div>
                    <button type="submit">
                        <SendIcon />
                    </button>
                </form>
            </footer>
        </>
    );
}
