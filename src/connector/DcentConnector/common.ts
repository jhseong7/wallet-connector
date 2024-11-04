const getDcentLink = (baseUrl: string, chainName: string) =>
  `https://link.dcentwallet.com/DAppBrowser/?url=${encodeURIComponent(
    baseUrl
  )}&network=${chainName}`;

export { getDcentLink };
