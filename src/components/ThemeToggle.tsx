import { MoonIcon, SunIcon } from '../icons';
import useTheme from '../hooks/useTheme';
import clsx from '../utils/clsx';

export default function ThemeToggle({ floating = false }: { floating?: boolean }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            className={clsx('theme-toggle', floating && 'theme-toggle--floating')}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
    );
}
