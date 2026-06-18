import React, { useEffect, useRef, useState } from "react";
import { getDefaultAuth } from "trustflows-client";
import { requestAccessBulk } from "./accessRequestService";
import "./App.css";

export default function App() {
    const auth = getDefaultAuth();

    // ✅ login state
    const [loggedIn, setLoggedIn] = useState(false);
    const [webId, setWebId] = useState(null); // ✅ NEW

    const [input, setInput] = useState("");
    const [issuer, setIssuer] = useState(
        localStorage.getItem("issuer") || "http://localhost:3000/"
    );
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const redirectHandled = useRef(false);

    // ✅ handle login redirect
    useEffect(() => {
        if (redirectHandled.current) return;
        redirectHandled.current = true;

        (async () => {
            try {
                if (window.location.href.includes("code=")) {
                    await auth.handleIncomingRedirect();

                    setLoggedIn(true);
                    setWebId(auth.webId || null); // ✅ capture WebID
                } else {
                    setLoggedIn(false);
                    setWebId(null);
                }
            } catch (e) {
                console.warn("Redirect error:", e);
                setLoggedIn(false);
                setWebId(null);
            }
        })();
    }, []);

    // ✅ detect existing session (important!)
    useEffect(() => {
        if (auth.isLoggedIn) {
            setLoggedIn(true);
            setWebId(auth.webId || null);
        }
    }, []);

    // ✅ login
    const login = async () => {
        try {
            console.log("Attempting login with issuer:", issuer);

            localStorage.setItem("issuer", issuer);

            await auth.login(
                issuer,
                "http://localhost:5174/client-id.jsonld",
                "http://localhost:5174"
            );
        } catch (e) {
            console.error("Login failed:", e);
        }
    };

    // ✅ logout
    const logout = async () => {
        try {
            await auth.logout();
            setLoggedIn(false);
            setWebId(null); // ✅ clear WebID
        } catch (e) {
            console.error("Logout failed:", e);
        }
    };

    // ✅ access request
    const handleRequest = async () => {
        const urls = input
            .split("\n")
            .map(u => u.trim())
            .filter(u => u !== "");

        setLoading(true);
        const res = await requestAccessBulk(urls);
        setResults(res);
        setLoading(false);
    };

    return (
        <div className="container">
            <h1>TrustFlows Access Tool</h1>

            {/* ✅ GLOBAL LOGIN DISPLAY */}
            <div
                style={{
                    marginBottom: "15px",
                    padding: "10px",
                    borderRadius: "6px",
                    background: loggedIn ? "#e6ffed" : "#ffecec"
                }}
            >
                <p>
                    <strong>Status:</strong>{" "}
                    {loggedIn ? "✅ Logged in" : "🔒 Not logged in"}
                </p>

                {loggedIn && (
                    <p>
                        <strong>WebID:</strong>{" "}
                        <span style={{ fontFamily: "monospace" }}>
                            {webId || "(unknown)"}
                        </span>
                    </p>
                )}
            </div>

            {/* ✅ ISSUER */}
            <div className="section">
                <label>OIDC Issuer:</label>
                <input
                    type="text"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    style={{ width: "100%" }}
                />
            </div>

            {/* ✅ LOGIN / LOGOUT */}
            {!loggedIn ? (
                <button onClick={login}>Login</button>
            ) : (
                <button onClick={logout}>Logout</button>
            )}

            {/* ✅ URL INPUT */}
            <div className="section">
                <textarea
                    rows={6}
                    placeholder="Enter one URL per line"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
            </div>

            {/* ✅ ACTION */}
            <button onClick={handleRequest} disabled={!loggedIn || loading}>
                {loading ? "Requesting..." : "Request Access"}
            </button>

            {/* ✅ RESULTS */}
            <div className="section">
                <h2>Results</h2>

                {results.map((r) => (
                    <div
                        key={r.url}
                        style={{
                            border: "1px solid #ccc",
                            padding: "10px",
                            marginBottom: "10px",
                            borderRadius: "6px"
                        }}
                    >
                        <p><strong>URL:</strong> {r.url}</p>
                        <p><strong>Status:</strong> {r.status}</p>

                        <details style={{ marginTop: "10px" }}>
                            <summary style={{ cursor: "pointer" }}>
                                Show response body
                            </summary>

                            <pre
                                style={{
                                    background: "#f5f5f5",
                                    padding: "10px",
                                    marginTop: "10px",
                                    maxHeight: "200px",
                                    overflow: "auto",
                                    whiteSpace: "pre-wrap",
                                    borderRadius: "6px"
                                }}
                            >
                                {r.body || "(empty response)"}
                            </pre>
                        </details>
                    </div>
                ))}
            </div>
        </div>
    );
}

