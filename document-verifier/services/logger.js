import fs from 'fs';
import path from 'path';

class Logger {
  constructor() {
    this.logDir = 'logs';
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir);
    }
  }

  formatMessage(level, message, metadata = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      pid: process.pid
    }) + '\n';
  }

  writeToFile(filename, content) {
    const filepath = path.join(this.logDir, filename);
    fs.appendFileSync(filepath, content);
  }

  info(message, metadata = {}) {
    const formatted = this.formatMessage('INFO', message, metadata);
    console.log(`ℹ️  ${message}`, metadata);
    this.writeToFile('app.log', formatted);
  }

  warn(message, metadata = {}) {
    const formatted = this.formatMessage('WARN', message, metadata);
    console.warn(`⚠️  ${message}`, metadata);
    this.writeToFile('app.log', formatted);
  }

  error(message, metadata = {}) {
    const formatted = this.formatMessage('ERROR', message, metadata);
    console.error(`❌ ${message}`, metadata);
    this.writeToFile('error.log', formatted);
    this.writeToFile('app.log', formatted);
  }

  verification(action, data) {
    const formatted = this.formatMessage('VERIFICATION', action, data);
    console.log(`🔍 ${action}`, data);
    this.writeToFile('verification.log', formatted);
    this.writeToFile('app.log', formatted);
  }

  suspicious(message, data) {
    const formatted = this.formatMessage('SUSPICIOUS', message, data);
    console.warn(`🚨 SUSPICIOUS ACTIVITY: ${message}`, data);
    this.writeToFile('suspicious.log', formatted);
    this.writeToFile('app.log', formatted);
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;
