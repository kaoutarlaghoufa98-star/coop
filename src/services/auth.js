// ════════════════════════════════════════════════
// COOP TAFERNOUT — Authentication Service
// Firebase Auth integration with device protection
// ════════════════════════════════════════════════

const { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } = require('firebase/auth');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class AuthService {
  constructor() {
    this.auth = getAuth();
    this.currentUser = null;
    this.sessionToken = null;
    this.JWT_SECRET = 'coop-tafernout-jwt-secret-2025'; // In production, use env variable
  }

  async initialize() {
    return new Promise((resolve) => {
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
        if (user) {
          this.generateSessionToken(user);
        }
        resolve(user);
      });
    });
  }

  async login(email, password) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);

      // Verify subscription status
      const subscriptionValid = await this.verifySubscription(result.user.uid);
      if (!subscriptionValid) {
        await signOut(this.auth);
        throw new Error('Subscription expired or inactive');
      }

      // Check device authorization
      const deviceAuthorized = await this.checkDeviceAuthorization(result.user.uid);
      if (!deviceAuthorized) {
        await signOut(this.auth);
        throw new Error('Device not authorized. Please contact support.');
      }

      // Generate session token
      this.generateSessionToken(result.user);

      return {
        user: result.user,
        token: this.sessionToken
      };
    } catch (error) {
      throw error;
    }
  }

  async register(email, password) {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);

      // Initialize user in local database
      const db = require('./database').default;
      const database = new db();

      database.createUser({
        id: result.user.uid,
        email: result.user.email,
        firebaseUid: result.user.uid,
        subscriptionStatus: 'trial' // Start with trial
      });

      database.close();

      return result.user;
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    await signOut(this.auth);
    this.currentUser = null;
    this.sessionToken = null;
  }

  generateSessionToken(user) {
    this.sessionToken = jwt.sign(
      {
        uid: user.uid,
        email: user.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      this.JWT_SECRET
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  async verifySubscription(uid) {
    // Check local database first (for offline support)
    const db = require('./database').default;
    const database = new db();
    const user = database.getUser(uid);
    database.close();

    if (!user) return false;

    // If offline, allow grace period
    const now = new Date();
    if (user.subscription_end) {
      const endDate = new Date(user.subscription_end);
      const gracePeriod = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (now > endDate && (now - endDate) > gracePeriod) {
        return false;
      }
    }

    // Try online verification (if internet available)
    try {
      const response = await fetch(`${process.env.BACKEND_URL}/subscription/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.sessionToken}`
        },
        body: JSON.stringify({ uid }),
        timeout: 5000
      });

      return response.ok;
    } catch (error) {
      // Offline - use local validation
      return user.subscription_status === 'active' || user.subscription_status === 'trial';
    }
  }

  async checkDeviceAuthorization(uid) {
    const fingerprint = await this.getDeviceFingerprint();

    // Check local database
    const db = require('./database').default;
    const database = new db();
    const device = database.getDevice(fingerprint);

    if (device && device.authorized) {
      // Update last seen
      database.registerDevice({
        ...device,
        last_seen: new Date()
      });
      database.close();
      return true;
    }

    database.close();

    // Try online check
    try {
      const response = await fetch(`${process.env.BACKEND_URL}/devices/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.sessionToken}`
        },
        body: JSON.stringify({ uid, fingerprint }),
        timeout: 5000
      });

      if (response.ok) {
        // Register device locally
        const database = new db();
        database.registerDevice({
          id: crypto.randomUUID(),
          userId: uid,
          fingerprint,
          name: 'Current Device',
          authorized: true
        });
        database.close();
        return true;
      }
    } catch (error) {
      // Offline - deny access if device not locally authorized
      return false;
    }

    return false;
  }

  async getDeviceFingerprint() {
    // Generate unique device fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);

    const fingerprintData = [
      canvas.toDataURL(),
      navigator.userAgent,
      screen.width + 'x' + screen.height,
      navigator.language,
      new Date().getTimezoneOffset()
    ].join('|');

    return crypto.createHash('sha256').update(fingerprintData).digest('hex');
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getSessionToken() {
    return this.sessionToken;
  }

  isAuthenticated() {
    return !!this.currentUser && !!this.sessionToken;
  }
}

module.exports = AuthService;