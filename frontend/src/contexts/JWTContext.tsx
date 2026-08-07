import React, { createContext, useEffect, useReducer } from 'react';
import { Chance } from 'chance';
import jwtDecode from 'jwt-decode';
import { LOGIN, LOGOUT } from 'store/reducers/actions';
import authReducer from 'store/reducers/auth';

// project import
import Loader from 'components/Loader';
import { AuthProps, JWTContextType, UserProfile } from 'types/auth';
import { KeyedObject } from 'types/root';
import { default as axios } from 'utils/axios';
import AuthServicesInstance from 'service/service.auth';
import useConfig from 'hooks/useConfig';
import { ThemeDirection } from 'types/config';

const chance = new Chance();

// constant
const initialState: AuthProps = {
  isLoggedIn: false,
  isInitialized: false,
  user: null,
  user_permission: {},
  permissions: {},
  permissionBasedMenuTree: []
};

const verifyToken: (st: string) => boolean = (serviceToken) => {
  if (!serviceToken) {
    return false;
  }
  try {
    jwtDecode(serviceToken);
    return true;
  } catch (e) {
    return false;
  }
};

const setSession = (serviceToken?: string | null) => {
  if (serviceToken) {
    localStorage.setItem('serviceToken', serviceToken);
    axios.defaults.headers.common.Authorization = `Bearer ${serviceToken}`;
  } else {
    localStorage.removeItem('serviceToken');
    delete axios.defaults.headers.common.Authorization;
  }
};

const normalizeUserData = (user: any): UserProfile => {
  return {
    company_code: user.COMPANY_CODE || user.company_code || '',
    loginid: user.LOGINID || user.loginid || '',
    username: user.USERNAME || user.username || '',
    email_id: user.EMAIL_ID || user.email_id || '',
    contact_name: user.CONTACT_NAME || user.contact_name || '',
    contact_no: user.CONTACT_NO || user.contact_no || '',
    contact_email: user.CONTACT_EMAIL || user.contact_email || '',
    status: user.STATUS || user.status || '',
    active_flag: user.ACTIVE_FLAG || user.active_flag || '',
    lang_pref: user.LANG_PREF || user.lang_pref || 'en',
    no_of_days: user.NO_OF_DAYS || user.no_of_days || 0,
    id: user.ID || user.id,
    created_at: user.CREATED_AT || user.created_at,
    updated_at: user.UPDATED_AT || user.updated_at,
    created_by: user.CREATED_BY || user.created_by,
    updated_by: user.UPDATED_BY || user.updated_by,
    APPLICATION: user.APPLICATION || user.application,
    Company: user.Company
  };
};

// ==============================|| JWT CONTEXT & PROVIDER ||============================== //

const JWTContext = createContext<JWTContextType | null>(null);

export const JWTProvider = ({ children }: { children: React.ReactElement }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { onChangeLocalization, onChangeDirection } = useConfig();

  const ChangeDirection = (language: string) => {
    onChangeLocalization(language as string);
    if (language === 'ar') {
      onChangeDirection(ThemeDirection.RTL);
      return;
    }
    onChangeDirection(ThemeDirection.LTR);
  };

  const login = async (email: string, password: string) => {
    try {
      localStorage.removeItem('saved_password');
      localStorage.removeItem('connection_lost');
    } catch (e) {
      // ignore storage errors
    }

    const response = await axios.post('/auth/login', { email, password }, { withCredentials: true });
    const { token, tenantId } = response.data.data;
    setSession(token);

    // Decode token to get tenantId if not provided directly
    let decodedTenantId = tenantId;
    if (!decodedTenantId) {
      const decoded: KeyedObject = jwtDecode(token);
      decodedTenantId = decoded.tenantId;
    }

    const meData = await AuthServicesInstance.getMe();

    if (meData?.success) {
      const { user, permissions, user_permission, permissionBasedMenuTree } = meData?.data;

      const normalizedUser = normalizeUserData(user);
      ChangeDirection(normalizedUser.lang_pref ?? 'en');
      try {
        if (normalizedUser.company_code) {
          window.localStorage.setItem('company_code', normalizedUser.company_code);
        }
      } catch (e) {
        // ignore storage errors
      }

      const userWithTenant = {
        ...normalizedUser,
        tenantId: decodedTenantId
      } as UserProfile;

      dispatch({
        type: LOGIN,
        payload: {
          isLoggedIn: true,
          user: userWithTenant,
          permissions,
          user_permission,
          permissionBasedMenuTree
        }
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const serviceToken = window.localStorage.getItem('serviceToken');
        let tokenToUse = serviceToken;

        // If no token or token expired, try refresh endpoint (cookie-based)
        if (!serviceToken || !verifyToken(serviceToken)) {
          try {
            const refreshRes = await axios.post('/auth/refresh', {}, { withCredentials: true });
            tokenToUse = refreshRes?.data?.data?.token;
            if (tokenToUse) {
              window.localStorage.setItem('serviceToken', tokenToUse);
            }
          } catch (e: any) {
            if (!e?.response) {
              window.localStorage.setItem('connection_lost', 'true');
            }

            dispatch({ type: LOGOUT });
            return;
          }
        }

        if (tokenToUse) {
          setSession(tokenToUse);
          const meData = await AuthServicesInstance.getMe();

          if (meData?.success) {
            const { user, permissions, user_permission, permissionBasedMenuTree } = meData?.data;

            const normalizedUser = normalizeUserData(user);
            ChangeDirection(normalizedUser.lang_pref ?? 'en');

            try {
              if (normalizedUser.company_code) {
                window.localStorage.setItem('company_code', normalizedUser.company_code);
              }
            } catch (e) {
              // ignore storage errors
            }

            const decoded: KeyedObject = jwtDecode(tokenToUse);
            const tenantId = decoded.tenantId;

            const userWithTenant = {
              ...normalizedUser,
              tenantId: tenantId
            } as UserProfile;

            dispatch({
              type: LOGIN,
              payload: {
                isLoggedIn: true,
                user: userWithTenant,
                permissions,
                user_permission,
                permissionBasedMenuTree
              }
            });
          }
        }
      } catch (err) {
        console.error(err);
        dispatch({
          type: LOGOUT
        });
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    const id = chance.bb_pin();
    const response = await axios.post('/register', {
      id,
      email,
      password,
      firstName,
      lastName
    });
    let users = response.data;

    if (window.localStorage.getItem('users') !== undefined && window.localStorage.getItem('users') !== null) {
      const localUsers = window.localStorage.getItem('users');
      users = [
        ...JSON.parse(localUsers!),
        {
          id,
          email,
          password,
          name: `${firstName} ${lastName}`
        }
      ];
    }

    window.localStorage.setItem('users', JSON.stringify(users));
  };

  const logout = () => {
    try {
      window.localStorage.removeItem('company_code');
    } catch (e) {}
    try {
      axios.post('/auth/logout', {}, { withCredentials: true }).catch(() => {});
    } catch (e) {}
    setSession(null);
    dispatch({ type: LOGOUT });
  };

  const resetPassword = async (email: string) => {};

  const updateProfile = () => {};

  if (state.isInitialized !== undefined && !state.isInitialized) {
    return <Loader />;
  }

  return <JWTContext.Provider value={{ ...state, login, logout, register, resetPassword, updateProfile }}>{children}</JWTContext.Provider>;
};

export default JWTContext;
