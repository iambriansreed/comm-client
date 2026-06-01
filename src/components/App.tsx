import Chat from './Chat';
import Login from './Login';
import Connecting from './Connecting';
import ThemeToggle from './ThemeToggle';
import { ReactElement } from 'react';
import useSession from '../hooks/useSession';
import { Route } from '../Route';

function App() {
    const { route } = useSession();

    const router: Record<Route, () => ReactElement<any, any>> = {
        connecting: Connecting,
        channel: Chat,
        login: Login,
    };

    const Component = (route && router[route]) || (() => <>404</>);

    return (
        <div className={'app ' + route}>
            {/* chat renders its own toggle inside the header; float it elsewhere */}
            {route !== 'channel' && <ThemeToggle floating />}
            <Component />
        </div>
    );
}

export default App;
