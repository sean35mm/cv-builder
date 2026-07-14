const authConfig = {
  providers: [
    {
      // Convex HTTP-actions site URL (the auth issuer), not the Next.js app URL.
      domain: process.env.CONVEX_SITE_URL,
      applicationID: 'convex',
    },
  ],
};

export default authConfig;
