import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/features/auth/model/session';

const INFRA_URL = process.env.INFRA_API_URL || 'http://infra-agent:8080';
const INFRA_KEY = process.env.INFRA_API_KEY || '';

// Admin-only actions
const ADMIN_ACTIONS = new Set(['networks', 'system']);

// Public actions (needed by the homelab page)
const PUBLIC_ACTIONS = new Set(['containers', 'stats', 'logs', 'metrics', 'metricsrange']);

async function proxyToInfra(path: string): Promise<Response> {
  const url = `${INFRA_URL}${path}`;
  return fetch(url, {
    headers: { 'X-API-Key': INFRA_KEY },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!action) {
      return NextResponse.json({ error: 'Action parameter required' }, { status: 400 });
    }

    // Check if admin-only action
    if (ADMIN_ACTIONS.has(action)) {
      await requireAdmin();
    }

    // Also allow public actions without auth
    if (!ADMIN_ACTIONS.has(action) && !PUBLIC_ACTIONS.has(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    let path: string;
    switch (action) {
      case 'containers':
        path = '/containers';
        break;
      case 'stats': {
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Container ID required' }, { status: 400 });
        path = `/containers/${id}/stats`;
        break;
      }
      case 'logs': {
        const id = searchParams.get('id');
        const tail = searchParams.get('tail') || '50';
        if (!id) return NextResponse.json({ error: 'Container ID required' }, { status: 400 });
        path = `/containers/${id}/logs?tail=${tail}`;
        break;
      }
      case 'networks':
        path = '/networks';
        break;
      case 'system':
        path = '/system';
        break;
      case 'metrics':
        path = '/metrics/node';
        break;
      case 'metricsrange': {
        const duration = searchParams.get('duration') || '5m';
        const container = searchParams.get('container') || '';
        path = `/metrics/range?duration=${duration}&container=${encodeURIComponent(container)}`;
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const response = await proxyToInfra(path);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    // If it's a redirect from requireAdmin, rethrow
    if (error && typeof error === 'object' && 'digest' in error) throw error;

    console.error('Error proxying to infra agent:', error);
    return NextResponse.json(
      { error: 'Infrastructure agent unavailable' },
      { status: 503 }
    );
  }
}
