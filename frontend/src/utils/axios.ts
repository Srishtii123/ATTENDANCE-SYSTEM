import axios, { AxiosRequestHeaders, InternalAxiosRequestConfig } from 'axios';
import rawAxios from 'axios';
import { getAccessToken } from './functions';

const DEFAULT_API = process.env.REACT_APP_API_URL || 'http://localhost:3500' || window.location.origin;
const axiosServices = axios.create({ baseURL: DEFAULT_API, withCredentials: true });
console.log('AXIOS BASE URL:', axiosServices.defaults.baseURL);
type TAxiosRequestHeadersWithCoords = {
  'x-longitude': string;
  'x-latitude': string;
} & AxiosRequestHeaders;

interface ICustomAxiosRequestConfig extends InternalAxiosRequestConfig<any> {
  locationNeeded?: boolean;
  serviceToken?: string;
}

// ==============================|| AXIOS - FOR MOCK SERVICES ||============================== //
axiosServices.interceptors.request.use(
  async (config: ICustomAxiosRequestConfig) => {
    let additionalHeaders = {};
    if (config.serviceToken) {
      additionalHeaders = {
        Authorization: `Bearer ${config.serviceToken}`
      };
    }

    config.headers = {
      ...config.headers,
      Authorization: !config.serviceToken ? `Bearer ${getAccessToken()}` : `Bearer ${config.serviceToken}`,
      ...additionalHeaders
    } as AxiosRequestHeaders & TAxiosRequestHeadersWithCoords;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
axiosServices.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;
    // Network error (no internet) — don't logout, show offline screen
    if (!error.response) {
      try {
        window.localStorage.setItem('connection_lost', 'true');
      } catch (e) {}
      window.dispatchEvent(new Event('connection_lost'));
      return Promise.reject('Network unavailable');
    }

    // attempt refresh once on 401
    if (status === 401 && !originalRequest?._retry && !window.location.href.includes('/login')) {
      originalRequest._retry = true;
      return rawAxios
        .post(`${DEFAULT_API}/auth/refresh`, {}, { withCredentials: true })
        .then((refreshRes) => {
          const newToken = refreshRes?.data?.data?.token;
          if (newToken) {
            window.localStorage.setItem('serviceToken', newToken);
            axiosServices.defaults.headers.common.Authorization = `Bearer ${newToken}`;
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosServices(originalRequest);
          }
          // Keep the saved session in place. Manual logout is the only place that clears it.
          return Promise.reject((error.response && error.response.data) || 'Wrong Services');
        })
        .catch((e) => {
          // Network error during refresh — don't logout, notify offline
          if (!e.response) {
            try {
              window.localStorage.setItem('connection_lost', 'true');
            } catch (err) {}
            window.dispatchEvent(new Event('connection_lost'));
            return Promise.reject('Network unavailable');
          }
          return Promise.reject((e.response && e.response.data) || e);
        });
    }
    return Promise.reject((error.response && error.response.data) || 'Wrong Services');
  }
);

export default axiosServices;
