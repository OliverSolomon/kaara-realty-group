"use client";

import { useEffect } from "react";

/**
 * Removes the old video-caching service worker from visitors' browsers.
 *
 * It broke video playback on iPhone and could serve stale files after a
 * deploy. Nothing is registered any more; any existing registration and its
 * caches are cleared. public/sw.js is a self-destroying stub that does the
 * same for browsers that update the worker before this code runs.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((r) => r.unregister())))
      .catch(() => {});

    if ("caches" in window) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .catch(() => {});
    }
  }, []);

  return null;
}
