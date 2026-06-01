import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { ChannelEvent, SystemEvent, isSystemEvent } from '@bsr-comm/utils';
import { SendIcon, UsersIcon } from '../icons';
import useSession from '../hooks/useSession';
import clsx from '../utils/clsx';
import showToast from '../utils/toast';
import ThemeToggle from './ThemeToggle';

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
    const { userName } = useSession();

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
                <span className="user">{e.user}</span> {systemActions[e.system] || 'interacted with'} the
                channel at {formatDate(e.date)}
            </span>
        </Line>
    );
}

function UsersList({ users }: { users?: string[] }) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const count = users?.length ?? 0;

    const togglePopover = () => {
        if (count === 0) return;
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) setCoords({ top: rect.bottom + 8, left: rect.left });
        setOpen((o) => !o);
    };

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                className="users-button"
                onClick={togglePopover}
                aria-label="Show members"
            >
                <UsersIcon />
                {count} {count === 1 ? 'user' : 'users'}
            </button>
            {open &&
                users &&
                coords &&
                createPortal(
                    <>
                        <div className="popover-backdrop" onClick={() => setOpen(false)} />
                        <div
                            className="users-popover"
                            role="dialog"
                            aria-label="Channel members"
                            style={{ top: coords.top, left: coords.left }}
                        >
                            <div className="users-popover-title">In this channel</div>
                            {users.map((u, index) => (
                                <div key={u + index} className="users-popover-name">
                                    {u}
                                </div>
                            ))}
                        </div>
                    </>,
                    document.body
                )}
        </>
    );
}

export default function Chat() {
    const { channel, logout, sendEvent } = useSession();
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

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) =>
        e.key === 'Enter' && handleSend();
    const handleClick: React.MouseEventHandler<HTMLInputElement> = () =>
        scrollElement && scrollElement.scrollTo(0, scrollElement.scrollHeight);

    const handleInvite = () => {
        navigator.clipboard.writeText(document.location.origin + '#/' + channelName);
        showToast('url-copied');
    };

    return (
        <>
            <header>
                <UsersList users={users} />
                <button type="button" onClick={handleInvite}>
                    Invite
                </button>
                <button type="button" onClick={logout}>
                    Logout
                </button>
                <ThemeToggle />
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
                <button
                    type="submit"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                >
                    <SendIcon />
                </button>
            </footer>
            <div id="url-copied" className="toast">
                Url Copied!
            </div>
        </>
    );
}
