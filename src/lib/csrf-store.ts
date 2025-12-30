let csrfToken: string = "";

export function setCsrfToken(token: string) {
	csrfToken = token;
}

export function getCsrfToken() {
	return csrfToken;
}
