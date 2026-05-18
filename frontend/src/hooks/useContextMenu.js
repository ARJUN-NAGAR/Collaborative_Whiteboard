import { useState, useCallback } from 'react';

/**
 * useContextMenu
 * Returns state + handler to show/hide the canvas right-click context menu.
 *
 * Usage in WhiteboardCanvas:
 *   const { contextMenu, showContextMenu, closeContextMenu } = useContextMenu();
 *
 *   // on the canvas container:
 *   onContextMenu={showContextMenu}
 *
 *   // render:
 *   {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} ... onClose={closeContextMenu} />}
 */
export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState(null); // { x, y }

  const showContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  return { contextMenu, showContextMenu, closeContextMenu };
}