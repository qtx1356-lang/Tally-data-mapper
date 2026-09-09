using System;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.App.ViewModels
{
    public class DashboardViewModel : INotifyPropertyChanged
    {
        private readonly MainViewModel _mainVM;

        public event PropertyChangedEventHandler? PropertyChanged;

        public string Host => _mainVM.ConnectionOptions.Host;
        public int Port => _mainVM.ConnectionOptions.Port;
        public string ConnectionStatusText => _mainVM.ConnectionStatus.ToString();
        public bool IsConnected => _mainVM.ConnectionStatus == TallyConnectionStatus.Connected;
        public string SelectedCompanyName => _mainVM.ActiveCompanyContext?.CompanyName ?? "No Company Selected";
        public string FinancialYear => _mainVM.ActiveCompanyContext?.DisplayFinancialYear ?? "N/A";
        public string Protocol => _mainVM.LastConnectionResult?.Protocol ?? "HTTP";
        public string LastTestTime => _mainVM.LastConnectionResult?.TestedAt.ToString("dd-MM-yyyy HH:mm:ss") ?? "Never";
        public string ResponseTime => _mainVM.LastConnectionResult != null ? $"{_mainVM.LastConnectionResult.ResponseTimeMs} ms" : "N/A";

        public DashboardViewModel(MainViewModel mainVM)
        {
            _mainVM = mainVM;
        }

        public void NotifyStateChanged()
        {
            OnPropertyChanged(nameof(Host));
            OnPropertyChanged(nameof(Port));
            OnPropertyChanged(nameof(ConnectionStatusText));
            OnPropertyChanged(nameof(IsConnected));
            OnPropertyChanged(nameof(SelectedCompanyName));
            OnPropertyChanged(nameof(FinancialYear));
            OnPropertyChanged(nameof(Protocol));
            OnPropertyChanged(nameof(LastTestTime));
            OnPropertyChanged(nameof(ResponseTime));
        }

        protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
