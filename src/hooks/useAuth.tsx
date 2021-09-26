import { revokeAsync, startAsync } from "expo-auth-session";
import React, {
  useEffect,
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

import { api } from "../services/api";
import { authUrl, STATE, twitchEndpoints } from "../services/authUrl";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: number;
  display_name: string;
  email: string;
  profile_image_url: string;
}

interface AuthContextData {
  user: User;
  isLoggingOut: boolean;
  isLoggingIn: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

interface AuthProviderData {
  children: ReactNode;
}

const AuthContext = createContext({} as AuthContextData);

function AuthProvider({ children }: AuthProviderData) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [user, setUser] = useState({} as User);
  const [userToken, setUserToken] = useState("");
  const { CLIENT_ID } = process.env;
  const storageUserKey = "stream.data:user";
  const storageTokenKey = "stream.data:token";

  async function signIn() {
    try {
      setIsLoggingIn(true);
      const response = await startAsync({
        authUrl,
      });

      if (
        response.type === "success" &&
        response.params.error !== "access_denied"
      ) {
        if (response.params.state !== STATE) {
          throw new Error("Invalid state value");
        }
        api.defaults.headers.authorization = `Bearer ${response.params.access_token}`;
        const userResponse = await api.get("/users");

        const userLogged = {
          id: userResponse.data.data[0].id,
          display_name: userResponse.data.data[0].display_name,
          email: userResponse.data.data[0].email,
          profile_image_url: userResponse.data.data[0].profile_image_url,
        };
        const accessToken = response.params.access_token;
        setUser(userLogged);
        setUserToken(accessToken);
        await AsyncStorage.setItem(storageUserKey, JSON.stringify(userLogged));
        await AsyncStorage.setItem(
          storageTokenKey,
          JSON.stringify(accessToken)
        );
      }
    } catch (error) {
      throw new Error("Erro ao fazer login na twitch.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function signOut() {
    try {
      setIsLoggingOut(true);
      await revokeAsync(
        { token: userToken, clientId: CLIENT_ID },
        { revocationEndpoint: twitchEndpoints.revocation }
      );
    } catch (error) {
      throw new Error("Erro ao fazer logout na twitch.");
    } finally {
      setUser({} as User);
      setUserToken("");
      delete api.defaults.headers.authorization;
      AsyncStorage.removeItem(storageUserKey);
      AsyncStorage.removeItem(storageTokenKey);
      setIsLoggingOut(false);
    }
  }

  async function loadData() {
    const userData = await AsyncStorage.getItem(storageUserKey);
    const tokenData = await AsyncStorage.getItem(storageTokenKey);
    
    if (userData && tokenData) {
      const user = JSON.parse(userData);
      const token = JSON.parse(tokenData);
      setUser(user);
      setUserToken(token);
      api.defaults.headers.authorization = `Bearer ${token}`;
    }
  }

  useEffect(() => {
    api.defaults.headers["Client-Id"] = CLIENT_ID;
    loadData();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoggingOut, isLoggingIn, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);

  return context;
}

export { AuthProvider, useAuth };
