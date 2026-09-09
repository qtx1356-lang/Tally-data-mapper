using System.Threading.Tasks;
using EXFIN.TallyMapper.Database.Repositories;
using Xunit;

namespace EXFIN.TallyMapper.Tests.Database
{
    public class DatabaseInitializationTests
    {
        [Fact]
        public async Task LoadSettings_ReturnsDefaultOrDbSettings()
        {
            var repo = new AppSettingsRepository();
            var settings = await repo.LoadSettingsAsync();

            Assert.NotNull(settings);
            Assert.False(string.IsNullOrEmpty(settings.TallyHost));
            Assert.True(settings.TallyPort > 0);
        }
    }
}
