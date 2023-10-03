import { HeartIcon } from '../icons';
import version from '../version';

export default function Footer() {
    return (
        <footer className="credits">
            <div>
                Made with
                <HeartIcon />
                by <a href="https://iambrian.com">Brian</a>
            </div>
            <div className="version">{version}</div>
        </footer>
    );
}
