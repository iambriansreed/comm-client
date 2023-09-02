import { Route, useSessionContext } from './Session';
import Room from './Room';
import Login from './Login';
import Connecting from './Connecting';
import { ReactElement } from 'react';

function App() {
    const { route } = useSessionContext();

    const router: Record<Route, () => ReactElement<any, any>> = {
        connecting: Connecting,
        room: Room,
        login: Login,
    };

    const Component = (route && router[route]) || (() => <>404</>);

    return (
        <div className={'app ' + route}>
            <Component />
        </div>
    );
}

export default App;
