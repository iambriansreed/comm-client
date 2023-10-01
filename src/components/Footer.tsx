import { HeartIcon } from '../icons';

export default function Footer() {
    return (
        <footer className="credits">
            <div>
                Made with
                <HeartIcon />
                by <a href="https://iambrian.com">Brian</a>
            </div>
            <div className="version">0.1.2</div>
        </footer>
    );
}
