import { useReducer, Dispatch } from 'react';

/**
 * Consolidated form state management to prevent render thrashing
 * Replaces multiple useState calls with a single useReducer
 */

export interface FormState {
  displayName: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  language: string;
  [key: string]: string | boolean;
}

export type FormAction = 
  | { type: 'SET_FIELD'; field: keyof FormState; value: string | boolean }
  | { type: 'RESET' }
  | { type: 'LOAD'; payload: Partial<FormState> };

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'LOAD':
      return { ...state, ...action.payload };
    case 'RESET':
      return {
        displayName: '',
        emailNotifications: true,
        smsNotifications: false,
        language: 'en'
      };
    default:
      return state;
  }
};

const initialFormState: FormState = {
  displayName: '',
  emailNotifications: true,
  smsNotifications: false,
  language: 'en'
};

export const useFormState = (): [FormState, Dispatch<FormAction>] => {
  return useReducer(formReducer, initialFormState);
};
