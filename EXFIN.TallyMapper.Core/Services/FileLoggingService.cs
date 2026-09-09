using System;
using System.IO;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Utilities;

namespace EXFIN.TallyMapper.Core.Services
{
    public class FileLoggingService : ILoggingService
    {
        private readonly string _logFilePath;
        private readonly object _lock = new object();

        public FileLoggingService()
        {
            PathUtils.EnsureDirectoriesExist();
            _logFilePath = Path.Combine(PathUtils.LogsFolder, $"tally_mapper_{DateTime.Now:yyyyMMdd}.log");
        }

        public void LogInfo(string message) => WriteLog("INFO", message);
        public void LogWarning(string message) => WriteLog("WARN", message);
        public void LogError(string message, Exception? ex = null)
        {
            string detail = ex != null ? $"{message} | Exception: {ex.GetType().Name} - {ex.Message}" : message;
            WriteLog("ERROR", detail);
        }
        public void LogDebug(string message) => WriteLog("DEBUG", message);

        private void WriteLog(string level, string message)
        {
            try
            {
                lock (_lock)
                {
                    string logLine = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] [{level}] {message}{Environment.NewLine}";
                    File.AppendAllText(_logFilePath, logLine);
                }
            }
            catch
            {
                // Silently ignore log write failures to prevent application crash
            }
        }
    }
}
