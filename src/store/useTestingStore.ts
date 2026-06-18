import { create } from 'zustand';

export interface PerfMetric {
  type: string;
  name: string;
  value: number;
  timestamp: number;
}

export interface A11yIssue {
  element: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
}

export interface InteractionEvent {
  type: string;
  target: string;
  timestamp: number;
  path: string;
  value?: string;
}

export interface BugReport {
  id: string;
  description: string;
  timestamp: number;
  viewState: string;
}

interface TestingState {
  perfMetrics: PerfMetric[];
  a11yIssues: A11yIssue[];
  interactionEvents: InteractionEvent[];
  bugReports: BugReport[];
  isTrackingEvents: boolean;
  
  addPerfMetric: (metric: Omit<PerfMetric, 'timestamp'>) => void;
  addA11yIssue: (issue: Omit<A11yIssue, 'timestamp'>) => void;
  addInteractionEvent: (event: Omit<InteractionEvent, 'timestamp'>) => void;
  addBugReport: (report: Omit<BugReport, 'id' | 'timestamp'>) => void;
  clearInteractionEvents: () => void;
  setTrackingEvents: (tracking: boolean) => void;
  runA11yScan: () => void;
}

export const useTestingStore = create<TestingState>((set, get) => ({
  perfMetrics: [],
  a11yIssues: [],
  interactionEvents: [],
  bugReports: [],
  isTrackingEvents: true,
  
  addPerfMetric: (metric) => set((state) => ({
    perfMetrics: [...state.perfMetrics, { ...metric, timestamp: Date.now() }].slice(-100) // Keep last 100
  })),
  
  addA11yIssue: (issue) => set((state) => ({
    a11yIssues: [...state.a11yIssues, { ...issue, timestamp: Date.now() }]
  })),
  
  addInteractionEvent: (event) => set((state) => {
    if (!state.isTrackingEvents) return state;
    return {
      interactionEvents: [...state.interactionEvents, { ...event, timestamp: Date.now() }].slice(-200) // Keep last 200
    };
  }),

  addBugReport: (report) => set((state) => ({
    bugReports: [...state.bugReports, { ...report, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() }]
  })),

  clearInteractionEvents: () => set({ interactionEvents: [] }),
  setTrackingEvents: (tracking) => set({ isTrackingEvents: tracking }),
  
  runA11yScan: () => {
    // A lightweight heuristic DOM scanner for immediate accessibility feedback
    const newIssues: Omit<A11yIssue, 'timestamp'>[] = [];
    
    // 1. Check for missing alt text on images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.hasAttribute('alt')) {
        newIssues.push({
          element: '<img>',
          issue: `Missing 'alt' attribute on image with src: ${img.src.substring(0, 30)}...`,
          severity: 'high'
        });
      }
    });

    // 2. Check buttons for missing text or aria-labels
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      if (!btn.textContent?.trim() && !btn.hasAttribute('aria-label')) {
        newIssues.push({
          element: '<button>',
          issue: 'Button missing text content and aria-label',
          severity: 'high'
        });
      }
    });

    // 3. Check for inputs without associated labels or aria-labels
    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
    inputs.forEach(input => {
      const id = input.id;
      const hasLabelBlock = id ? document.querySelector(`label[for="${id}"]`) : false;
      const hasParentLabel = input.closest('label');
      const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
      
      if (!hasLabelBlock && !hasParentLabel && !hasAriaLabel) {
        newIssues.push({
          element: `<${input.tagName.toLowerCase()}>`,
          issue: `Form control missing accessible label`,
          severity: 'high'
        });
      }
    });
    
    set({ a11yIssues: newIssues.map(i => ({ ...i, timestamp: Date.now() })) });
  }
}));
