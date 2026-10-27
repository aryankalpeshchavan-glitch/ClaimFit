import React, { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { transitionRoute } from "./motion/viewTransition";

export interface Route {
  name: "landing" | "checker" | "review" | "examples";
  reviewId?: string;
  exampleId?: string;
  notFound?: boolean;
  path: string;
}

export function parseRoute(pathWithQuery: string): Route {
  const [pathname, search = ""] = pathWithQuery.split("?");
  const params = new URLSearchParams(search);
  const exampleId = params.get("example") || undefined;

  if (pathname === "" || pathname === "/") {
    return { name: "landing", exampleId, path: pathWithQuery };
  }
  if (pathname === "/check") {
    return { name: "checker", exampleId, path: pathWithQuery };
  }
  if (pathname === "/examples") {
    return { name: "examples", exampleId, path: pathWithQuery };
  }
  if (pathname.startsWith("/r/")) {
    const id = pathname.slice(3).trim();
    if (id) {
      return { name: "review", reviewId: id, exampleId, path: pathWithQuery };
    }
  }

  return { name: "landing", notFound: true, exampleId, path: pathWithQuery };
}

export function getCurrentRoute(): Route {
  if (typeof window === "undefined") {
    return { name: "landing", path: "/" };
  }
  return parseRoute(window.location.pathname + window.location.search);
}

const listeners = new Set<() => void>();

export function navigate(to: string, options: { replace?: boolean; scroll?: boolean } = {}): void {
  if (typeof window === "undefined") return;

  transitionRoute(() => {
    if (options.replace) {
      window.history.replaceState(null, "", to);
    } else {
      window.history.pushState(null, "", to);
    }
    listeners.forEach((fn) => fn());
    if (options.scroll !== false) {
      const hash = to.includes("#") ? to.split("#")[1] : "";
      if (hash) {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          return;
        }
      }
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  });
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(getCurrentRoute);

  useEffect(() => {
    const onPop = () => {
      setRoute(getCurrentRoute());
    };
    listeners.add(onPop);
    window.addEventListener("popstate", onPop);
    return () => {
      listeners.delete(onPop);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  return route;
}

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
  prefetch?: () => void;
  className?: string;
  replace?: boolean;
}

export function Link({ href, children, prefetch, replace, onClick, onMouseEnter, onFocus, ...rest }: LinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.altKey ||
      e.ctrlKey ||
      e.shiftKey ||
      rest.target === "_blank" ||
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:")
    ) {
      return;
    }
    e.preventDefault();
    navigate(href, { replace });
  };

  const handlePrefetch = () => {
    prefetch?.();
  };

  return React.createElement(
    "a",
    {
      href,
      onClick: handleClick,
      onMouseEnter: (e: MouseEvent<HTMLAnchorElement>) => {
        handlePrefetch();
        onMouseEnter?.(e);
      },
      onFocus: (e: React.FocusEvent<HTMLAnchorElement>) => {
        handlePrefetch();
        onFocus?.(e);
      },
      ...rest,
    },
    children
  );
}
