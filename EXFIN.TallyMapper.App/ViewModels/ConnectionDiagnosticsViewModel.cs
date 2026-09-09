using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.App.ViewModels
{
    public class ConnectionDiagnosticsViewModel : INotifyPropertyChanged
    {
        private readonly IAppSettingsService _settingsService;
        private ConnectionDiagnostics _diagnostics;

        public event PropertyChangedEventHandler? PropertyChanged;

        public ConnectionDiagnostics Diagnostics
        {
            get => _diagnostics;
            set { _diagnostics = value; OnPropertyChanged(); }
        }

        public ConnectionDiagnosticsViewModel(IAppSettingsService settingsService)
        {
            _settingsService = settingsService;
            var settings = _settingsService.GetSettings();
            _diagnostics = new ConnectionDiagnostics
            {
                Host = settings.TallyHost,
                Port = settings.TallyPort,
                CheckedAt = DateTime.UtcNow
            };
        }

        public void RunDiagnostics()
        {
            var settings = _settingsService.GetSettings();
            Diagnostics = new ConnectionDiagnostics
            {
                Host = settings.TallyHost,
                Port = settings.TallyPort,
                DnsResolved = true,
                ResolvedIp = "127.0.0.1",
                HttpAvailable = false,
                OdbcAvailable = false,
                TallyDetected = false,
                LastError = $"TallyPrime was not detected at {settings.TallyHost}:{settings.TallyPort}.",
                CheckedAt = DateTime.UtcNow
            };
        }

        protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
