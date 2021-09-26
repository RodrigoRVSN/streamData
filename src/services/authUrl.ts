import { makeRedirectUri } from "expo-auth-session";
import { generateRandom } from "expo-auth-session/build/PKCE";

export const twitchEndpoints = {
  authorization: "https://id.twitch.tv/oauth2/authorize",
  revocation: "https://id.twitch.tv/oauth2/revoke",
};

const { CLIENT_ID } = process.env;

const REDIRECT_URI = makeRedirectUri({ useProxy: true });
const RESPONSE_TYPE = "token";
const SCOPE = encodeURI("openid user:read:email user:read:follows");
const FORCE_VERIFY = true;
export const STATE = generateRandom(30);

export const authUrl =
  twitchEndpoints.authorization +
  `?client_id=${CLIENT_ID}` +
  `&redirect_uri=${REDIRECT_URI}` +
  `&response_type=${RESPONSE_TYPE}` +
  `&scope=${SCOPE}` +
  `&force_verify=${FORCE_VERIFY}` +
  `&state=${STATE}`;
