import { jest } from '@jest/globals';
import { restrictTo } from '../middleware/auth.js';

describe('auth middleware role restriction', () => {
  const makeRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('denies access when agent does not have the required role', () => {
    const req = { agent: { role: 'agent' } };
    const res = makeRes();
    const next = jest.fn();

    const middleware = restrictTo('manager');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Access denied',
        error: 'You do not have permission to access this resource'
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('allows access when agent has the required role', () => {
    const req = { agent: { role: 'manager' } };
    const res = makeRes();
    const next = jest.fn();

    const middleware = restrictTo('manager');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test('returns 401 when agent information is missing', () => {
    const req = {};
    const res = makeRes();
    const next = jest.fn();

    const middleware = restrictTo('manager');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Not authorized',
        error: 'Agent information is required to perform this action'
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
