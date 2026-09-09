using System.Windows;
using EXFIN.TallyMapper.App.ViewModels;
using EXFIN.TallyMapper.Core.Interfaces;

namespace EXFIN.TallyMapper.App
{
    public partial class MainWindow : Window
    {
        public MainViewModel ViewModel { get; }

        public MainWindow()
        {
            InitializeComponent();
            var settingsService = App.ServiceProvider.GetService(typeof(IAppSettingsService)) as IAppSettingsService;
            ViewModel = new MainViewModel(settingsService!);
            DataContext = ViewModel;
        }
    }
}
