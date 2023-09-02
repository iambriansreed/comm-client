import { Route, useSessionContext } from './Session';
import Room from './Room';
import Login from './Login';
import ServerOffline from './ServerOffline';
import { ReactElement } from 'react';
import Init from './Init';

function App() {
    const { route } = useSessionContext();

    const router: Record<Route, () => ReactElement<any, any>> = {
        'server-offline': ServerOffline,
        room: Room,
        login: Login,
        init: Init,
    };

    const Component = (route && router[route]) || (() => <>404</>);

    return (
        <div className={'app ' + route}>
            <Component />
        </div>
    );
}

export default App;
