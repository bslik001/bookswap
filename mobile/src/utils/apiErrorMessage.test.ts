import { describe, it, expect } from 'vitest';
import { ApiError } from '@/types/api';
import { apiErrorMessage } from './apiErrorMessage';

describe('apiErrorMessage', () => {
  it('maps known ApiError codes to a French message', () => {
    const err = new ApiError('INVALID_CREDENTIALS', 'Invalid creds', 401);
    expect(apiErrorMessage(err)).toBe('Email ou mot de passe incorrect.');
  });

  it('falls back to ApiError.message when the code is unknown', () => {
    const err = new ApiError('SOME_NEW_CODE', 'Quelque chose a foire', 500);
    expect(apiErrorMessage(err)).toBe('Quelque chose a foire');
  });

  it('returns the fallback for an Error whose message is empty', () => {
    expect(apiErrorMessage(new Error(''), 'Defaut')).toBe('Defaut');
  });

  it('returns the message from a generic Error', () => {
    expect(apiErrorMessage(new Error('Network down'))).toBe('Network down');
  });

  it('returns the fallback for unknown values (string, null)', () => {
    expect(apiErrorMessage('boom', 'Defaut')).toBe('Defaut');
    expect(apiErrorMessage(null, 'Defaut')).toBe('Defaut');
    expect(apiErrorMessage(undefined, 'Defaut')).toBe('Defaut');
  });
});
