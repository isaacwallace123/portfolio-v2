import type { ProjectPage } from '../lib/types';

export interface PageTreeNode {
  page: ProjectPage;
  children: PageTreeNode[];
  level: number;
}

export function buildPageTree(pages: ProjectPage[]): PageTreeNode[] {
  const startPage = pages.find(p => p.isStartPage);
  if (!startPage) return [];

  const childrenMap = new Map<string, ProjectPage[]>();

  pages.forEach(page => {
    if (page.outgoingConnections) {
      const children = page.outgoingConnections
        .map(conn => pages.find(p => p.id === conn.targetPageId))
        .filter((p): p is ProjectPage => p !== undefined)
        .sort((a, b) => {
          const posA = a.position as { x: number; y: number } | null;
          const posB = b.position as { x: number; y: number } | null;
          if (!posA || !posB) return 0;
          return posA.x - posB.x;
        });

      childrenMap.set(page.id, children);
    }
  });

  const visitedIds = new Set<string>();

  function buildNode(page: ProjectPage, level: number, localVisited: Set<string> = new Set()): PageTreeNode {
    if (localVisited.has(page.id)) {
      return { page, children: [], level };
    }

    localVisited.add(page.id);
    visitedIds.add(page.id);

    const children = childrenMap.get(page.id) || [];
    const childNodes = children.map(child => buildNode(child, level + 1, new Set(localVisited)));

    return { page, children: childNodes, level };
  }

  const rootNode = buildNode(startPage, 0);

  function flattenTree(node: PageTreeNode): PageTreeNode[] {
    const result: PageTreeNode[] = [node];
    node.children.forEach(child => {
      result.push(...flattenTree(child));
    });
    return result;
  }

  const connectedNodes = flattenTree(rootNode);

  // Include pages not reachable from the start page (orphaned/disconnected)
  const orphanNodes: PageTreeNode[] = pages
    .filter(p => !visitedIds.has(p.id))
    .map(p => ({ page: p, children: [], level: 0 }));

  return [...connectedNodes, ...orphanNodes];
}
