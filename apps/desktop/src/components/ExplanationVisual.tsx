import { useEffect, useRef, useId } from 'react';
import mermaid from 'mermaid';

export type RendererVisualPayload =
  | { kind: 'svg'; svg: string }
  | { kind: 'image'; mimeType: string; base64: string }
  | { kind: 'mermaid'; source: string };

let mermaidInitialized = false;

function ensureMermaidInit(): void {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'strict',
    themeVariables: {
      darkMode: true,
      background: '#1c1a19',
      primaryColor: '#2a2826',
      primaryTextColor: '#fdfbf7',
      secondaryColor: '#3d3a38',
      lineColor: '#dcb844',
      mainBkg: '#2a2826',
      nodeBorder: '#dcb844',
      clusterBkg: '#1c1a19',
      titleColor: '#fdfbf7',
      edgeLabelBackground: '#2a2826',
    },
  });
  mermaidInitialized = true;
}

interface ExplanationVisualProps {
  visual: RendererVisualPayload;
}

export function ExplanationVisual({ visual }: ExplanationVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/:/g, '');
  const mermaidSource = visual.kind === 'mermaid' ? visual.source : '';

  useEffect(() => {
    if (visual.kind !== 'mermaid' || !containerRef.current) return;
    const el = containerRef.current;
    let cancelled = false;
    ensureMermaidInit();
    el.innerHTML = '';
    const renderId = `mmd-${reactId}-${Date.now()}`;
    mermaid
      .render(renderId, mermaidSource)
      .then(({ svg }) => {
        if (!cancelled) el.innerHTML = svg;
      })
      .catch(() => {
        if (!cancelled) {
          el.innerHTML =
            '<p style="color:rgba(255,255,255,0.4);font-size:12px;padding:8px">Could not render diagram.</p>';
        }
      });
    return () => {
      cancelled = true;
    };
  }, [visual.kind, mermaidSource, reactId]);

  if (visual.kind === 'image') {
    const src = `data:${visual.mimeType};base64,${visual.base64}`;
    return (
      <img
        src={src}
        alt="Explanation visual"
        className="max-h-56 w-full object-contain rounded-md mx-auto"
      />
    );
  }

  if (visual.kind === 'svg') {
    return (
      <div
        className="max-h-56 w-full overflow-auto flex items-center justify-center [&_svg]:max-w-full [&_svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: visual.svg }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="max-h-56 w-full overflow-auto flex justify-center items-start text-[12px] [&_svg]:max-w-full"
    />
  );
}
