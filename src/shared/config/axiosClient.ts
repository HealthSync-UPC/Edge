import axios, { AxiosRequestConfig } from 'axios';
import { env } from './environment';
import { ensureToken } from '../../auth/application/auth.service';

type CloudStatus = {
  reachable: boolean;
  lastStatus: number | null;
  lastAttemptAt: string | null;
};

export const cloudStatus: CloudStatus = {
  reachable: false,
  lastStatus: null,
  lastAttemptAt: null,
};

const instance = axios.create({
  baseURL: env.CLOUD_BASE_URL || undefined,
  timeout: 5000,
});

instance.interceptors.request.use(async (cfg) => {
  const token = await ensureToken();
  if (token) {
    cfg.headers = cfg.headers || {};
    cfg.headers['Authorization'] = `Bearer ${token}`;
  }
  return cfg;
});

export async function postToCloud(path: string, body: any, options?: AxiosRequestConfig) {
  try {
    const res = await instance.post(path, body, options);
    cloudStatus.reachable = true;
    cloudStatus.lastStatus = res.status;
    cloudStatus.lastAttemptAt = new Date().toISOString();
    return res;
  } catch (err: any) {
    const status = err?.response?.status ?? null;
    cloudStatus.reachable = false;
    cloudStatus.lastStatus = status;
    cloudStatus.lastAttemptAt = new Date().toISOString();
    throw err;
  }
}

export async function headCloudRoot() {
  const base = env.CLOUD_BASE_URL?.replace('/api/v1', '') ?? '';
  const url = `${base}/swagger-ui/index.html`;

  try {
    const res = await axios.head(url);
    cloudStatus.reachable = true;
    cloudStatus.lastStatus = res.status;
    cloudStatus.lastAttemptAt = new Date().toISOString();
    return res;
  } catch (err: any) {
    cloudStatus.reachable = false;
    cloudStatus.lastStatus = err?.response?.status ?? null;
    cloudStatus.lastAttemptAt = new Date().toISOString();
    throw err;
  }
}


export default instance;
