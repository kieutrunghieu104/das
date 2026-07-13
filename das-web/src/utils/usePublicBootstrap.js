import { useEffect, useState } from "react";
import { api } from "../utils/api.js";

const EMPTY_BOOTSTRAP_DATA = { services: [], dentists: [], rooms: [], reviews: [], slots: [], clinic: {} };

export function usePublicBootstrap() {
  const [data, setData] = useState(EMPTY_BOOTSTRAP_DATA);
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
          slots: res.data.slots || [],
          clinic: res.data.clinic || {}
        });
      })
      .catch(() => {
        if (isMounted) setData(EMPTY_BOOTSTRAP_DATA);
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
