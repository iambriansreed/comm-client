import { HeartIcon } from '../icons';
import version from '../version';

export default function Footer() {
    return (
        <footer className="credits">
            <div>
                <HeartIcon />
                <a href="https://iambrian.com">Brian</a>
            </div>
            <div className="version">{version}</div>
        </footer>
    );
}
