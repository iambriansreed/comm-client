import { io } from 'socket.io-client';

const server_uri = process.env.SERVER_URI || process.env.REACT_APP_SERVER_URI!;

const socket = io(server_uri, {
    extraHeaders: {
        'my-custom-header': 'abcd',
    },
    autoConnect: false,
});

export default socket;
