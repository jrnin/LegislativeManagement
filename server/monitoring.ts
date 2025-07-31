// New Relic monitoring initialization
export async function initializeMonitoring() {
  if (process.env.NEW_RELIC_LICENSE_KEY) {
    try {
      // Set New Relic configuration via environment variables
      process.env.NEW_RELIC_APP_NAME = 'Sistema Legislativo Jaíba';
      process.env.NEW_RELIC_DISTRIBUTED_TRACING_ENABLED = 'true';
      process.env.NEW_RELIC_LOG_LEVEL = 'info';
      
      // Import New Relic dynamically
      const newrelic = await import('newrelic') as any;
      console.log('✅ New Relic monitoring initialized successfully');
      return newrelic.default;
    } catch (error) {
      console.warn('⚠️ Failed to initialize New Relic:', error);
      return null;
    }
  } else {
    console.log('ℹ️ New Relic monitoring disabled (no license key)');
    return null;
  }
}

// Custom monitoring helpers
export function logPerformance(operation: string, startTime: number) {
  const duration = Date.now() - startTime;
  console.log(`📊 ${operation} completed in ${duration}ms`);
}

export function logError(error: any, context?: string) {
  console.error(`❌ Error${context ? ` in ${context}` : ''}:`, error);
}