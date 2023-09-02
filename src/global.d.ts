export {};

declare global {
    type Form<
        TElements = {
            [key: string]: HTMLInputElement;
        }
    > = EventTarget & HTMLFormElement & TElements;
}
