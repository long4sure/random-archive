/** Resolves asset and page URLs for root vs erp/pos/crm/admin subfolders */
(function () {
  const SUBMODULES = ["erp", "pos", "crm", "admin"];

  function isInSubmodule() {
    const path = location.pathname.replace(/\\/g, "/");
    const href = location.href.replace(/\\/g, "/");
    return SUBMODULES.some(
      (m) =>
        path.includes(`/${m}/`) ||
        path.endsWith(`/${m}`) ||
        href.includes(`/${m}/`) ||
        href.includes(`/${m}/index.html`)
    );
  }

  const root = isInSubmodule() ? ".." : ".";
  window.APP_ROOT = root;

  window.appUrl = function (path) {
    path = String(path).replace(/^\//, "");
    return root === "." ? path : `${root}/${path}`;
  };
})();
