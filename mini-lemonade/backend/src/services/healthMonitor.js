// Monitor de salud del servidor
export class ServerHealthMonitor {
  constructor() {
    this.startTime = Date.now();
    this.errors = [];
    this.warnings = [];
    this.maxErrors = 50;
    this.maxWarnings = 50;
  }

  addError(error) {
    this.errors.push({
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack
    });
    
    // Mantener solo los últimos N errores
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
    
    console.error('❌ Error registrado:', error.message);
  }

  addWarning(warning) {
    this.warnings.push({
      timestamp: new Date().toISOString(),
      message: warning
    });
    
    if (this.warnings.length > this.maxWarnings) {
      this.warnings.shift();
    }
    
    console.warn('⚠️ Advertencia:', warning);
  }

  getStatus() {
    const uptime = Date.now() - this.startTime;
    const uptimeSeconds = Math.floor(uptime / 1000);
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);

    return {
      status: 'healthy',
      uptime: {
        ms: uptime,
        seconds: uptimeSeconds,
        minutes: uptimeMinutes,
        hours: uptimeHours,
        formatted: `${uptimeHours}h ${uptimeMinutes % 60}m ${uptimeSeconds % 60}s`
      },
      errors: {
        total: this.errors.length,
        recent: this.errors.slice(-5)
      },
      warnings: {
        total: this.warnings.length,
        recent: this.warnings.slice(-5)
      },
      timestamp: new Date().toISOString()
    };
  }

  clear() {
    this.errors = [];
    this.warnings = [];
  }
}

export const monitor = new ServerHealthMonitor();

export default monitor;
