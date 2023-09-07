export function sortBy(getValue: (obj: Record<string, any>) => any) {
    return (a: Record<string, any>, b: Record<string, any>) => (getValue(a) > getValue(b) ? 1 : -1);
}
