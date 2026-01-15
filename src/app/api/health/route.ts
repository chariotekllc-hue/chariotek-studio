/**
 * Health Check API Endpoint
 * 
 * Used for monitoring and load balancer health checks.
 * Returns system status and basic metrics.
 */

import { NextResponse } from 'next/server';

// Health check response type
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail';
      message?: string;
    };
  };
}

export async function GET() {
  const startTime = Date.now();
  
  const response: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {}
  };

  // Check 1: Basic server health
  response.checks['server'] = {
    status: 'pass',
    message: 'Server is running'
  };

  // Check 2: Environment variables
  const requiredEnvVars = ['NODE_ENV'];
  const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingEnvVars.length === 0) {
    response.checks['environment'] = {
      status: 'pass',
      message: 'All required environment variables are set'
    };
  } else {
    response.checks['environment'] = {
      status: 'fail',
      message: `Missing: ${missingEnvVars.join(', ')}`
    };
    response.status = 'degraded';
  }

  // Check 3: Memory usage
  const memoryUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const heapPercentage = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);

  if (heapPercentage < 90) {
    response.checks['memory'] = {
      status: 'pass',
      message: `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapPercentage}%)`
    };
  } else {
    response.checks['memory'] = {
      status: 'fail',
      message: `High memory usage: ${heapPercentage}%`
    };
    response.status = 'degraded';
  }

  // Add response time
  const responseTime = Date.now() - startTime;
  response.checks['response_time'] = {
    status: responseTime < 1000 ? 'pass' : 'fail',
    message: `${responseTime}ms`
  };

  // Determine overall status
  const failedChecks = Object.values(response.checks).filter(c => c.status === 'fail');
  if (failedChecks.length > 2) {
    response.status = 'unhealthy';
  }

  // Return appropriate status code
  const statusCode = response.status === 'healthy' ? 200 : 
                     response.status === 'degraded' ? 200 : 503;

  return NextResponse.json(response, { status: statusCode });
}
