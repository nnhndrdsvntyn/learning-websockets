export function validateUsername(username) {
    if (username.length > 15 || username.length === 0) {
        return false;
    } else {
        return true;
    }
}