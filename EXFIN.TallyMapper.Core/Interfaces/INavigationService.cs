using System;
using EXFIN.TallyMapper.Core.Enums;

namespace EXFIN.TallyMapper.Core.Interfaces
{
    public interface INavigationService
    {
        NavigationPage CurrentPage { get; }
        event Action<NavigationPage>? CurrentPageChanged;
        void NavigateTo(NavigationPage page);
    }
}
