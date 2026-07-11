import { useEffect, useState } from "react";
import { api } from "../utils/api.js";

export function usePublicBootstrap() {
  const [data, setData] = useState({ services: [], dentists: [], rooms: [], reviews: [], clinic: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    api
      .get("/bootstrap")
      .then((res) => {
        if (!isMounted) return;
        setData({
          services: res.data.services || [],
          dentists: res.data.dentists || [],
          rooms: res.data.rooms || [],
          reviews: res.data.reviews || [],
          clinic: res.data.clinic || {}
        });
      })
      .catch(() => {
        if (isMounted) setData({ services: [], dentists: [], rooms: [], reviews: [], clinic: {} });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { ...data, loading };
}
