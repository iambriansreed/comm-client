import { PropsWithChildren, useEffect, useState } from 'react';
import { useSessionContext } from './Session';
import clsx from '../clsx';
import { ChannelEvent, SystemEvent, isSystemEvent } from '@bsr-comms/utils';
import { AppIcon, SendIcon, UsersIcon } from '../icons';

type LineData = {
    date: Date;
    nextIsSame: boolean;
    prevIsSame: boolean;
};

const formatTime = (date: Date) =>
    date.toLocaleTimeString(navigator.language, {
        timeStyle: 'short',
    });

const formatDate = (date: Date) =>
    date.toLocaleString(navigator.language, {
        timeStyle: 'short',
        dateStyle: 'medium',
    });

function Line({
    children,
    className,
    ...e
}: PropsWithChildren<(ChannelEvent | SystemEvent) & LineData & { className?: string }>) {
    return (
        <div id={'line-' + e.id} className={clsx('line', className)}>
            {children}
        </div>
    );
}

interface MessageEvent extends ChannelEvent<{ message: string }> {}

function isMessageEvent(e: ChannelEvent): e is MessageEvent {
    return 'message' in e.data;
}

function MessageLine(e: MessageEvent & LineData) {
    const { userName } = useSessionContext();

    return (
        <Line
            {...e}
            className={clsx(
                'message',
                e.prevIsSame && 'prev-same',
                e.nextIsSame && 'next-same',
                e.user === userName && 'mine'
            )}
        >
            <div className="time">{formatTime(e.date)}</div>
            <div className="bubble">
                <div className="user">{e.user}</div>
                <div className="message">{e.data.message}</div>
            </div>
        </Line>
    );
}

const systemActions: Record<SystemEvent['system'], string> = { login: 'joined', logout: 'left' } as const;

function SystemEventLine(e: SystemEvent & LineData) {
    const [className] = useState('');

    return (
        <Line {...e} className={clsx('system-event', className)}>
            <span>
                <span className="user">{e.user}</span> {systemActions[e.system] || 'interacted with'} the channel at{' '}
                {formatDate(e.date)}
            </span>
        </Line>
    );
}

export default function Chat() {
    const { channel, logout, sendEvent } = useSessionContext();
    const { events, users, name: channelName } = channel!;

    const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
    const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null);

    useEffect(() => {
        if (scrollElement) scrollElement.scrollTo(0, scrollElement.scrollHeight);
    }, [events, scrollElement]);

    const handleSend = () => {
        if (!inputElement) return;

        sendEvent({ message: inputElement.value || '' });
        inputElement.value = '';
        inputElement.focus();
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => e.key === 'Enter' && handleSend();
    const handleClick: React.MouseEventHandler<HTMLInputElement> = () =>
        scrollElement && scrollElement.scrollTo(0, scrollElement.scrollHeight);

    return (
        <>
            <header>
                <h1
                    onClick={() => {
                        navigator.clipboard.writeText(document.location.origin + '#/' + channelName);
                    }}
                >
                    <AppIcon />
                    {channelName}
                </h1>
                <div className="users">
                    <UsersIcon />
                    {!users ? 'None' : users.map((u, index) => <span key={u + index}>{u}</span>)}
                </div>
                <button type="button" onClick={logout}>
                    Logout
                </button>
            </header>
            <main ref={setScrollElement}>
                {events.map((e, index, all) => {
                    const prev = all[index - 1];
                    if (prev && prev.id === e.id) {
                        return null;
                    }
                    const next = all[index + 1];
                    const systemEvent = isSystemEvent(e);
                    const event = {
                        ...e,
                        date: new Date(e.time),
                        nextIsSame: next && next.user === e.user && isSystemEvent(next) === systemEvent,
                        prevIsSame: prev && prev.user === e.user && isSystemEvent(prev) === systemEvent,
                    };
                    if (isSystemEvent(event)) {
                        return <SystemEventLine key={event.id} {...event} />;
                    }
                    if (isMessageEvent(event)) {
                        return <MessageLine key={event.id} {...event} />;
                    }
                    return null;
                })}
            </main>
            <footer>
                <input
                    type="text"
                    autoComplete="off"
                    name="message"
                    ref={setInputElement}
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                />
                <button type="submit" onClick={handleSend}>
                    <SendIcon />
                </button>
            </footer>
        </>
    );
}
