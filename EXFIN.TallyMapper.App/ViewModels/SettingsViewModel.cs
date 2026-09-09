using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Interfaces;
using EXFIN.TallyMapper.Core.Models;

namespace EXFIN.TallyMapper.App.ViewModels
{
    public class SettingsViewModel : INotifyPropertyChanged
    {
        private readonly IAppSettingsService _settingsService;
        private AppSettings _settings;

        public event PropertyChangedEventHandler? PropertyChanged;

        public AppSettings Settings
        {
            get => _settings;
            set { _settings = value; OnPropertyChanged(); }
        }

        public SettingsViewModel(IAppSettingsService settingsService)
        {
            _settingsService = settingsService;
            _settings = _settingsService.GetSettings();
        }

        public async Task SaveAsync()
        {
            await _settingsService.SaveSettingsAsync(Settings);
        }

        protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
