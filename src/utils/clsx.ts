export default function clsx(...all: any[]) {
    return all
        .filter((className) => typeof className === 'string')
        .flatMap((className) => className.split(' '))
        .join(' ');
}
