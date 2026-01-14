const express = require('express');
const healthController = require('../controllers/health');

const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Basic service endpoint (legacy)
 *     description: Legacy root endpoint maintained for backward compatibility.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service health check passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: express_backend
 *                 uptime:
 *                   type: number
 *                   example: 123
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/', healthController.check.bind(healthController));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Liveness probe
 *     description: Returns basic liveness information to indicate the service process is running.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: express_backend
 *                 uptime:
 *                   type: number
 *                   example: 123
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', healthController.check.bind(healthController));

/**
 * @swagger
 * /readiness:
 *   get:
 *     summary: Readiness probe
 *     description: Checks MongoDB connectivity by issuing a ping command. Returns 200 if DB is reachable, otherwise 503.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready to receive traffic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ready
 *       503:
 *         description: Service is not ready (MongoDB unreachable / misconfigured)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: not_ready
 *                 error:
 *                   type: string
 *                   example: MONGO_URI is not set
 */
router.get('/readiness', healthController.readiness.bind(healthController));

module.exports = router;

