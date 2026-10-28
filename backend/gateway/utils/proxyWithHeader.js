import proxy from "express-http-proxy";

export const proxyWithHeader = (serviceUrl) => {
  return proxy(serviceUrl, {
    // Forward multipart uploads as a stream. Do not buffer/parse the upload
    // in the gateway before the agent's Multer handler receives it.
    parseReqBody: false,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      if (srcReq.user) {
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
      }
      return proxyReqOpts;
    },
  });
};
