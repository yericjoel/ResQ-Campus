import { useEffect, useState } from 'react';
import api from '../services/api';

/**
 * Uploaded files are only served to signed-in users, so <img src> cannot fetch them directly
 * (it would not send the JWT). This loads the image with the token and shows it from a blob URL.
 */
export default function AuthImage({ src, alt = '', className, fallback = null, onClick }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!src) return undefined;
    let objectUrl;
    let cancelled = false;
    setFailed(false);
    api
      .get(src, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!src || failed || !url) return fallback;
  return <img src={url} alt={alt} className={className} onClick={onClick} />;
}
