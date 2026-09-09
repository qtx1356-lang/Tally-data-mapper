using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Tally.Models;

namespace EXFIN.TallyMapper.App.ViewModels
{
    public class MainViewModel : INotifyPropertyChanged
    {
        private NavigationPage _currentPage = NavigationPage.Dashboard;
        private ApplicationState _appState = ApplicationState.Disconnected;
        private TallyConnectionStatus _connectionStatus = TallyConnectionStatus.Disconnected;
        private TallyConnectionOptions _connectionOptions = new TallyConnectionOptions();
        private TallyConnectionResult? _lastConnectionResult;
        private TallyCompanyContext? _activeCompanyContext;
        private TallyCapabilities _capabilities = new TallyCapabilities();
        private readonly IAppSettingsService _settingsService;

        public event PropertyChangedEventHandler? PropertyChanged;

        public NavigationPage CurrentPage
        {
            get => _currentPage;
            set { _currentPage = value; OnPropertyChanged(); }
        }

        public ApplicationState AppState
        {
            get => _appState;
            set { _appState = value; OnPropertyChanged(); OnPropertyChanged(nameof(ConnectionStatusText)); }
        }

        public TallyConnectionStatus ConnectionStatus
        {
            get => _connectionStatus;
            set { _connectionStatus = value; OnPropertyChanged(); OnPropertyChanged(nameof(ConnectionStatusText)); DashboardVM?.NotifyStateChanged(); }
        }

        public TallyConnectionOptions ConnectionOptions
        {
            get => _connectionOptions;
            set { _connectionOptions = value; OnPropertyChanged(); DashboardVM?.NotifyStateChanged(); }
        }

        public TallyConnectionResult? LastConnectionResult
        {
            get => _lastConnectionResult;
            set { _lastConnectionResult = value; OnPropertyChanged(); DashboardVM?.NotifyStateChanged(); }
        }

        public TallyCompanyContext? ActiveCompanyContext
        {
            get => _activeCompanyContext;
            set { _activeCompanyContext = value; OnPropertyChanged(); OnPropertyChanged(nameof(CurrentCompany)); DashboardVM?.NotifyStateChanged(); }
        }

        public TallyCapabilities Capabilities
        {
            get => _capabilities;
            set { _capabilities = value; OnPropertyChanged(); }
        }

        public string CurrentCompany => ActiveCompanyContext?.CompanyName ?? "No Company Connected";

        public string ConnectionStatusText => ConnectionStatus switch
        {
            TallyConnectionStatus.Connected => "Connected",
            TallyConnectionStatus.Connecting => "Connecting...",
            TallyConnectionStatus.Failed => "Connection Failed",
            TallyConnectionStatus.Timeout => "Connection Timeout",
            _ => "Disconnected"
        };

        public DashboardViewModel DashboardVM { get; }
        public ConnectionDiagnosticsViewModel DiagnosticsVM { get; }
        public SettingsViewModel SettingsVM { get; }

        public MainViewModel(IAppSettingsService settingsService)
        {
            _settingsService = settingsService;
            DashboardVM = new DashboardViewModel(this);
            DiagnosticsVM = new ConnectionDiagnosticsViewModel(settingsService);
            SettingsVM = new SettingsViewModel(settingsService);
        }

        public void Navigate(NavigationPage page)
        {
            CurrentPage = page;
        }

        protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
