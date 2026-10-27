export default {
  id: "auth-sso",
  title: "Design Single Sign-On",
  difficulty: "medium",
  minutes: 13,
  tags: ["security", "api", "caching"],
  prompt: "A company with 40 internal and customer-facing apps wants one login for all of them. There are 10 million users, about 2,000 logins per second at peak, and every app request needs to know who the user is. Sessions should be revocable when an account is compromised.",
  requirements: {
    functional: [
      "Log in once and access all apps",
      "Support passwords and multi-factor auth",
      "Apps verify who the user is on each request",
      "Log out everywhere and revoke sessions"
    ],
    nonFunctional: ["Token checks add under 5 ms", "Passwords stored safely", "High availability, since every app depends on it"]
  },
  quiz: [
    {
      q: "How should passwords be stored?",
      choices: [
        "SHA-256 without salt",
        "Slow salted hash like bcrypt or Argon2",
        "Encrypted with a shared key",
        "Plain text in a secure DB"
      ],
      answer: 1,
      why: "A slow, salted hash makes stolen hashes expensive to crack.",
      tag: "security"
    },
    {
      q: "Apps get the user's identity via?",
      choices: [
        "Each app storing passwords",
        "Shared cookies across domains",
        "Username in the URL",
        "OAuth/OIDC code flow returning signed tokens"
      ],
      answer: 3,
      why: "Apps redirect to the identity provider and receive an ID token after login.",
      tag: "api"
    },
    {
      q: "Verifying access tokens without calling the IdP each time?",
      choices: [
        "Call the IdP database on each request",
        "Trust any token",
        "Check the JWT signature using cached public keys",
        "Decode it without checking"
      ],
      answer: 2,
      why: "Signed tokens can be checked locally; public keys are published and cached.",
      tag: "security"
    },
    {
      q: "JWTs can't be revoked easily. Mitigate with?",
      choices: [
        "Short-lived access tokens plus revocable refresh tokens",
        "Tokens that never expire",
        "Longer tokens",
        "Encrypting them twice"
      ],
      answer: 0,
      why: "Access tokens expire in minutes; revoking the refresh token ends the session soon.",
      tag: "security"
    },
    {
      q: "Brute-force attempts on login. Defense?",
      choices: [
        "Longer usernames",
        "Hide the login page",
        "Disable MFA",
        "Rate limit per account and IP, plus lockout or captcha"
      ],
      answer: 3,
      why: "Throttling and step-up checks make guessing impractical.",
      tag: "security"
    },
    {
      q: "The IdP goes down. Impact?",
      choices: [
        "All apps crash immediately",
        "Existing tokens keep working until expiry; new logins fail",
        "Nothing ever",
        "Passwords leak"
      ],
      answer: 1,
      why: "That's why the IdP must be highly available, and why local token checks help.",
      tag: "reliability"
    },
    {
      q: "Where to keep refresh tokens / sessions?",
      choices: ["A fast store with lookups by token hash and user", "In JWT claims", "In app logs", "In the CDN"],
      answer: 0,
      why: "Sessions must be looked up and deleted quickly to support revocation.",
      tag: "data-model"
    }
  ],
  diagram: {
    nodes: [
      { id: "user", label: "Browser", kind: "client", x: 180, y: 50 },
      { id: "app", label: "Some App", kind: "service", x: 180, y: 145 },
      { id: "idp", label: "Identity Prov", kind: "service", x: 180, y: 240 },
      { id: "users", label: "Users DB", kind: "db", x: 60, y: 335 },
      { id: "sess", label: "Session Store", kind: "cache", x: 180, y: 335 },
      { id: "mfa", label: "MFA / SMS", kind: "external", x: 300, y: 335 },
      { id: "jwks", label: "Public Keys", kind: "cdn", x: 180, y: 430 }
    ],
    edges: [
      { from: "user", to: "app" },
      { from: "app", to: "idp", label: "redirect" },
      { from: "user", to: "idp", label: "login" },
      { from: "idp", to: "users" },
      { from: "idp", to: "sess" },
      { from: "idp", to: "mfa" },
      { from: "app", to: "jwks", label: "verify" }
    ],
    steps: [
      {
        add: ["user", "app"],
        caption: "A user opens an app with no session, so the app redirects them to the identity provider."
      },
      { add: ["idp", "users", "mfa"], caption: "The IdP checks the password hash and a second factor." },
      {
        add: ["sess"],
        caption: "It creates a session and refresh token in a fast store, then returns a code the app swaps for tokens."
      },
      { add: ["jwks"], caption: "Apps verify access tokens locally with the IdP's published public keys." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "One login across 40 apps, MFA, fast per-request identity checks, revocation, high availability."
    },
    {
      heading: "Protocol",
      body: "OpenID Connect authorization code flow with PKCE. The IdP session cookie means the second app logs in without a prompt."
    },
    {
      heading: "Tokens",
      body: "Short-lived JWT access tokens (5–15 min) signed with rotating keys; apps verify locally. Refresh tokens are opaque, stored hashed in a session store, and revocable."
    },
    {
      heading: "Credentials",
      body: "Passwords hashed with Argon2 or bcrypt; MFA via TOTP, WebAuthn or SMS. Rate limit and lock out suspicious attempts."
    },
    {
      heading: "Availability",
      body: "Run the IdP in multiple zones with replicated user and session stores. Global logout deletes sessions and notifies apps."
    }
  ],
  keyPoints: [
    "Uses OIDC/OAuth code flow",
    "Stores passwords with a slow salted hash",
    "Verifies JWTs locally with cached keys",
    "Uses short access tokens and revocable refresh tokens",
    "Supports MFA",
    "Rate limits login attempts",
    "Makes the IdP highly available"
  ],
  cardIds: ["oauth2", "jwt", "token-bucket"]
};
