import * as React from "react"
export function useOutsideClick<T extends HTMLElement = HTMLElement>(callback: () => void) {
    const ref = React.useRef<T>(null);

    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                callback();
            }
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            }
        };
    }, [callback]);
    return ref;
}