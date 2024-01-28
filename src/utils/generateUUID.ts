export default function generateUUID() {
    return crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).substring(2);
}
