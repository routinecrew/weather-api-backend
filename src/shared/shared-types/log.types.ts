export interface CustomLogData {
  level: string;
  message: string;
  timestamp: string;
  meta?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  error?: {
    message: string;
    stack: string;
  };
}
