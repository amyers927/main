import * as React from "react";

type Popup = {
  id: number;
  gif: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

const AD_GIFS = [
  "/images/ad1.gif",
  "/images/ad2.gif",
  "/images/ad3.gif",
  "/images/ad4.gif",
  "/images/ad5.gif",
  "/images/ad6.gif",
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function loadImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || 220,
        height: img.naturalHeight || 132,
      });
    };
    img.onerror = () => {
      resolve({ width: 220, height: 132 });
    };
    img.src = src;
  });
}

export function RetroPopups() {
  const [popups, setPopups] = React.useState<Popup[]>([]);
  const nextId = React.useRef(1);
  const dragRef = React.useRef<{
    id: number;
    startX: number;
    startY: number;
    originLeft: number;
    originTop: number;
    width: number;
    totalHeight: number;
  } | null>(null);

  React.useEffect(() => {
    let active = true;
    const timers: number[] = [];
    const isMobile = window.innerWidth < 640;
    const gifs = isMobile
      ? AD_GIFS.filter((gif) => !gif.endsWith("/ad1.gif") && !gif.endsWith("/ad6.gif"))
      : AD_GIFS;

    gifs.forEach((gif, index) => {
      const t = window.setTimeout(async () => {
        const { width: rawWidth, height: rawHeight } = await loadImageSize(gif);
        if (!active) return;
        const maxPopupWidth = Math.max(120, window.innerWidth - 16);
        const width = Math.min(rawWidth, maxPopupWidth);
        const height = Math.round((rawHeight / rawWidth) * width);

        const popupChromeHeight = 30;
        const popupTotalHeight = height + popupChromeHeight;
        const maxLeft = Math.max(0, Math.floor(window.innerWidth - width - 8));
        const maxTop = Math.max(0, Math.floor(window.innerHeight - popupTotalHeight - 8));

        const popup: Popup = {
          id: nextId.current++,
          gif,
          width,
          height,
          left: randInt(0, maxLeft),
          top: randInt(0, maxTop),
        };

        setPopups((current) => [...current, popup]);
      }, index * 450);
      timers.push(t);
    });

    return () => {
      active = false;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  function closePopup(id: number) {
    setPopups((current) => current.filter((p) => p.id !== id));
  }

  const onPointerMove = React.useCallback((event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    const maxLeft = Math.max(0, Math.floor(window.innerWidth - drag.width - 8));
    const maxTop = Math.max(0, Math.floor(window.innerHeight - drag.totalHeight - 8));

    const left = Math.max(0, Math.min(maxLeft, drag.originLeft + dx));
    const top = Math.max(0, Math.min(maxTop, drag.originTop + dy));

    setPopups((current) =>
      current.map((popup) =>
        popup.id === drag.id ? { ...popup, left, top } : popup,
      ),
    );
  }, []);

  const endDrag = React.useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    document.body.style.userSelect = "";
  }, []);

  React.useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [endDrag, onPointerMove]);

  function startDrag(event: React.PointerEvent<HTMLElement>, popup: Popup) {
    if (event.button !== 0 && event.pointerType !== "touch") return;

    dragRef.current = {
      id: popup.id,
      startX: event.clientX,
      startY: event.clientY,
      originLeft: popup.left,
      originTop: popup.top,
      width: popup.width,
      totalHeight: popup.height + 30,
    };

    document.body.style.userSelect = "none";
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {popups.map((popup) => (
        <article
          key={popup.id}
          className="pointer-events-auto absolute rounded-md border border-black/35 bg-[#efefef] shadow-[0_10px_28px_rgba(0,0,0,0.35)]"
          style={{ left: popup.left, top: popup.top, width: popup.width }}
        >
          <header
            className="flex cursor-move touch-none select-none items-center justify-between bg-[#cc0033] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white"
            onPointerDown={(event) => startDrag(event, popup)}
          >
            <span>WARNING ⚠️</span>
            <button
              type="button"
              aria-label="Close ad"
              onClick={() => closePopup(popup.id)}
              onPointerDown={(event) => event.stopPropagation()}
              className="h-4 w-4 rounded-sm border border-white/60 bg-white/20 leading-none"
            >
              X
            </button>
          </header>
          <img
            src={popup.gif}
            alt="Retro popup ad"
            className="block"
            width={popup.width}
            height={popup.height}
            loading="lazy"
          />
          <footer className="px-2 py-1 text-[10px] font-bold text-black/70">
            CLICK NOW!!! LIMITED TIME!!!
          </footer>
        </article>
      ))}
    </div>
  );
}
