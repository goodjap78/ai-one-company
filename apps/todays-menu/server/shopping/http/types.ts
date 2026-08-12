export type ProxyHttpRequest = {
  method: string;
  pathname: string;
  headers: Record<string, string | undefined>;
  bodyRaw?: string;
  clientIp?: string;
};

export type ProxyHttpResponse = {
  status: number;
  headers: Record<string, string>;
  json?: unknown;
};
