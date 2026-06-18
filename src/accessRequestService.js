import { getDefaultAuth } from "trustflows-client";

export async function requestAccess(url) {
    const auth = getDefaultAuth();

    if (!auth.isLoggedIn) {
        return { url, status: "not_logged_in" };
    }

    const fetch = auth.createAuthFetch();

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "text/turtle,*/*"
            }}, { accessRequest: true }
        );

        let bodyText = "";

        try {
            if (response.body) {
                bodyText = await response.text();
            } else {
                bodyText = "(no response body available)";
            }
        } catch (e) {
            bodyText = "(error reading body: " + e.message + ")";
        }

        return { url, status: response.status, body: bodyText };
    } catch (err) {
        return { url, status: "error", error: err.message };
    }
}

export async function requestAccessBulk(urls) {
    const results = [];

    for (const url of urls) {
        results.push(await requestAccess(url));
    }

    return results;
}