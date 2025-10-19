const GITHUB_REPO_ROOT = "https://github.com/most-want-tech/doomer-tune-machine";

export const APP_VERSION = typeof __APP_VERSION__ === "string" && __APP_VERSION__ ? __APP_VERSION__ : "0.0.0";
export const APP_GIT_SHA = typeof __APP_GIT_SHA__ === "string" ? __APP_GIT_SHA__ : "";
export const APP_GIT_SHORT_SHA = APP_GIT_SHA ? APP_GIT_SHA.slice(0, 7) : "";
export const APP_RELEASES_URL = `${GITHUB_REPO_ROOT}/releases`;

const hasGitMetadata = Boolean(APP_GIT_SHA);
const releaseTarget = hasGitMetadata && APP_VERSION ? `${APP_RELEASES_URL}/tag/v${APP_VERSION}` : APP_RELEASES_URL;

export const APP_RELEASE_TAG_URL = releaseTarget;
export const APP_COMMIT_URL = hasGitMetadata ? `${GITHUB_REPO_ROOT}/commit/${APP_GIT_SHA}` : `${GITHUB_REPO_ROOT}/commits/dev`;
export const APP_BUILD_LABEL = APP_GIT_SHORT_SHA ? `${APP_VERSION}+${APP_GIT_SHORT_SHA}` : APP_VERSION;
