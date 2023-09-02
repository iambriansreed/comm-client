import { useCallback, useEffect, useState } from 'react';
import { useSessionContext } from './Session';
import useMountEffect from '../hooks/useMountEffect';
import Footer from './Footer';

export default function Login() {
    const { getNewRoom, availableRooms, ...context } = useSessionContext();

    const [formValues, setFormValues] = useState({
        username: context.username || '',
        roomJoin: availableRooms[0] || '',
        roomCreate: '',
    });

    const setFormValue = useCallback(
        (next: Partial<typeof formValues>) => setFormValues((prev) => ({ ...prev, ...next })),
        []
    );

    const [tab, setTab] = useState<'create' | 'join'>('join');

    const handleNewRoom = useCallback(() => {
        getNewRoom().then((roomCreate) => {
            document.location.hash = '/' + roomCreate;
            setFormValue({ roomCreate });
        });
    }, [getNewRoom, setFormValue]);

    useEffect(() => {
        if (tab === 'create') {
            handleNewRoom();
        }
    }, [handleNewRoom, tab]);

    const setRoomValue = useCallback(
        (nextRoom: string = '', username?: string) => {
            if (availableRooms.includes(nextRoom)) {
                setFormValues((prev) => ({ ...prev, roomJoin: nextRoom, username: username || prev.username }));
                setTab('join');
            } else {
                setFormValues((prev) => ({ ...prev, roomCreate: nextRoom, username: username || prev.username }));
            }
        },
        [availableRooms]
    );

    useMountEffect(() => {
        const onHashChange = () => {
            const hashRoom = document.location.hash?.substring(2);

            if (hashRoom) setRoomValue(hashRoom);

            return !!hashRoom;
        };

        if (onHashChange()) return;

        if (!availableRooms.length) {
            setTab('create');
            return;
        }

        window.addEventListener('hashchange', onHashChange);

        return () => {
            window.removeEventListener('hashchange', onHashChange);
        };
    });

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();

        let room = tab === 'create' ? formValues.roomCreate : formValues.roomJoin;

        if (!formValues.username || !room) return;

        context.login(formValues.username, room);
    };

    useEffect(() => {
        setRoomValue(context.roomName, context.username || '');
    }, [context.roomName, context.username, setRoomValue]);

    return (
        <>
            <main>
                <div className="form">
                    <div className="tabs">
                        <button
                            disabled={!availableRooms.length}
                            type="button"
                            className={tab === 'join' ? 'active' : ''}
                            onClick={() => setTab('join')}
                        >
                            Join
                        </button>
                        <button
                            type="button"
                            className={tab === 'create' ? 'active' : ''}
                            onClick={() => setTab('create')}
                        >
                            Create
                        </button>
                    </div>
                    <form noValidate onSubmit={handleSubmit}>
                        <div className="field">
                            <label htmlFor="room">Room</label>
                            {tab === 'create' ? (
                                <div className="control">
                                    <input
                                        type="text"
                                        name="room"
                                        id="room"
                                        autoComplete="off"
                                        required
                                        value={formValues.roomCreate}
                                        onChange={(e) => setFormValue({ roomCreate: e.target.value })}
                                    />
                                    <button type="button" onClick={handleNewRoom}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                            <path d="M13.5 2c-5.621 0-10.211 4.443-10.475 10h-3.025l5 6.625 5-6.625h-2.975c.257-3.351 3.06-6 6.475-6 3.584 0 6.5 2.916 6.5 6.5s-2.916 6.5-6.5 6.5c-1.863 0-3.542-.793-4.728-2.053l-2.427 3.216c1.877 1.754 4.389 2.837 7.155 2.837 5.79 0 10.5-4.71 10.5-10.5s-4.71-10.5-10.5-10.5z" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="control">
                                    <select
                                        name="room"
                                        id="room"
                                        value={formValues.roomJoin}
                                        onChange={(e) => {
                                            setFormValue({ roomJoin: e.target.value || '' });
                                        }}
                                    >
                                        {availableRooms.map((roomOption, index) => (
                                            <option key={index} value={roomOption}>
                                                {roomOption}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="field">
                            <label htmlFor="username">Username</label>

                            <div className="control">
                                <input
                                    type="text"
                                    name="username"
                                    id="username"
                                    autoComplete="off"
                                    required
                                    value={formValues.username}
                                    onChange={(e) => setFormValue({ username: e.target.value })}
                                />
                            </div>
                        </div>
                        <footer>
                            <button type="submit">Submit</button>
                        </footer>
                    </form>
                </div>
            </main>
            <Footer />
        </>
    );
}
