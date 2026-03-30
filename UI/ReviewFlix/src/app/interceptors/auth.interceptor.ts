import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

function shouldSendCredentials(requestUrl: string, apiUrl: string): boolean {
  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    return requestUrl.startsWith(apiUrl);
  }
  try {
    const path = new URL(requestUrl).pathname;
    return path.startsWith(apiUrl);
  } catch {
    return false;
  }
}

/** HttpOnly JWT в куке: браузер сам отправит её при withCredentials. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!shouldSendCredentials(req.url, environment.apiUrl)) {
    return next(req);
  }
  return next(req.clone({ withCredentials: true }));
};
