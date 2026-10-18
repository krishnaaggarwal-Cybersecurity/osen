import { NextResponse } from 'next/server';
import { getAuthenticatedOperator, hasSameOrigin, supabaseRequest } from '../../../lib/supabase/server';

interface DispatchConfig {
  escalation_seconds: number;
  confidence_threshold: number;
  language: 'bilingual' | 'hindi' | 'english';
  auto_dispatch_enabled: boolean;
  phone_override: string;
}

function toClientConfig(config: DispatchConfig) {
  return {
    escalationSeconds: config.escalation_seconds,
    confidenceThreshold: config.confidence_threshold,
    language: config.language,
    autoDispatchEnabled: config.auto_dispatch_enabled,
    phoneOverride: config.phone_override,
  };
}

export async function GET() {
  try {
    const operator = await getAuthenticatedOperator();
    if (!operator) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const [config] = await supabaseRequest<DispatchConfig[]>(operator, 'rpc/get_dispatch_config');
    if (!config) throw new Error('Dispatch configuration is missing.');
    return NextResponse.json({ config: toClientConfig(config) });
  } catch (error) {
    console.error('Failed to load dispatch configuration:', error);
    return NextResponse.json({ error: 'Unable to load dispatch configuration.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!hasSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
    const operator = await getAuthenticatedOperator();
    if (!operator) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    if (!['supervisor', 'admin'].includes(operator.profile.role)) {
      return NextResponse.json({ error: 'Supervisor access is required.' }, { status: 403 });
    }

    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (body.escalationSeconds !== undefined) {
      if (!Number.isInteger(body.escalationSeconds) || body.escalationSeconds < 5 || body.escalationSeconds > 60) {
        return NextResponse.json({ error: 'Escalation timeout must be between 5 and 60 seconds.' }, { status: 400 });
      }
      update.escalation_seconds = body.escalationSeconds;
    }
    if (body.confidenceThreshold !== undefined) {
      if (typeof body.confidenceThreshold !== 'number' || body.confidenceThreshold < 0.5 || body.confidenceThreshold > 0.95) {
        return NextResponse.json({ error: 'Confidence threshold must be between 0.5 and 0.95.' }, { status: 400 });
      }
      update.confidence_threshold = body.confidenceThreshold;
    }
    if (body.language !== undefined) {
      if (!['bilingual', 'hindi', 'english'].includes(body.language)) {
        return NextResponse.json({ error: 'Unsupported dispatch language.' }, { status: 400 });
      }
      update.language = body.language;
    }
    if (body.phoneOverride !== undefined) {
      if (typeof body.phoneOverride !== 'string' || body.phoneOverride.length > 32) {
        return NextResponse.json({ error: 'Invalid responder phone number.' }, { status: 400 });
      }
      const phone = body.phoneOverride.replace(/[\s()-]/g, '');
      if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) {
        return NextResponse.json({ error: 'Responder phone number must be in E.164 format.' }, { status: 400 });
      }
      update.phone_override = phone;
    }
    if (body.autoDispatchEnabled !== undefined) {
      if (typeof body.autoDispatchEnabled !== 'boolean') {
        return NextResponse.json({ error: 'Automatic escalation setting must be a boolean.' }, { status: 400 });
      }
      update.auto_dispatch_enabled = body.autoDispatchEnabled;
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No configuration fields provided.' }, { status: 400 });
    }
    update.updated_at = new Date().toISOString();

    await supabaseRequest<void>(operator, 'dispatch_config?id=eq.true', {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
    const [config] = await supabaseRequest<DispatchConfig[]>(operator, 'rpc/get_dispatch_config');
    if (!config) throw new Error('Dispatch configuration update returned no row.');
    return NextResponse.json({ config: toClientConfig(config) });
  } catch (error) {
    console.error('Failed to update dispatch configuration:', error);
    return NextResponse.json({ error: 'Unable to update dispatch configuration.' }, { status: 500 });
  }
}
