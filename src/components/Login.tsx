import { useCallback, useState } from 'react';
import useMountEffect from '../hooks/useMountEffect';
import Footer from './Footer';
import useSession from '../hooks/useSession';
import ErrorMessage from '../utils/ErrorMessage';

export default function Login() {
    const { getNewChannel, error, setError, ...context } = useSession();

    const [formValues, setFormValues] = useState({
        username: context.userName || '',
        channel: '',
    });

    const handleNewChannel = useCallback(() => {
        getNewChannel().then((channel) => {
            document.location.hash = '/' + channel;
            setFormValues((p) => ({ ...p, channel }));
        });
    }, [getNewChannel]);

    const handleUserNameChange = (username: string) => {
        setError(null);
        setFormValues((p) => ({ ...p, username }));
    };

    const setChannelValue = (channel: string = '', username?: string) => {
        setFormValues((p) => ({
            ...p,
            channel,
            username: username || p.username,
        }));
    };

    useMountEffect(() => {
        const channelCreate = document.location.hash.startsWith('#/') && document.location.hash?.substring(2);
        if (channelCreate) {
            setChannelValue(channelCreate);
            return;
        }
        getNewChannel().then((channelCreate) => {
            setChannelValue(channelCreate);
        });
    });

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        if (!formValues.username || !formValues.channel) {
            return;
        }
        context.login(formValues.username, formValues.channel);
    };

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
                                    onChange={(e) => handleUserNameChange(e.target.value)}
                                />
                            </div>
                            {error && <div className="error-message">{ErrorMessage[error]}</div>}
                        </div>
                        <div className="field">
                            <label htmlFor="channel">Channel</label>
                            <div className="control">
                                <input
                                    type="text"
                                    name="channel"
                                    id="channel"
                                    autoComplete="off"
                                    required
                                    value={formValues.channel}
                                    onChange={(e) =>
                                        setFormValues((p) => ({ ...p, channel: e.target.value }))
                                    }
                                />
                                <button type="button" onClick={handleNewChannel}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                        <path d="M13.5 2c-5.621 0-10.211 4.443-10.475 10h-3.025l5 6.625 5-6.625h-2.975c.257-3.351 3.06-6 6.475-6 3.584 0 6.5 2.916 6.5 6.5s-2.916 6.5-6.5 6.5c-1.863 0-3.542-.793-4.728-2.053l-2.427 3.216c1.877 1.754 4.389 2.837 7.155 2.837 5.79 0 10.5-4.71 10.5-10.5s-4.71-10.5-10.5-10.5z" />
                                    </svg>
                                </button>
                            </div>
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
