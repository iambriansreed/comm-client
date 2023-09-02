import { useEffect } from 'react';

export default function useMountEffect(effect: React.EffectCallback) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(effect, []);
}
