import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db"; // your drizzle instance
import { phoneNumber, openAPI, admin, bearer } from "better-auth/plugins"
import { user, verification, account, session } from "../db/schema"

export const auth = betterAuth({
    advanced: {
        crossSubDomainCookies: {
            enabled: true,
            domain: ".westlakeaiforgood.com",
        },
        defaultCookieAttributes: {
            secure: true,
            httpOnly: true,
            sameSite: "none",
            partitioned: true,
        },
    },
    emailAndPassword: {
        enabled: true,
    },
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
        schema: {
            user: user,
            verification: verification,
            account: account,
            session: session,
        }
    }),
    plugins: [
        bearer(),
        openAPI(),
        admin(),
        phoneNumber({
            sendOTP: ({ phoneNumber, code }, request) => {
                // Implement sending OTP code via SMS
            }
        })
    ],
    trustedOrigins: ["http://localhost:3001", "https://westlakeaiforgood.com", "https://www.westlakeaiforgood.com"]
});