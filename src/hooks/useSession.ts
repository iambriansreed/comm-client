import { useContext } from 'react';
import { SessionContextProvided, sessionContext } from '../utils/Session';

export default function useSession(): SessionContextProvided {
    const context = useContext(sessionContext);
    if (!context) throw new Error('useSession called outside of provider!');
    return context;
}
