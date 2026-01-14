const { pingMongo } = require('../db');

class HealthController {
  /**
   * PUBLIC_INTERFACE
   * Liveness endpoint. Returns basic runtime information.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  check(req, res) {
    /** This is a public function. */
    return res.status(200).json({
      status: 'ok',
      service: 'express_backend',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * PUBLIC_INTERFACE
   * Readiness endpoint. Checks MongoDB connectivity by performing a ping.
   * - 200 { status: 'ready' } when MongoDB ping succeeds
   * - 503 { status: 'not_ready', error: <message> } when it fails
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  async readiness(req, res) {
    /** This is a public function. */
    try {
      await pingMongo();
      console.log('[readiness] MongoDB ping ok');
      return res.status(200).json({ status: 'ready' });
    } catch (error) {
      const message = error?.message ? String(error.message) : 'Unknown error';
      console.error('[readiness] MongoDB ping failed:', message);
      return res.status(503).json({ status: 'not_ready', error: message });
    }
  }
}

module.exports = new HealthController();

