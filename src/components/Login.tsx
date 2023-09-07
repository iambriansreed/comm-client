import { useCallback, useEffect, useState } from 'react';
import { useSessionContext } from './Session';
import useMountEffect from '../hooks/useMountEffect';
import Footer from './Footer';

export default function Login() {
    const { getNewChannel, availableChannels, refreshChannels, error, ...context } = useSessionContext();

    const [formValues, setFormValues] = useState({
        username: context.userName || '',
        channelJoin: availableChannels?.[0]?.name || '',
        channelCreate: '',
    });

    const setFormValue = useCallback(
        (next: Partial<typeof formValues>) => setFormValues((prev) => ({ ...prev, ...next })),
        []
    );

    const [tab, setTab] = useState<'create' | 'join'>('join');

    const handleNewChannel = useCallback(() => {
        getNewChannel().then(({ name }) => {
            document.location.hash = '/' + name;
            setFormValue({ channelCreate: name });
        });
    }, [getNewChannel, setFormValue]);

    useEffect(() => {
        if (tab === 'create') {
            handleNewChannel();
        }
    }, [handleNewChannel, tab]);

    const setChannelValue = useCallback(
        (nextChannel: string = '', username?: string) => {
            if (availableChannels.find(({ name }) => name === nextChannel)) {
                setFormValues((prev) => ({ ...prev, channelJoin: nextChannel, username: username || prev.username }));
                setTab('join');
            } else {
                setFormValues((prev) => ({ ...prev, channelCreate: nextChannel, username: username || prev.username }));
            }
        },
        [availableChannels]
    );

    useMountEffect(() => {
        refreshChannels();

        const onHashChange = () => {
            const hashChannel = document.location.hash?.substring(2);

            if (hashChannel) setChannelValue(hashChannel);

            return !!hashChannel;
        };

        if (onHashChange()) return;

        if (!availableChannels.length) {
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

        let channel = tab === 'create' ? formValues.channelCreate : formValues.channelJoin;

        if (!formValues.username || !channel) return;

        context.login(formValues.username, channel);
    };

    useEffect(() => {
        setChannelValue(context.channelName!, context.userName || '');
    }, [context.channelName, context.userName, setChannelValue]);

    return (
        <>
            <main>
                <div className="form">
                    <form noValidate onSubmit={handleSubmit}>
                        <div className="field">
                            <label htmlFor="username">Name</label>
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
                            <div className="error-message">{error}</div>
                        </div>
                        <div className="field">
                            <label htmlFor="channel">Channel</label>
                            <div className="tabs">
                                <button
                                    disabled={!availableChannels.length}
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
                            {tab === 'create' ? (
                                <div className="control">
                                    <input
                                        type="text"
                                        name="channel"
                                        id="channel"
                                        autoComplete="off"
                                        required
                                        value={formValues.channelCreate}
                                        onChange={(e) => setFormValue({ channelCreate: e.target.value })}
                                    />
                                    <button type="button" onClick={handleNewChannel}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                            <path d="M13.5 2c-5.621 0-10.211 4.443-10.475 10h-3.025l5 6.625 5-6.625h-2.975c.257-3.351 3.06-6 6.475-6 3.584 0 6.5 2.916 6.5 6.5s-2.916 6.5-6.5 6.5c-1.863 0-3.542-.793-4.728-2.053l-2.427 3.216c1.877 1.754 4.389 2.837 7.155 2.837 5.79 0 10.5-4.71 10.5-10.5s-4.71-10.5-10.5-10.5z" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="control">
                                    <select
                                        name="channel"
                                        id="channel"
                                        value={formValues.channelJoin}
                                        onChange={(e) => {
                                            setFormValue({ channelJoin: e.target.value || '' });
                                        }}
                                    >
                                        {availableChannels.map(({ name, usersCount }, index) => (
                                            <option key={index} value={name}>
                                                {name} ({usersCount})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <footer>
                            <button type="submit">Login</button>
                        </footer>
                    </form>
                </div>
            </main>
            <Footer />
        </>
    );
}
