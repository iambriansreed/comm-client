export default function showToast(id: string) {
    const toast = document.getElementById(id);

    if (toast) {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}
