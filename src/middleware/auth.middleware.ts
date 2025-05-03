import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: any;
}

export const requireAuthentication = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.auth_token;
  if (!token) {
    res.status(401).json({ message: 'Missing or invalid token' });
  } else if (isTokenExpired(token)) {
    res.clearCookie('auth_token');
    res.status(401).json({ message: 'Token expired' });
  } else {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

      if (!decoded) {
        res.status(401).json({ message: 'Unauthorized - Invalid token' });
      }

      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ message: 'Invalid token' });
    }
  }
}

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.auth_token;
    if (!token) {
      res.status(401).json({ message: 'Missing or invalid token' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
      const role = decoded.role;

      if (roles.includes(role)) {
        req.user = decoded;
        next();
      } else {
        res.status(403).json({ message: 'Forbidden: Insufficient role' });
      }
    } catch (err) {
      res.status(401).json({ message: 'Invalid token' });
    }
  }
};

export const getUserInfo = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    req.body = req.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded || !decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (err) {
    return true;
  }
}
