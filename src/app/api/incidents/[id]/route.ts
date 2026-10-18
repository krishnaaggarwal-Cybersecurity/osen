import { NextResponse } from 'next/server';
import type { Incident } from '../../../../types';
import { getAuthenticatedOperator, hasSameOrigin, supabaseRequest } from '../../../../lib/supabase/server';

interface IncidentRow {
  id: string;
  status: Incident['status'];
  deadline_at: string;
  data: Incident;
}

function presentIncident(row: IncidentRow): Incident {
  const deadlineTs = new Date(row.deadline_at).getTime();
  return {
    ...row.data,
    id: row.id,
    status: row.status,
    deadlineTs,
    remainingSeconds: Math.max(0, Math.ceil((deadlineTs - Date.now()) / 1000)),
  };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!hasSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
    const operator = await getAuthenticatedOperator();
    if (!operator) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const { id } = await context.params;
    const body = await request.json();
    const allowedActions = ['dismiss', 'acknowledge', 'dispatch', 'auto-escalate'];
    if (typeof body.action !== 'string' || !allowedActions.includes(body.action)) {
      return NextResponse.json({ error: 'Unsupported incident action.' }, { status: 400 });
    }

    const rows = await supabaseRequest<IncidentRow[]>(operator, 'rpc/transition_incident', {
      method: 'POST',
      body: JSON.stringify({
        p_id: id,
        p_action: body.action,
        p_responder: typeof body.responderType === 'string' ? body.responderType.slice(0, 120) : null,
      }),
    });
    if (!rows[0]) return NextResponse.json({ error: 'Incident not found.' }, { status: 404 });

    const incident = presentIncident(rows[0]);
    if (body.action === 'auto-escalate' && incident.status !== 'AUTO-ESCALATED') {
      return NextResponse.json({ error: 'Incident is not due for escalation.' }, { status: 409 });
    }
    return NextResponse.json({ incident });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update incident.';
    if (message.includes('INCIDENT_NOT_ACTIONABLE')) {
      return NextResponse.json({ error: 'Incident has already been handled.' }, { status: 409 });
    }
    if (message.includes('INCIDENT_NOT_DUE')) {
      return NextResponse.json({ error: 'Incident deadline has not expired.' }, { status: 409 });
    }
    console.error('Failed to update incident:', error);
    return NextResponse.json({ error: 'Unable to update incident.' }, { status: 500 });
  }
}
