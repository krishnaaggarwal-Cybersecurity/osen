'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Incident, DemoClip, EventLogEntry, SystemHealth } from '../types';
import { INITIAL_DEMO_CLIPS, ACCIDENT_PRESETS, CAMERA_LIST, type CameraInfo } from '../lib/mockData';
import { soundManager } from '../lib/audio';

export interface OperatorProfile {
  id: string;
  name: string;
  role: 'operator' | 'supervisor' | 'admin';
  assignedSector: string;
  email?: string;
}

type DispatchConfig = {
  escalationSeconds: number;
  confidenceThreshold: number;
  language: 'bilingual' | 'hindi' | 'english';
  autoDispatchEnabled: boolean;
  phoneOverride: string;
};

type IncidentAction = 'dismiss' | 'acknowledge' | 'dispatch' | 'auto-escalate';

interface AppContextType {
  isAuthenticated: boolean;
  authLoading: boolean;
  operationError: string | null;
  clearOperationError: () => void;
  operator: OperatorProfile;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (displayName: string, email: string, password: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => Promise<void>;
  incidents: Incident[];
  activeEscalationIncident: Incident | null;
  isEscalationModalOpen: boolean;
  openEscalationModal: (incident: Incident) => void;
  closeEscalationModal: () => void;
  dismissIncident: (id: string) => void;
  acknowledgeIncident: (id: string) => void;
  dispatchIncident: (id: string, responderType?: string) => void;
  triggerCollision: (customLocation?: string) => Promise<Incident | null>;
  activeClip: DemoClip;
  setActiveClip: (clip: DemoClip) => void;
  cameras: CameraInfo[];
  selectedCameraId: string;
  setSelectedCameraId: (id: string) => void;
  phoneOverride: string;
  setPhoneOverride: (phone: string) => Promise<void>;
  maskedPhone: string;
  eventLogs: EventLogEntry[];
  addEventLog: (type: EventLogEntry['type'], message: string, payload?: unknown) => void;
  systemHealth: SystemHealth;
  systemConfig: DispatchConfig;
  updateConfig: (newConfig: Partial<DispatchConfig>) => Promise<void>;
  resetDemoData: () => void;
  isAudioMuted: boolean;
  toggleAudioMute: () => boolean;
}

const DEFAULT_OPERATOR: OperatorProfile = {
  id: '',
  name: 'Operator',
  role: 'operator',
  assignedSector: 'Unassigned',
};

const DEFAULT_CONFIG: DispatchConfig = {
  escalationSeconds: 15,
  confidenceThreshold: 0.85,
  language: 'bilingual',
  autoDispatchEnabled: true,
  phoneOverride: '',
};

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const headers = new Headers(init?.headers);
    headers.set('Content-Type', 'application/json');
    const response = await fetch(url, {
      ...init,
      headers,
      cache: 'no-store',
    });
    const result = await response.json();
    if (!response.ok) return { data: null, error: result.error || 'Request failed.' };
    return { data: result as T, error: null };
  } catch {
    return { data: null, error: 'Unable to connect to the server.' };
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [operator, setOperator] = useState<OperatorProfile>(DEFAULT_OPERATOR);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [cameras] = useState<CameraInfo[]>(CAMERA_LIST);
  const [selectedCameraId, setSelectedCameraId] = useState('CAM-01');
  const [activeClip, setActiveClip] = useState<DemoClip>(INITIAL_DEMO_CLIPS[0]);
  const [phoneOverride, setPhoneOverrideState] = useState('');
  const [isEscalationModalOpen, setIsEscalationModalOpen] = useState(false);
  const [activeEscalationIncident, setActiveEscalationIncident] = useState<Incident | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [systemConfig, setSystemConfig] = useState<DispatchConfig>(DEFAULT_CONFIG);
  const [eventLogs, setEventLogs] = useState<EventLogEntry[]>([]);
  const presetIndexRef = useRef(0);
  const incidentsRef = useRef(incidents);
  const escalatingRef = useRef(new Set<string>());

  useEffect(() => {
    incidentsRef.current = incidents;
  }, [incidents]);

  const addEventLog = useCallback((type: EventLogEntry['type'], message: string, payload?: unknown) => {
    const entry: EventLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      payload,
    };
    setEventLogs((previous) => [entry, ...previous.slice(0, 49)]);
  }, []);

  const applyOperator = useCallback((profile: OperatorProfile) => {
    setOperator(profile);
    setIsAuthenticated(true);
  }, []);

  const refreshIncidents = useCallback(async () => {
    const result = await apiRequest<{ incidents: Incident[] }>('/api/incidents');
    if (result.data) {
      setOperationError(null);
      setIncidents(result.data.incidents);
      setActiveEscalationIncident((current) =>
        current ? result.data?.incidents.find((incident) => incident.id === current.id) ?? current : null,
      );
      return result.data.incidents;
    }
    if (result.error === 'Authentication required.') {
      setIsAuthenticated(false);
      setOperator(DEFAULT_OPERATOR);
      return null;
    }
    if (result.error) {
      addEventLog('api', `Incident refresh failed: ${result.error}`);
      setOperationError(result.error);
    }
    return null;
  }, [addEventLog]);

  const refreshConfig = useCallback(async () => {
    const result = await apiRequest<{ config: DispatchConfig }>('/api/config');
    if (!result.data) {
      if (result.error === 'Authentication required.') {
        setIsAuthenticated(false);
        setOperator(DEFAULT_OPERATOR);
        return;
      }
      if (result.error) {
        addEventLog('api', `Configuration load failed: ${result.error}`);
        setOperationError(result.error);
      }
      return;
    }
    setOperationError(null);
    setSystemConfig(result.data.config);
    setPhoneOverrideState(result.data.config.phoneOverride);
  }, [addEventLog]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiRequest<{ operator: OperatorProfile }>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!result.data) return { success: false, error: result.error || 'Sign-in failed.' };
    applyOperator(result.data.operator);
    addEventLog('action', `Operator ${result.data.operator.id} signed in.`);
    await Promise.all([refreshIncidents(), refreshConfig()]);
    return { success: true };
  }, [addEventLog, applyOperator, refreshConfig, refreshIncidents]);

  const signUp = useCallback(async (displayName: string, email: string, password: string) => {
    const result = await apiRequest<{ created: boolean; message: string }>('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'sign-up', displayName, email, password }),
    });
    if (!result.data) return { success: false, error: result.error || 'Could not create account.' };
    return { success: true, message: result.data.message };
  }, []);

  const logout = useCallback(async () => {
    const result = await apiRequest('/api/auth', { method: 'DELETE' });
    if (result.error) addEventLog('api', `Sign-out warning: ${result.error}`);
    setIsAuthenticated(false);
    setOperator(DEFAULT_OPERATOR);
    setIncidents([]);
    setActiveEscalationIncident(null);
    setIsEscalationModalOpen(false);
  }, [addEventLog]);

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      const result = await apiRequest<{ authenticated: boolean; operator?: OperatorProfile }>('/api/auth');
      if (active && result.data?.authenticated && result.data.operator) {
        applyOperator(result.data.operator);
        await Promise.all([refreshIncidents(), refreshConfig()]);
      }
      if (active) setAuthLoading(false);
    };
    void restoreSession();
    return () => {
      active = false;
    };
  }, [applyOperator, refreshConfig, refreshIncidents]);

  const mutateIncident = useCallback(async (id: string, action: IncidentAction, responderType?: string) => {
    const result = await apiRequest<{ incident: Incident }>(`/api/incidents/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, responderType }),
    });
    if (!result.data) {
      if (result.error && !(action === 'auto-escalate' && result.error.includes('has not expired'))) {
        addEventLog('api', `Incident ${action} failed: ${result.error}`, { incidentId: id });
        setOperationError(result.error);
      }
      return null;
    }
    const updated = result.data.incident;
    setIncidents((previous) => previous.map((item) => item.id === id ? updated : item));
    setOperationError(null);
    setActiveEscalationIncident((previous) => previous?.id === id ? updated : previous);
    addEventLog(action === 'auto-escalate' ? 'api' : 'action', `Incident ${id}: ${action}.`);
    return updated;
  }, [addEventLog]);

  const dismissIncident = useCallback((id: string) => {
    void mutateIncident(id, 'dismiss').then((updated) => {
      if (updated) setIsEscalationModalOpen(false);
    });
  }, [mutateIncident]);

  const acknowledgeIncident = useCallback((id: string) => {
    void mutateIncident(id, 'acknowledge').then((updated) => {
      if (updated) setIsEscalationModalOpen(false);
    });
  }, [mutateIncident]);

  const dispatchIncident = useCallback((id: string, responderType?: string) => {
    void mutateIncident(id, 'dispatch', responderType).then((updated) => {
      if (updated) setIsEscalationModalOpen(false);
    });
  }, [mutateIncident]);

  const triggerCollision = useCallback(async (customLocation?: string) => {
    const presetIndex = presetIndexRef.current++ % ACCIDENT_PRESETS.length;
    const result = await apiRequest<{ incident: Incident }>('/api/incidents', {
      method: 'POST',
      body: JSON.stringify({ presetIndex, customLocation }),
    });
    if (!result.data) {
      addEventLog('api', `Could not create incident: ${result.error || 'Unknown error.'}`);
      setOperationError(result.error || 'Could not create incident.');
      return null;
    }

    const incident = result.data.incident;
    setIncidents((previous) => [incident, ...previous.filter((item) => item.id !== incident.id)]);
    setActiveEscalationIncident(incident);
    setIsEscalationModalOpen(true);
    soundManager.playAlarmBeep();
    addEventLog('api', `Incident ${incident.id} saved with server-owned deadline.`);
    return incident;
  }, [addEventLog]);

  const updateConfig = useCallback(async (newConfig: Partial<DispatchConfig>) => {
    const result = await apiRequest<{ config: DispatchConfig }>('/api/config', {
      method: 'PUT',
      body: JSON.stringify(newConfig),
    });
    if (!result.data) {
      addEventLog('api', `Configuration update failed: ${result.error || 'Unknown error.'}`);
      setOperationError(result.error || 'Configuration update failed.');
      throw new Error(result.error || 'Configuration update failed.');
    }
    setSystemConfig(result.data.config);
    setPhoneOverrideState(result.data.config.phoneOverride);
  }, [addEventLog]);

  const setPhoneOverride = useCallback(async (phone: string) => {
    await updateConfig({ phoneOverride: phone });
  }, [updateConfig]);

  const maskedPhone = React.useMemo(() => {
    const cleaned = phoneOverride.replace(/\s+/g, '');
    if (cleaned.length >= 10) {
      return `${cleaned.substring(0, cleaned.length - 7)}XXXXXX${cleaned.substring(cleaned.length - 2)}`;
    }
    return phoneOverride || 'Not configured';
  }, [phoneOverride]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const refreshTimer = setInterval(() => {
      void refreshIncidents();
    }, 3000);
    const countdownTimer = setInterval(() => {
      const now = Date.now();
      const dueIds: string[] = [];
      const updatedIncidents = incidentsRef.current.map((incident) => {
        if (incident.status !== 'AWAITING' && incident.status !== 'DETECTED') return incident;
        const remainingSeconds = Math.max(0, Math.ceil((incident.deadlineTs - now) / 1000));
        if (remainingSeconds === 0 && !escalatingRef.current.has(incident.id)) {
          escalatingRef.current.add(incident.id);
          dueIds.push(incident.id);
        }
        return { ...incident, remainingSeconds };
      });
      incidentsRef.current = updatedIncidents;
      setIncidents(updatedIncidents);
      setActiveEscalationIncident((current) =>
        current ? updatedIncidents.find((incident) => incident.id === current.id) ?? current : null,
      );
      dueIds.forEach((id) => {
        void mutateIncident(id, 'auto-escalate').finally(() => {
          escalatingRef.current.delete(id);
        });
      });
    }, 1000);
    return () => {
      clearInterval(refreshTimer);
      clearInterval(countdownTimer);
    };
  }, [isAuthenticated, mutateIncident, refreshIncidents]);

  const openEscalationModal = (incident: Incident) => {
    setActiveEscalationIncident(incident);
    setIsEscalationModalOpen(true);
  };

  const closeEscalationModal = () => setIsEscalationModalOpen(false);
  const resetDemoData = () => {
    setActiveEscalationIncident(null);
    setIsEscalationModalOpen(false);
    void refreshIncidents();
    addEventLog('action', 'Refreshed persisted incident data. Incident history was retained.');
  };
  const toggleAudioMute = () => {
    const muted = soundManager.toggleMute();
    setIsAudioMuted(muted);
    return muted;
  };

  const [systemHealth] = useState<SystemHealth>({
    backend: true,
    model: false,
    twilio: false,
    fps: 0,
    latencyMs: 0,
    objectsDetected: 0,
  });

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        authLoading,
        operationError,
        clearOperationError: () => setOperationError(null),
        operator,
        login,
        signUp,
        logout,
        incidents,
        activeEscalationIncident,
        isEscalationModalOpen,
        openEscalationModal,
        closeEscalationModal,
        dismissIncident,
        acknowledgeIncident,
        dispatchIncident,
        triggerCollision,
        activeClip,
        setActiveClip,
        cameras,
        selectedCameraId,
        setSelectedCameraId,
        phoneOverride,
        setPhoneOverride,
        maskedPhone,
        eventLogs,
        addEventLog,
        systemHealth,
        systemConfig,
        updateConfig,
        resetDemoData,
        isAudioMuted,
        toggleAudioMute,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
